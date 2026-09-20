import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { approvals } from '../../../kernel/src/approvals/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { ApprovalId } from '../../../kernel/src/ids/index';
import { schema, withTenant } from '../../../kernel/src/db/index';
import type { InvoiceId } from '../domain/ids';
import type { Supplier } from '../domain/types';
import { documentDownloadUrl, documentIdSchema } from '../../documents/index';
import { approveInputSchema, type ApproveInput } from '../domain/proposal';
import { invoiceDossier, type InvoiceDossier } from './dossier';
import { supplierById } from './suppliers';

export interface AgentRunView {
  readonly id: string;
  readonly status: string;
  readonly traceId: string | null;
  readonly model: string | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface ProposalView extends Omit<ApproveInput, 'invoiceId'> {
  readonly id: string;
  readonly status: string;
}

export interface InvoiceDetail extends InvoiceDossier {
  readonly supplier: Supplier | null;
  readonly agentRun: AgentRunView | null;
  readonly approval: ProposalView | null;
  readonly downloadUrl: string | null;
}

/** The run does not store which model answered; the definition it ran under does. */
const modelOf = (definition: unknown): string | null => {
  const parsed = z.object({ model: z.string() }).safeParse(definition);
  return parsed.success ? parsed.data.model : null;
};

const agentRunOf = (ctx: RequestContext, agentRunId: string | null): Promise<AgentRunView | null> =>
  agentRunId === null
    ? Promise.resolve(null)
    : withTenant(ctx, async (tx) => {
        const rows = await tx
          .select({
            id: schema.agentRun.id,
            status: schema.agentRun.status,
            traceId: schema.agentRun.traceId,
            inputTokens: schema.agentRun.inputTokens,
            outputTokens: schema.agentRun.outputTokens,
            definitionId: schema.agentRun.agentDefinitionId,
          })
          .from(schema.agentRun)
          .where(eq(schema.agentRun.id, agentRunId))
          .limit(1);

        const row = rows[0];
        if (row === undefined) return null;

        const stored = await tx
          .select({ definition: schema.agentDefinition.definition })
          .from(schema.agentDefinition)
          .where(eq(schema.agentDefinition.id, row.definitionId))
          .limit(1);

        return { ...row, model: modelOf(stored[0]?.definition) };
      });

/** What the agent proposed, as a person reads it rather than as the tool call it was. */
const proposalOf = async (
  ctx: RequestContext,
  approvalId: ApprovalId | null,
): Promise<ProposalView | null> => {
  if (approvalId === null) return null;

  const approval = await approvals.get(ctx, approvalId);
  const input = approveInputSchema.safeParse(approval.input);
  if (!input.success) return null;

  return { id: approval.id, status: approval.status, ...input.data };
};

/**
 * The whole story of one invoice: what was read off it, what the rules made of it, what the agent
 * proposed and what it cost, and where the scan is. It is what the detail screen shows, and it is
 * assembled here rather than in the controller so a tool could answer the same (task 018).
 */
export const invoiceDetail = async (ctx: RequestContext, invoiceId: InvoiceId): Promise<InvoiceDetail> => {
  const dossier = await invoiceDossier(ctx, invoiceId);
  const { invoice } = dossier;

  return {
    ...dossier,
    supplier: invoice.supplierId === null ? null : await supplierById(ctx, invoice.supplierId),
    agentRun: await agentRunOf(ctx, invoice.agentRunId),
    approval: await proposalOf(ctx, invoice.approvalId),
    downloadUrl: await documentDownloadUrl(ctx, documentIdSchema.parse(invoice.documentId))
      .then((link) => link.url)
      .catch(() => null),
  };
};
