import { expect, test, type Page } from '@playwright/test';
import { DEMO_TOOL, releaseDatabase, seedPendingApproval, statusOf, type Fixture } from './fixture';

let fixture: Fixture;

/** A fresh approval per test: a decision is single-shot, so tests must not share one. */
test.beforeEach(async () => {
  fixture = await seedPendingApproval();
});

test.afterAll(async () => {
  await releaseDatabase();
});

const signIn = async (page: Page): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(fixture.email);
  await page.getByLabel('Heslo').fill(fixture.password);
  await page.getByRole('button', { name: 'Přihlásit' }).click();
  await page.waitForURL('/');
};

test('an unauthenticated visitor is sent to the login screen', async ({ page }) => {
  await page.goto('/approvals');

  await expect(page).toHaveURL(/\/login$/);
});

test('signing in, opening the inbox and approving changes the status', async ({ page }) => {
  await signIn(page);

  await page.getByRole('link', { name: 'Schvalování', exact: true }).click();
  await expect(page).toHaveURL(/\/approvals/);

  await page.getByRole('link', { name: DEMO_TOOL }).click();
  await expect(page.getByText('Nezaplacený předpis')).toBeVisible();

  await page.getByRole('button', { name: 'Schválit' }).click();

  await expect.poll(() => statusOf(fixture)).toBe('approved');
  await expect(page.getByText('Schváleno')).toBeVisible();
});
