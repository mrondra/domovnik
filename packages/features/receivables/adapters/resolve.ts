import type { RequestContext } from '../../../kernel/src/context/index';
import { DomainError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { internalReceivablesAdapter } from './internal/index';
import type {
  GeneratingReceivablesAdapter,
  ReceivablesAdapter,
  ReceivablesAdapterKind,
} from './receivables.adapter';

/**
 * Which implementation an SVJ is on. The choice belongs on `accounting_link.receivables_adapter`,
 * which is a table task 024 creates; until it exists, every SVJ keeps its receivables here.
 */
const chosenKind = (): ReceivablesAdapterKind => 'internal';

const missing = (ctx: RequestContext, svjId: SvjId, kind: ReceivablesAdapterKind): DomainError =>
  new DomainError('Pro tuto evidenci pohledávek zatím není implementace', {
    code: 'receivables_adapter_missing',
    details: { tenantId: ctx.tenantId, svjId, kind },
  });

/**
 * The one place that names an implementation. Everything else asks for the SVJ it is serving, so
 * that reading the choice out of the database later changes this file and nothing that calls it.
 */
export const receivablesAdapterFor = (ctx: RequestContext, svjId: SvjId): Promise<ReceivablesAdapter> => {
  const kind = chosenKind();
  if (kind === 'internal') return Promise.resolve(internalReceivablesAdapter);
  throw missing(ctx, svjId, kind);
};

/**
 * Raising a prescription is something only our own records can do — an imported one is written
 * where it came from — so asking for it is a separate question with its own refusal.
 */
export const generatingAdapterFor = async (
  ctx: RequestContext,
  svjId: SvjId,
): Promise<GeneratingReceivablesAdapter> => {
  const adapter = await receivablesAdapterFor(ctx, svjId);
  if (adapter.kind === 'internal') return internalReceivablesAdapter;

  throw new DomainError('Předpisy tohoto SVJ vznikají mimo Domovník', {
    code: 'prescriptions_not_generated_here',
    details: { svjId, kind: adapter.kind },
  });
};
