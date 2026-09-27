import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { InvoicesService } from '../service/index';
import { invoiceListResponse, invoiceQuery } from './invoices.schema';

/**
 * `GET /svj/:svjId/invoices` sits next to `suppliers` and `contracts` in the URL space, but it is
 * about invoices, not the address book (ADR 0023) — so it stays in this feature's own controller.
 */
@ApiTags('invoices')
@Controller()
export class SvjInvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get('svj/:svjId/invoices')
  @ApiOperation({ summary: 'Faktury jednoho SVJ' })
  @ApiResponse({ status: 200, description: 'Seznam faktur', standardSchema: invoiceListResponse })
  list(
    @Param('svjId') svjId: string,
    @Query() query: unknown,
  ): Promise<z.output<typeof invoiceListResponse>> {
    return this.invoices.listInvoices(requireContext(), {
      svjId: svjIdSchema.parse(svjId),
      ...invoiceQuery.parse(query),
    });
  }
}
