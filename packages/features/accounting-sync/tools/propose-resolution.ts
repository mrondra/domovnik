import { z } from 'zod';
import { defineTool } from '../../../kernel/src/tools/index';
import { syncConflictIdSchema } from '../domain/ids';
import { decideBy, financeApprovers } from '../service/approvers';
import { resolveConflict } from '../service/index';

export const proposeResolutionSchema = z.object({
  conflictId: z.uuid(),
  resolution: z.enum(['keep_ours', 'take_theirs']),
  note: z.string().min(1),
});

/**
 * A proposal, never an act: the policy always asks, so the handler runs only after the accountants
 * have decided, and it runs in `apps/workers` (ADR 0006, ADR 0015). Closing a disagreement writes
 * over neither side — Pohoda stays the source of truth for the books (ADR 0005) — so what is being
 * approved is the decision and the note that explains it.
 */
export const accountingProposeResolution = defineTool({
  name: 'accounting.proposeResolution',
  description:
    'Navrhne, jak konflikt uzavřít: `keep_ours` (platí naše hodnota, v Pohodě se opraví ručně) ' +
    'nebo `take_theirs` (platí hodnota z Pohody). `note` je věta česky pro účetní, která konflikt ' +
    'uvidí bez kontextu — napiš, co se liší a proč navrhuješ zrovna tohle. Nic nemění sám.',
  input: proposeResolutionSchema,
  output: z.object({ conflictId: z.uuid(), status: z.string().min(1) }),
  permission: 'finance.write',
  userComposable: false,
  readOnly: false,
  proposal: true,
  approval: async (ctx) => ({
    required: true,
    approvers: await financeApprovers(ctx),
    deadline: decideBy(),
  }),
  handler: async (ctx, input) => {
    const resolved = await resolveConflict(ctx, {
      conflictId: syncConflictIdSchema.parse(input.conflictId),
      resolution: input.resolution,
      note: input.note,
    });

    return { conflictId: resolved.id, status: resolved.status };
  },
});
