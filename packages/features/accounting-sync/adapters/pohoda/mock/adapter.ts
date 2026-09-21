import type { RequestContext } from '../../../../../kernel/src/context/index';
import type { SvjId } from '../../../../../kernel/src/ids/index';
import type {
  BankStatementLine,
  FetchStatementsInput,
  LiquidateInput,
  PostInvoiceInput,
} from '../../../domain/types';
import type { AccountingAdapter, UpsertSupplierInput } from '../../accounting.adapter';
import { liquidation, receivedInvoice } from '../xml/builders';
import { asInvoice } from './invoice-state';
import { packFor, refFor } from './refs';
import { readStatements, writeStatements } from './statement-door';
import { amend, recall, remember } from './store';

export interface PohodaMock extends AccountingAdapter {
  /** What the bank told the accounting. In the demo it is the generated statement (task 025). */
  rememberStatements(ctx: RequestContext, svjId: SvjId, lines: readonly BankStatementLine[]): Promise<void>;
  /** Changing an invoice the way somebody would in Pohoda itself, which is what 025 detects. */
  mutateInvoice(
    ctx: RequestContext,
    svjId: SvjId,
    accountingRef: string,
    patch: Readonly<Record<string, unknown>>,
  ): Promise<void>;
}

/**
 * An in-memory Pohoda — in a table, so the demo survives a restart. It builds the same documents
 * the real adapter builds and keeps them, which is what makes the contract test in `tests/` mean
 * something: both implementations are asked the same questions and answer the same shapes.
 */
export const pohodaMock: PohodaMock = {
  kind: 'mock',

  postReceivedInvoice: async (ctx, input: PostInvoiceInput) => {
    const ref = refFor('inv', `${input.supplier.ico}:${input.externalNumber}`);

    await remember(ctx, input.svjId, {
      ref,
      kind: 'invoice',
      xml: packFor({
        ico: input.supplier.ico,
        note: `Přijatá faktura ${input.externalNumber}`,
        id: ref,
        body: receivedInvoice(input),
      }),
      state: {
        externalNumber: input.externalNumber,
        amountTotal: input.amountTotal,
        dueOn: input.dueOn,
        variableSymbol: input.variableSymbol ?? null,
        paid: false,
      },
    });

    return { accountingRef: ref };
  },

  liquidateInvoice: async (ctx, input: LiquidateInput) => {
    const xml = packFor({
      ico: input.bankRef,
      note: `Likvidace ${input.accountingRef}`,
      id: input.accountingRef,
      body: liquidation(input),
    });

    await amend(ctx, input.svjId, input.accountingRef, {
      paid: true,
      paidOn: input.paidOn,
      liquidationXml: xml,
    });
  },

  fetchBankStatements: (ctx, input: FetchStatementsInput) => readStatements(ctx, input),

  fetchInvoice: async (ctx, svjId: SvjId, accountingRef: string) => {
    const stored = await recall(ctx, svjId, accountingRef);
    return stored === null ? null : asInvoice(accountingRef, stored.state);
  },

  upsertSupplier: async (ctx, input: UpsertSupplierInput) => {
    const ref = refFor('adb', input.ico);
    await remember(ctx, input.svjId, {
      ref,
      kind: 'supplier',
      xml: packFor({ ico: input.ico, note: input.name, id: ref, body: '<adb:address/>' }),
      state: { name: input.name, ico: input.ico },
    });
    return { accountingRef: ref };
  },

  rememberStatements: (ctx, svjId, lines) => writeStatements(ctx, svjId, lines),

  mutateInvoice: (ctx, svjId, accountingRef, patch) => amend(ctx, svjId, accountingRef, patch),
};
