import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { SuppliersService } from '../service/index';
import { contractListResponse, supplierListResponse } from './suppliers.schema';

/** The address book of the management company, and what one SVJ has agreed with whom. */
@ApiTags('suppliers')
@Controller()
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

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
}
