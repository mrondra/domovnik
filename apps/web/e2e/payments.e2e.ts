import { expect, test, type Page } from '@playwright/test';
import { DEMO_PASSWORD, demoUser } from './demo-tenant';

const signIn = async (page: Page, role: Parameters<typeof demoUser>[0]): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(demoUser(role));
  await page.getByLabel('Heslo').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Přihlásit' }).click();
  await page.waitForURL('/');
};

/** The first SVJ the overview offers; every seeded house has an account and a statement. */
const openFirstSvj = async (page: Page): Promise<void> => {
  await page.goto('/svj');
  await page.getByRole('link', { name: 'Otevřít SVJ' }).first().click();
  await expect(page).toHaveURL(/\/s\/[0-9a-f-]+\/svj$/);
};

test('the accountant reaches the payments of a house and can filter them', async ({ page }) => {
  await signIn(page, 'finance');
  await openFirstSvj(page);

  await page.getByRole('link', { name: 'Platby', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Platby' })).toBeVisible();

  await page.getByRole('link', { name: 'Nespárováno' }).click();
  await expect(page).toHaveURL(/status=unmatched/);
});

test('and reaches the prescriptions and the debtors of that house', async ({ page }) => {
  await signIn(page, 'finance');
  await openFirstSvj(page);

  await page.getByRole('link', { name: 'Předpisy a saldo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Předpisy' })).toBeVisible();

  await page.goto(`${page.url().split('?')[0] ?? ''}/debtors`);
  await expect(page.getByRole('heading', { name: 'Dlužníci' })).toBeVisible();
});

test('a committee member sees the statement but is offered nothing to pair with', async ({ page }) => {
  await signIn(page, 'committee');
  await page.goto('/svj');

  const house = page.getByRole('link', { name: 'Otevřít SVJ' });
  await expect(house.first()).toBeVisible();
  await house.first().click();

  await page.getByRole('link', { name: 'Platby', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Platby' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spárovat' })).toHaveCount(0);
});
