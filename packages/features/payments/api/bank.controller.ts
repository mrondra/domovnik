import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { ForbiddenError } from '../../../kernel/src/errors/index';
import { hasPermission } from '../../../kernel/src/identity/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { bankAccountIdSchema } from '../domain/ids';
import { PaymentsService } from '../service/index';
import { bankAccountListResponse, syncRequest, syncResponse } from './bank.schema';

const OK = 200;
const WRITE = 'finance.write';

/**
 * Tagged `demo` for as long as the only bank is the generated one: asking for a statement is a
 * thing somebody does during a demonstration, not yet an integration a customer relies on.
 *
 * The permission is checked here rather than with a guard, because the guards live in `apps/api`
 * and a feature may not import from an app (ADR 0002).
 */
@ApiTags('payments', 'demo')
@Controller('svj/:svjId/bank-accounts')
export class BankController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Bankovní účty SVJ' })
  @ApiResponse({ status: OK, description: 'Seznam účtů', standardSchema: bankAccountListResponse })
  list(@Param('svjId') svjId: string): Promise<z.output<typeof bankAccountListResponse>> {
    return this.payments.listBankAccounts(requireContext(), svjIdSchema.parse(svjId));
  }

  @Post(':id/sync')
  @HttpCode(OK)
  @ApiOperation({ summary: 'Načte výpis za období a spáruje pohyby (demo)' })
  @ApiResponse({ status: OK, description: 'Výsledek importu', standardSchema: syncResponse })
  sync(@Param('id') id: string, @Body() body: unknown): Promise<z.output<typeof syncResponse>> {
    const ctx = requireContext();
    if (!hasPermission(ctx.actor, WRITE)) {
      throw new ForbiddenError('Aktér nemá právo načítat výpisy', {
        code: 'permission_required',
        details: { permission: WRITE },
      });
    }

    return this.payments.syncBankAccount(ctx, {
      bankAccountId: bankAccountIdSchema.parse(id),
      ...syncRequest.parse(body),
    });
  }
}
