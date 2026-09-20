import { applyTestEnv } from '../../../kernel/src/testing/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SupplierId } from '../domain/ids';
import type { Invoice } from '../domain/types';
import {
  createContract,
  createSupplier,
  findSupplierByIco,
  getInvoice,
  processReceivedInvoice,
  receiveInvoiceMail,
  setBudgetLine,
} from '../service/index';
import { CLEANING_ICO, scenarioNamed } from './fixtures/invoice-scenarios.fixture';
import { scenarioPdf } from './fixtures/scenario-pdf.fixture';

/**
 * The recorded answers live next to the test; nothing in this suite reaches the network. Call it
 * **after** the containers are up: `applyTestEnv` fills in a placeholder `DATABASE_URL`, and
 * `startTestDb` takes any `DATABASE_URL` it finds as a cluster to reuse.
 */
export const useRecordedLlm = (): void => {
  applyTestEnv({
    LLM_MODE: 'replay',
    LLM_FIXTURE_DIR: new URL('./fixtures/llm', import.meta.url).pathname,
  });
};

export const CONTRACT_AMOUNT = 15_000;
export const BUDGET = 200_000;
export const YEAR = 2026;

/**
 * The supplier is the management company's, not one SVJ's — the IČO is unique per tenant, so a
 * second house asking for the same company has to get the same row.
 */
export const seedCleaningSupplier = async (ctx: RequestContext): Promise<SupplierId> => {
  const existing = await findSupplierByIco(ctx, CLEANING_ICO);
  if (existing !== null) return existing.id;

  const created = await createSupplier(ctx, { name: 'Úklid Praha s.r.o.', ico: CLEANING_ICO });
  return created.id;
};

export const seedContract = async (
  ctx: RequestContext,
  svjId: SvjId,
  supplierId: SupplierId,
): Promise<void> => {
  await createContract(ctx, {
    svjId,
    supplierId,
    subject: 'Úklid společných prostor',
    budgetCategory: 'uklid',
    monthlyAmount: CONTRACT_AMOUNT,
    validFrom: '2026-01-01',
  });
};

/**
 * An SVJ that has its house in order: the contract is in force and the budget line has room.
 * Everything a check could complain about is arranged not to — so a scenario that still produces a
 * warning produced it for its own reason.
 */
export const seedTidySvj = async (
  ctx: RequestContext,
  svjId: SvjId,
  supplierId: SupplierId,
): Promise<void> => {
  await seedContract(ctx, svjId, supplierId);
  await setBudgetLine(ctx, { svjId, year: YEAR, category: 'uklid', plannedAmount: BUDGET });
};

/** The whole path one scenario takes: the message arrives, and the platform does what it can. */
export const processScenario = async (
  ctx: RequestContext,
  svjId: SvjId,
  scenario: string,
): Promise<Invoice> => {
  const one = scenarioNamed(scenario);
  const received = await receiveInvoiceMail(ctx, {
    svjId,
    mail: {
      from: 'fakturace@dodavatel.test',
      subject: `Faktura ${one.extracted.externalNumber}`,
      text: 'V příloze zasíláme fakturu.',
      receivedAt: new Date('2026-09-02T07:30:00.000Z'),
      attachments: [
        { filename: 'faktura.pdf', contentType: 'application/pdf', body: await scenarioPdf(one) },
      ],
    },
  });

  await processReceivedInvoice(ctx, received.invoiceId);
  return getInvoice(ctx, received.invoiceId);
};
