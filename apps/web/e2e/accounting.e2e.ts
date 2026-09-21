import { expect, test, type Page } from '@playwright/test';
import { DEMO_PASSWORD, demoUser } from './demo-tenant';

const signIn = async (page: Page, role: Parameters<typeof demoUser>[0]): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(demoUser(role));
  await page.getByLabel('Heslo').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Přihlásit' }).click();
  await page.waitForURL('/');
};

const openFirstSvj = async (page: Page): Promise<void> => {
  await page.goto('/svj');
  await page.getByRole('link', { name: 'Otevřít SVJ' }).first().click();
  await expect(page).toHaveURL(/\/s\/[0-9a-f-]+\/svj$/);
};

test('the accountant sees where the house is booked and whether the two sides agree', async ({ page }) => {
  await signIn(page, 'finance');
  await openFirstSvj(page);

  await page.getByRole('link', { name: 'Účetnictví', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Účetnictví' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Účetní jednotka/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rozdíly' })).toBeVisible();
});

test('a committee member is not offered the accounting at all', async ({ page }) => {
  await signIn(page, 'committee');
  await page.goto('/svj');
  await page.getByRole('link', { name: 'Otevřít SVJ' }).first().click();

  await expect(page.getByRole('link', { name: 'Účetnictví', exact: true })).toHaveCount(0);
});
