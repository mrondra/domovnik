import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { unitIdSchema } from '../../svj/index';
import { ReceivablesService } from '../service/index';
import {
  debtorListResponse,
  debtorQuery,
  periodQuery,
  prescriptionListResponse,
  unitBalanceResponse,
} from './receivables.schema';

/**
 * The context comes from the ambient scope `apps/api` opens per request (task 004 §2): the `@Ctx()`
 * parameter decorator lives in `apps/api` and a feature may not import from an app (ADR 0002).
 */
@ApiTags('receivables')
@Controller('svj/:svjId')
export class ReceivablesController {
  constructor(private readonly receivables: ReceivablesService) {}

  @Get('prescriptions')
  @ApiOperation({ summary: 'Předpisy plateb SVJ za jeden měsíc' })
  @ApiResponse({ status: 200, description: 'Seznam předpisů', standardSchema: prescriptionListResponse })
  prescriptions(
    @Param('svjId') svjId: string,
    @Query() query: unknown,
  ): Promise<z.output<typeof prescriptionListResponse>> {
    return this.receivables.listPrescriptions(requireContext(), {
      svjId: svjIdSchema.parse(svjId),
      period: periodQuery.parse(query),
    });
  }

  @Get('units/:unitId/balance')
  @ApiOperation({ summary: 'Saldo jedné jednotky' })
  @ApiResponse({ status: 200, description: 'Saldo jednotky', standardSchema: unitBalanceResponse })
  balance(
    @Param('svjId') svjId: string,
    @Param('unitId') unitId: string,
  ): Promise<z.output<typeof unitBalanceResponse>> {
    return this.receivables.unitBalance(requireContext(), {
      svjId: svjIdSchema.parse(svjId),
      unitId: unitIdSchema.parse(unitId),
    });
  }

  @Get('debtors')
  @ApiOperation({ summary: 'Jednotky SVJ s dluhem' })
  @ApiResponse({ status: 200, description: 'Seznam dlužníků', standardSchema: debtorListResponse })
  debtors(
    @Param('svjId') svjId: string,
    @Query() query: unknown,
  ): Promise<z.output<typeof debtorListResponse>> {
    return this.receivables.listDebtors(requireContext(), {
      svjId: svjIdSchema.parse(svjId),
      ...debtorQuery.parse(query),
    });
  }
}
