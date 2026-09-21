import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext, type RequestContext } from '../../../kernel/src/context/index';
import { ForbiddenError } from '../../../kernel/src/errors/index';
import { hasPermission } from '../../../kernel/src/identity/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { syncConflictIdSchema } from '../domain/ids';
import {
  accountingStatusSchema,
  conflictSchema,
  resolveConflictRequest,
  syncStatementsRequest,
  syncStatementsResponse,
} from '../domain/views';
import { AccountingSyncService } from '../service/index';

const OK = 200;
const WRITE = 'finance.write';

const requireWrite = (): RequestContext => {
  const ctx = requireContext();
  if (!hasPermission(ctx.actor, WRITE)) {
    throw new ForbiddenError('Aktér nemá právo zasahovat do účetní synchronizace', {
      code: 'permission_required',
      details: { permission: WRITE },
    });
  }
  return ctx;
};

/**
 * Looking at the state of the connection is open to everyone who may reach the SVJ — a committee
 * member has every right to see whether their invoices reached the accounting. Asking Pohoda for
 * something, or closing a disagreement, is not the same thing (zadání kap. 9).
 *
 * The permission is checked here rather than with a guard, because the guards live in `apps/api`
 * and a feature may not import from an app (ADR 0002).
 */
@ApiTags('accounting')
@Controller()
export class AccountingController {
  constructor(private readonly accounting: AccountingSyncService) {}

  @Get('svj/:svjId/accounting')
  @ApiOperation({ summary: 'Stav napojení SVJ na účetnictví' })
  @ApiResponse({
    status: OK,
    description: 'Napojení, joby a konflikty',
    standardSchema: accountingStatusSchema,
  })
  status(@Param('svjId') svjId: string): Promise<z.output<typeof accountingStatusSchema>> {
    return this.accounting.status(requireContext(), svjIdSchema.parse(svjId));
  }

  @Post('svj/:svjId/accounting/sync-statements')
  @HttpCode(OK)
  @ApiOperation({ summary: 'Zeptá se účetnictví na pohyby za období' })
  @ApiResponse({
    status: OK,
    description: 'Kolik řádků výpisu Pohoda má',
    standardSchema: syncStatementsResponse,
  })
  syncStatements(
    @Param('svjId') svjId: string,
    @Body() body: unknown,
  ): Promise<z.output<typeof syncStatementsResponse>> {
    return this.accounting.syncStatements(requireWrite(), {
      svjId: svjIdSchema.parse(svjId),
      ...syncStatementsRequest.parse(body),
    });
  }

  @Post('conflicts/:id/resolve')
  @HttpCode(OK)
  @ApiOperation({ summary: 'Uzavře konflikt rozhodnutím účetní' })
  @ApiResponse({ status: OK, description: 'Uzavřený konflikt', standardSchema: conflictSchema })
  resolve(@Param('id') id: string, @Body() body: unknown): Promise<z.output<typeof conflictSchema>> {
    return this.accounting.resolveConflict(requireWrite(), {
      conflictId: syncConflictIdSchema.parse(id),
      ...resolveConflictRequest.parse(body),
    });
  }
}
