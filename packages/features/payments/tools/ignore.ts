import { z } from 'zod';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { bankTransactionIdSchema } from '../domain/ids';
import { setMatchStatus } from '../service/residual';

/**
 * A movement there is nothing to pair with: a bank charge, interest, a transfer between the SVJ's
 * own accounts. Marking it says somebody looked, which is the difference between a settled list
 * and a list nobody has finished reading.
 */
export const paymentMarkIgnored = defineTool({
  name: 'payment.markIgnored',
  description:
    'Označí pohyb jako takový, ke kterému se nic párovat nemá — bankovní poplatek, úrok, převod ' +
    'mezi vlastními účty. Použij, jen když je z protistrany nebo zprávy zřejmé, co to je. ' +
    'Nepoužívej na pohyb, kterému jen nerozumíš.',
  input: z.object({ transactionId: z.uuid(), reason: z.string().min(1).max(400) }),
  output: z.object({ transactionId: z.uuid(), status: z.string().min(1) }),
  permission: 'finance.write',
  approval: neverRequiresApproval,
  userComposable: false,
  readOnly: false,
  proposal: true,
  handler: async (ctx, input) => {
    await setMatchStatus(ctx, bankTransactionIdSchema.parse(input.transactionId), 'ignored', input.reason);
    return { transactionId: input.transactionId, status: 'ignored' };
  },
});
