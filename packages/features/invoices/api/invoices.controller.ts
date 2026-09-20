import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { invoiceIdSchema } from '../domain/ids';
import { InvoicesService } from '../service/index';
import { invoiceDetailResponse, invoiceListResponse, invoiceQuery } from './invoices.schema';

/**
 * The context comes from the ambient scope `apps/api` opens per request (task 004 §2): the `@Ctx()`
 * parameter decorator lives in `apps/api` and a feature may not import from an app (ADR 0002).
 *
 * Across SVJ by default, narrowed by the credential (ADR 0016) — the same list a manager and a
 * committee member ask for answers differently without either of them saying so.
 */
@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Faktury napříč SVJ v rozsahu přihlášení' })
  @ApiResponse({ status: 200, description: 'Seznam faktur', standardSchema: invoiceListResponse })
  list(@Query() query: unknown): Promise<z.output<typeof invoiceListResponse>> {
    return this.invoices.listInvoices(requireContext(), invoiceQuery.parse(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Faktura se vším, co se o ní ví' })
  @ApiResponse({ status: 200, description: 'Detail faktury', standardSchema: invoiceDetailResponse })
  detail(@Param('id') id: string): Promise<z.output<typeof invoiceDetailResponse>> {
    return this.invoices.invoiceDetail(requireContext(), invoiceIdSchema.parse(id));
  }
}
