import { z } from 'zod';
import { AdapterError } from '../../../../../kernel/src/errors/index';
import type { AccountingInvoice } from '../../../domain/types';

const storedInvoice = z.object({
  externalNumber: z.string(),
  amountTotal: z.number(),
  dueOn: z.string(),
  variableSymbol: z.string().nullable(),
  paid: z.boolean(),
});

/**
 * What was written down, read back as an invoice. A row that is not one is a fault of this
 * adapter rather than of the caller, so it says so instead of answering with a half-invoice.
 */
export const asInvoice = (accountingRef: string, state: unknown): AccountingInvoice => {
  const parsed = storedInvoice.safeParse(state);
  if (!parsed.success) {
    throw new AdapterError('Uložený doklad nemá tvar faktury', {
      code: 'pohoda_mock_state_unreadable',
      retryable: false,
      details: { accountingRef },
    });
  }

  const { variableSymbol, ...rest } = parsed.data;
  return {
    accountingRef,
    ...rest,
    variableSymbol: variableSymbol ?? undefined,
  };
};
