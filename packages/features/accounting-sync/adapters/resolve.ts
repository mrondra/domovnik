import type { RequestContext } from '../../../kernel/src/context/index';
import { DomainError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { requireLink } from '../service/links';
import type { AccountingAdapter } from './accounting.adapter';
import { pohodaMock } from './pohoda/mock/index';

/**
 * Which accounting an SVJ is served by, read from `accounting_link`. The real mServer adapter is
 * not built here: the documents it would send are unverified against a real Pohoda (ADR 0005), and
 * an implementation nobody has tested is worse than a refusal that says so.
 */
export const accountingAdapterFor = async (ctx: RequestContext, svjId: SvjId): Promise<AccountingAdapter> => {
  const link = await requireLink(ctx, svjId);
  if (link.accountingAdapter === 'mock') return pohodaMock;

  throw new DomainError('Napojení na mServer zatím není ověřené proti reálné Pohodě', {
    code: 'accounting_adapter_unverified',
    details: { svjId, kind: link.accountingAdapter },
  });
};
