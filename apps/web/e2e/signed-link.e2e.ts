import { expect, test } from '@playwright/test';
import { releaseDatabase, seedPendingApproval, signedLinkFor, statusOf, type Fixture } from './fixture';

let fixture: Fixture;

test.beforeEach(async () => {
  fixture = await seedPendingApproval();
});

test.afterAll(async () => {
  await releaseDatabase();
});

/** The acceptance criterion of task 006: opening the link decides nothing (zadání kap. 2). */
test('opening the signed link renders the approval and leaves it pending', async ({ page }) => {
  await page.goto(`/a/${signedLinkFor(fixture)}`);

  await expect(page.getByText('Nezaplacený předpis')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Schválit' })).toBeVisible();

  expect(await statusOf(fixture)).toBe('pending');
});

test('deciding from the signed link is the POST behind the button', async ({ page }) => {
  await page.goto(`/a/${signedLinkFor(fixture)}`);

  await page.getByRole('button', { name: 'Zamítnout' }).click();

  await expect.poll(() => statusOf(fixture)).toBe('rejected');
});
