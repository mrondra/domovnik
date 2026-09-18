import { Controller, HttpCode, Param, Post, Req } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { ForbiddenError } from '../../../kernel/src/errors/index';
import { hasPermission } from '../../../kernel/src/identity/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { InvoicesService } from '../service/index';
import { readInboundMail, type MultipartRequest } from './multipart';

export const inboundResponse = z.object({
  invoiceId: z.uuid(),
  duplicateOf: z.uuid().optional(),
});

const CREATED = 201;
const WRITE = 'finance.write';

/**
 * The simulated inbox of zadání kap. 8: posting a message here is the demo's stand-in for one
 * arriving over IMAP, and everything after it is the same code a real message would go through.
 * It is tagged `demo` in the OpenAPI document so nobody mistakes it for part of the real API.
 *
 * The permission is checked here rather than with a guard, because the guards live in `apps/api`
 * and a feature may not import from an app (ADR 0002).
 */
@ApiTags('invoices', 'demo')
@Controller('svj/:svjId/invoices')
export class InboundController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post('inbound')
  @HttpCode(CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Simulované doručení faktury e-mailem (demo)' })
  @ApiResponse({ status: CREATED, description: 'Faktura přijata', standardSchema: inboundResponse })
  async receive(
    @Param('svjId') svjId: string,
    @Req() request: MultipartRequest,
  ): Promise<z.output<typeof inboundResponse>> {
    const ctx = requireContext();
    if (!hasPermission(ctx.actor, WRITE)) {
      throw new ForbiddenError('Aktér nemá právo zakládat faktury', {
        code: 'permission_required',
        details: { permission: WRITE },
      });
    }

    const mail = await readInboundMail(request, new Date());
    const received = await this.invoices.receiveInvoiceMail(ctx, {
      svjId: svjIdSchema.parse(svjId),
      mail,
    });

    return received.duplicateOf === undefined
      ? { invoiceId: received.invoiceId }
      : { invoiceId: received.invoiceId, duplicateOf: received.duplicateOf };
  }
}
