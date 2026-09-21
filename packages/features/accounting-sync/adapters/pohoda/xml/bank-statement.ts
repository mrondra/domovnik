import { element, wrap } from './escape';
import type { FetchStatementsInput } from '../../../domain/types';

/**
 * Asking Pohoda for the bank movements of a period. `lStk` is the list request for the bank agenda;
 * the date range travels as a filter. **Unverified**; see the README.
 */
export const bankStatementRequest = (input: FetchStatementsInput): string =>
  wrap(
    'lst:listBankRequest',
    [
      wrap('lst:requestBank', [
        wrap('ftr:filter', [element('ftr:dateFrom', input.from), element('ftr:dateTill', input.to)]),
      ]),
    ],
    ' version="2.0" bankVersion="2.0" bankType="receipt"',
  );
