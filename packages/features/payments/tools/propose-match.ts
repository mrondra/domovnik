import { z } from 'zod';
import { defineTool } from '../../../kernel/src/tools/index';
import { bankTransactionIdSchema } from '../domain/ids';
import { proposeMatchSchema } from '../domain/proposal';
import { applyProposal, decideBy, financeApprovers, markProposed } from '../service/index';

/**
 * A proposal, never an act: the policy always asks, so the handler runs only after the accountants
 * have decided, and it runs in `apps/workers` (ADR 0006, ADR 0015). The movement is marked
 * `proposed` the moment the approval exists, so nobody else picks it up in the meantime.
 */
export const paymentProposeMatch = defineTool({
  name: 'payment.proposeMatch',
  description:
    'Navrhne, čeho se nespárovaný pohyb týká. Cíl musí být jeden z kandidátů, které vrátil ' +
    'payment.candidates — nic jiného nenavrhuj. `reason` je věta česky pro účetní, která pohyb ' +
    'uvidí bez kontextu. Nic nepřipáruje sám; rozhoduje o tom finance.',
  input: proposeMatchSchema,
  output: z.object({ transactionId: z.uuid(), status: z.string().min(1) }),
  permission: 'finance.write',
  userComposable: false,
  readOnly: false,
  proposal: true,
  approval: async (ctx) => ({
    required: true,
    approvers: await financeApprovers(ctx),
    deadline: decideBy(),
  }),
  onApprovalRequested: async (ctx, input) => {
    await markProposed(ctx, bankTransactionIdSchema.parse(input.transactionId));
  },
  handler: async (ctx, input) => {
    await applyProposal(ctx, {
      ...input,
      transactionId: bankTransactionIdSchema.parse(input.transactionId),
    });
    return { transactionId: input.transactionId, status: 'matched' };
  },
});
