import type { BankAdapter } from './bank.adapter';
import { syntheticBank } from './synthetic/index';

/**
 * The one place that names an implementation. Phase 1 has only the generated statement; Fio and
 * Pohoda (025) will be chosen per bank account here, and nothing that calls this will change.
 */
export const bankAdapter = (): BankAdapter => syntheticBank;
