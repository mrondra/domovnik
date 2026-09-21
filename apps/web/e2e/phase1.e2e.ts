import { expect, test, type Page } from '@playwright/test';
import { DEMO_PASSWORD, demoUser, WALKTHROUGH_CHAIR, WALKTHROUGH_HOUSE } from './demo-tenant';

/**
 * The ten-minute walkthrough of `docs/demo-scenar.md`, clicked through end to end: an invoice
 * arrives, the platform reads it, an agent proposes it, the committee approves it, it lands in the
 * accounting, the statement pays it, and a change made in Pohoda comes back as a difference.
 *
 * Everything runs offline — the extraction replays recorded answers, the agent harness talks to the
 * endpoint `global-setup.ts` starts — and against the real workers, so what it proves is the chain
 * and not a mock of it (task 026).
 */
test.describe.configure({ mode: 'serial' });

const SLOW = 120_000;

/** Whoever was signed in before is not this person: the walkthrough changes hands several times. */
const signInAs = async (page: Page, email: string): Promise<void> => {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Heslo').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Přihlásit' }).click();
  await page.waitForURL('/');
};

const signIn = (page: Page, role: Parameters<typeof demoUser>[0]): Promise<void> =>
  signInAs(page, demoUser(role));

/** The card of one scenario: its heading on one side, its button on the other. */
const runScenario = async (page: Page, title: string | RegExp): Promise<void> => {
  const card = page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: title }) })
    .filter({ has: page.getByRole('button', { name: 'Spustit' }) })
    .last();

  await card.getByRole('button', { name: 'Spustit' }).click();
};

/** The card of the house the walkthrough is about, and the screen of it to open. */
const openHouse = async (page: Page, screen: string): Promise<void> => {
  await page.goto('/svj');
  await page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: new RegExp(WALKTHROUGH_HOUSE, 'u') }) })
    .filter({ has: page.getByRole('link', { name: 'Otevřít SVJ' }) })
    .last()
    .getByRole('link', { name: 'Otevřít SVJ' })
    .click();
  await page.getByRole('link', { name: screen, exact: true }).click();
};

test('the person showing it starts from a clean tenant', async ({ page }) => {
  await signIn(page, 'tenant-admin');
  await page.goto('/demo');

  await page.getByRole('button', { name: 'Resetovat demo' }).click();

  await expect(page.getByText(/Smazáno \d+ záznamů/u)).toBeVisible({ timeout: SLOW });
});

test('an invoice arrives and the platform reads it without anybody touching it', async ({ page }) => {
  await signIn(page, 'tenant-admin');
  await page.goto('/demo');

  await runScenario(page, 'Běžná měsíční faktura za úklid');

  await expect(page.getByText('Faktura byla doručena')).toBeVisible({ timeout: SLOW });
});

test('the committee finds it in the inbox with the agent’s reasoning, and approves it', async ({ page }) => {
  await signInAs(page, WALKTHROUGH_CHAIR);

  await expect(async () => {
    await page.goto('/approvals');
    await expect(page.getByRole('link', { name: 'invoice.approve' })).toBeVisible();
  }).toPass({ timeout: SLOW });

  await page.getByRole('link', { name: 'invoice.approve' }).first().click();
  await expect(page.getByText(/Doporučuji schválit|Úklid společných prostor/u)).toBeVisible();

  await page.getByRole('button', { name: 'Schválit' }).click();
  await expect(page.getByText('Schváleno')).toBeVisible({ timeout: SLOW });
});

test('and the approved invoice is written into the accounting by itself', async ({ page }) => {
  await signIn(page, 'finance');

  await expect(async () => {
    await page.goto('/invoices');
    await expect(page.getByText('Zaúčtovaná').first()).toBeVisible();
  }).toPass({ timeout: SLOW });

  await openHouse(page, 'Účetnictví');
  await expect(page.getByRole('heading', { name: /Účetní jednotka/u })).toBeVisible();
  await expect(page.getByText('Zápis faktury').first()).toBeVisible();
});

test('the statement arrives from Pohoda and settles what it can on its own', async ({ page }) => {
  await signIn(page, 'tenant-admin');
  await page.goto('/demo');

  await runScenario(page, new RegExp(`Načíst výpis za rok.*${WALKTHROUGH_HOUSE}`, 'u'));

  await expect(page.getByText(/Načteno \d+ pohybů/u)).toBeVisible({ timeout: SLOW });
});

test('what the rules could not settle waits for a person, and the ledger shows the rest', async ({
  page,
}) => {
  await signIn(page, 'finance');
  await openHouse(page, 'Platby');

  await page.getByRole('link', { name: 'Nespárováno' }).click();
  await expect(page).toHaveURL(/status=unmatched/u);
  await expect(page.getByRole('heading', { name: 'Platby' })).toBeVisible();

  await page.getByRole('link', { name: 'Předpisy a saldo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Předpisy' })).toBeVisible();
});

test('a change made in Pohoda itself comes back as a difference, not as an overwrite', async ({ page }) => {
  await signIn(page, 'tenant-admin');
  await page.goto('/demo');

  await runScenario(page, new RegExp(`Účetní změnila částku faktury.*${WALKTHROUGH_HOUSE}`, 'u'));
  await expect(page.getByText(/Porovnání našlo \d+ nový rozdíl/u)).toBeVisible({ timeout: SLOW });

  await signIn(page, 'finance');
  await openHouse(page, 'Účetnictví');

  await expect(page.getByRole('heading', { name: 'Rozdíly' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Celková částka' })).toBeVisible();
});
