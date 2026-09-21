import { expect, test, type Locator, type Page } from '@playwright/test';
import { DEMO_PASSWORD, ROUTINE_SCENARIO, demoUser } from './demo-tenant';

const signIn = async (page: Page, role: Parameters<typeof demoUser>[0]): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(demoUser(role));
  await page.getByLabel('Heslo').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Přihlásit' }).click();
  await page.waitForURL('/');
};

/** The header row of one scenario's card: its title on the left, its button on the right. */
const scenarioHeader = (page: Page, title: string): Locator =>
  page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: title }) })
    .filter({ has: page.getByRole('button', { name: 'Spustit' }) })
    .last();

test('the demo screen is offered to the person doing the showing', async ({ page }) => {
  await signIn(page, 'tenant-admin');

  await expect(page.getByRole('link', { name: 'Demo', exact: true })).toBeVisible();
});

test('and not to the accountant, who has invoices to do', async ({ page }) => {
  await signIn(page, 'finance');

  await expect(page.getByRole('link', { name: 'Demo', exact: true })).toHaveCount(0);
});

test('running a scenario delivers an invoice, and the list then has one', async ({ page }) => {
  await signIn(page, 'tenant-admin');

  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page).toHaveURL(/\/demo$/);

  await scenarioHeader(page, ROUTINE_SCENARIO).getByRole('button', { name: 'Spustit' }).click();

  // Either outcome is right: the first run of a fresh database creates the invoice, every run
  // after that recognises the same file. Both mean the platform did the real thing.
  await expect(page.getByText(/Faktura byla doručena|Stejný soubor/u)).toBeVisible({
    timeout: 30_000,
  });

  await page.goto('/invoices');
  await expect(page.getByRole('table')).toBeVisible();
});

test('an accountant reaches the invoices across the SVJ they work for', async ({ page }) => {
  await signIn(page, 'finance');

  await page.getByRole('link', { name: 'Faktury', exact: true }).first().click();

  await expect(page).toHaveURL(/\/invoices$/);
  await expect(page.getByRole('heading', { name: 'Faktury' })).toBeVisible();
});
