import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type {
  FindByVariableSymbolInput,
  GeneratePrescriptionsInput,
  ListDebtorsInput,
  ListPrescriptionsInput,
  RecordPaymentInput,
  UnitBalanceInput,
} from '../adapters/index';
import type { Prescription, UnitBalance } from '../domain/types';
import { listDebtors, unitBalance } from './balance';
import { recordPayment } from './payments';
import { findByVariableSymbol, generatePrescriptions, listPrescriptions } from './prescriptions';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method is
 * the module next to it, so a tool or another feature can call the same function without Nest.
 */
@Injectable()
export class ReceivablesService {
  generatePrescriptions(
    ctx: RequestContext,
    input: GeneratePrescriptionsInput,
  ): Promise<readonly Prescription[]> {
    return generatePrescriptions(ctx, input);
  }

  listPrescriptions(ctx: RequestContext, input: ListPrescriptionsInput): Promise<readonly Prescription[]> {
    return listPrescriptions(ctx, input);
  }

  findByVariableSymbol(ctx: RequestContext, input: FindByVariableSymbolInput): Promise<Prescription | null> {
    return findByVariableSymbol(ctx, input);
  }

  unitBalance(ctx: RequestContext, input: UnitBalanceInput): Promise<UnitBalance> {
    return unitBalance(ctx, input);
  }

  listDebtors(ctx: RequestContext, input: ListDebtorsInput): Promise<readonly UnitBalance[]> {
    return listDebtors(ctx, input);
  }

  recordPayment(ctx: RequestContext, input: RecordPaymentInput): Promise<void> {
    return recordPayment(ctx, input);
  }
}
