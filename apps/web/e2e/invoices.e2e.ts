import { expect, test, type Page } from '@playwright/test';
import {
  SUMMARY,
  releaseDatabase,
  seedProposedInvoice,
  statusOf,
  type InvoiceFixture,
} from './invoices-fixture';
import { INVOICE_NUMBER } from './invoices-seed';

let fixture: InvoiceFixture;

/** A fresh invoice per test: a decision is single-shot, so tests must not share one. */
test.beforeEach(async () => {
  fixture = await seedProposedInvoice();
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

const openInvoice = async (page: Page): Promise<void> => {
  await page.goto(`/s/${fixture.svjId}/invoices`);
  await page.getByRole('link', { name: INVOICE_NUMBER }).click();
  await expect(page).toHaveURL(new RegExp(`/invoices/${fixture.invoiceId}$`));
};

test('a committee member finds the invoice, reads what the agent proposed and approves it', async ({
  page,
}) => {
  await signIn(page);

  await page.getByRole('link', { name: 'Faktury', exact: true }).first().click();
  await expect(page.getByText(INVOICE_NUMBER)).toBeVisible();

  await openInvoice(page);
  await expect(page.getByText('Úklid Praha s.r.o.')).toBeVisible();
  await expect(page.getByText('Blíží se splatnost')).toBeVisible();
  await expect(page.getByText(SUMMARY)).toBeVisible();

  await page.getByRole('link', { name: 'Otevřít schvalování' }).click();
  await expect(page.getByText(SUMMARY)).toBeVisible();

  await page.getByRole('button', { name: 'Schválit' }).click();
  await expect.poll(() => statusOf(fixture), { timeout: 30_000 }).toBe('approved');
});

test('the invoice of one SVJ is not reachable from another', async ({ page }) => {
  await signIn(page);

  const response = await page.goto(`/s/${fixture.svjId}/invoices/${fixture.invoiceId}`);
  expect(response?.status()).toBe(200);

  await page.goto('/invoices');
  await expect(page.getByText(INVOICE_NUMBER)).toBeVisible();
});
