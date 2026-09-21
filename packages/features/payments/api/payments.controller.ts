import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext, type RequestContext } from '../../../kernel/src/context/index';
import { ForbiddenError } from '../../../kernel/src/errors/index';
import { hasPermission } from '../../../kernel/src/identity/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { bankTransactionIdSchema } from '../domain/ids';
import {
  ignoreRequest,
  manualMatchRequest,
  transactionDetailSchema,
  transactionListSchema,
  transactionQuery,
} from '../domain/views';
import { PaymentsService } from '../service/index';

const OK = 200;
const WRITE = 'finance.write';

const requireWrite = (): RequestContext => {
  const ctx = requireContext();
  if (!hasPermission(ctx.actor, WRITE)) {
    throw new ForbiddenError('Aktér nemá právo párovat platby', {
      code: 'permission_required',
      details: { permission: WRITE },
    });
  }
  return ctx;
};

/**
 * Reading a statement is open to everyone who may reach the SVJ — a committee member has every
 * right to see what arrived on their own account. Deciding what a movement was about is not the
 * same thing, and that is what `finance.write` guards (zadání kap. 9).
 */
@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('svj/:svjId/transactions')
  @ApiOperation({ summary: 'Bankovní pohyby SVJ' })
  @ApiResponse({ status: OK, description: 'Seznam pohybů', standardSchema: transactionListSchema })
  list(
    @Param('svjId') svjId: string,
    @Query() query: unknown,
  ): Promise<z.output<typeof transactionListSchema>> {
    return this.payments.browseTransactions(requireContext(), {
      svjId: svjIdSchema.parse(svjId),
      ...transactionQuery.parse(query),
    });
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Pohyb, jeho párování a možnosti' })
  @ApiResponse({ status: OK, description: 'Detail pohybu', standardSchema: transactionDetailSchema })
  detail(@Param('id') id: string): Promise<z.output<typeof transactionDetailSchema>> {
    return this.payments.transactionDetail(requireContext(), bankTransactionIdSchema.parse(id));
  }

  @Post('transactions/:id/match')
  @HttpCode(OK)
  @ApiOperation({ summary: 'Ruční spárování pohybu' })
  @ApiResponse({ status: OK, description: 'Pohyb spárován', standardSchema: transactionDetailSchema })
  async match(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<z.output<typeof transactionDetailSchema>> {
    const ctx = requireWrite();
    const transactionId = bankTransactionIdSchema.parse(id);

    await this.payments.matchManually(ctx, { transactionId, ...manualMatchRequest.parse(body) });
    return this.payments.transactionDetail(ctx, transactionId);
  }

  @Post('transactions/:id/ignore')
  @HttpCode(OK)
  @ApiOperation({ summary: 'Označí pohyb jako nepárovatelný' })
  @ApiResponse({ status: OK, description: 'Pohyb označen', standardSchema: transactionDetailSchema })
  async ignore(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<z.output<typeof transactionDetailSchema>> {
    const ctx = requireWrite();
    const transactionId = bankTransactionIdSchema.parse(id);

    await this.payments.setMatchStatus(ctx, transactionId, 'ignored', ignoreRequest.parse(body).reason);
    return this.payments.transactionDetail(ctx, transactionId);
  }
}
