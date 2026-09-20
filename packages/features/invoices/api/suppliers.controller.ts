import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { InvoicesService } from '../service/index';
import {
  contractListResponse,
  invoiceListResponse,
  invoiceQuery,
  supplierListResponse,
} from './invoices.schema';

/** The address book of the management company, and what one SVJ has agreed with whom. */
@ApiTags('invoices')
@Controller()
export class SuppliersController {
  constructor(private readonly service: InvoicesService) {}

  @Get('suppliers')
  @ApiOperation({ summary: 'Dodavatelé správcovské firmy' })
  @ApiResponse({ status: 200, description: 'Seznam dodavatelů', standardSchema: supplierListResponse })
  suppliers(): Promise<z.output<typeof supplierListResponse>> {
    return this.service.listSuppliers(requireContext());
  }

  @Get('svj/:svjId/contracts')
  @ApiOperation({ summary: 'Smlouvy SVJ platné dnes' })
  @ApiResponse({ status: 200, description: 'Seznam smluv', standardSchema: contractListResponse })
  contracts(@Param('svjId') svjId: string): Promise<z.output<typeof contractListResponse>> {
    return this.service.listContracts(requireContext(), svjIdSchema.parse(svjId));
  }

  @Get('svj/:svjId/invoices')
  @ApiOperation({ summary: 'Faktury jednoho SVJ' })
  @ApiResponse({ status: 200, description: 'Seznam faktur', standardSchema: invoiceListResponse })
  invoices(
    @Param('svjId') svjId: string,
    @Query() query: unknown,
  ): Promise<z.output<typeof invoiceListResponse>> {
    return this.service.listInvoices(requireContext(), {
      svjId: svjIdSchema.parse(svjId),
      ...invoiceQuery.parse(query),
    });
  }
}
