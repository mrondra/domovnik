import { approvals } from '../../../packages/kernel/src/approvals/index';
import { createContext, type RequestContext } from '../../../packages/kernel/src/context/index';
import { closeConnections } from '../../../packages/kernel/src/db/index';
import { createTenant, createUser } from '../../../packages/kernel/src/identity/index';
import type { ApprovalId, SvjId, UserId } from '../../../packages/kernel/src/ids/index';
import { InvoicesService, type InvoiceId } from '../../../packages/features/invoices/index';
import { SvjService } from '../../../packages/features/svj/index';
import { seedExtractedInvoice } from './invoices-seed';

const PASSWORD = 'e2e-heslo-12345';

export const SUMMARY = 'Úklid společných prostor za září 2026, 15 000 Kč, stejně jako každý měsíc.';

export interface InvoiceFixture {
  readonly ctx: RequestContext;
  readonly email: string;
  readonly password: string;
  readonly svjId: SvjId;
  readonly invoiceId: InvoiceId;
  readonly approvalId: ApprovalId;
}

const invoices = new InvoicesService();
const svj = new SvjService();

/** A tenant of its own per run, so a run never reads or decides another run's invoices. */
export const seedProposedInvoice = async (): Promise<InvoiceFixture> => {
  const run = Date.now().toString(36);
  const tenantId = await createTenant({ name: `E2E faktury ${run}` });
  const system = createContext({ tenantId, actor: { type: 'system', id: null, roles: [] } });

  const created = await svj.createSvj(system, {
    name: `SVJ Krátká ${run}`,
    ico: run.padStart(8, '0').slice(-8),
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
  });

  const email = `vybor-${run}@e2e.domovnik.test`;
  const userId: UserId = await createUser(system, {
    email,
    displayName: 'Karel Předseda',
    password: PASSWORD,
    roles: ['committee'],
    svjId: created.id,
  });
  await svj.updateSvj(system, created.id, { committee: [userId] });

  const invoiceId = await seedExtractedInvoice(system, created.id);
  const approvalId = await approvals.create(system, {
    toolName: 'invoice.approve',
    input: { invoiceId, summary: SUMMARY, recommendation: 'approve', risks: [] },
    evidence: { requestedBy: 'agent', correlationId: run },
    approvers: [userId],
  });
  await invoices.transition(system, invoiceId, 'pending_approval', { approvalId });

  return {
    ctx: createContext({
      tenantId,
      actor: { type: 'user', id: userId, roles: ['committee'] },
      svjScope: [created.id],
    }),
    email,
    password: PASSWORD,
    svjId: created.id,
    invoiceId,
    approvalId,
  };
};

export const statusOf = async (fixture: InvoiceFixture): Promise<string> =>
  (await invoices.getInvoice(fixture.ctx, fixture.invoiceId)).status;

export const releaseDatabase = (): Promise<void> => closeConnections();
