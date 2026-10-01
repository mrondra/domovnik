import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { ForbiddenError, NotFoundError } from '../../../kernel/src/errors/index';
import { hasPermission } from '../../../kernel/src/identity/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { supplierIdSchema } from '../domain/ids';
import { SuppliersService } from '../service/index';
import {
  contractListResponse,
  supplierListResponse,
  supplierQuery,
  supplierResponse,
  updateSupplierRequest,
} from './suppliers.schema';

const WRITE = 'suppliers.write';

/**
 * The address book of the management company, and what one SVJ has agreed with whom. The
 * permission is checked here rather than with a guard, because the guards live in `apps/api` and a
 * feature may not import from an app (ADR 0002).
 */
@ApiTags('suppliers')
@Controller()
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Get('suppliers')
  @ApiOperation({ summary: 'Dodavatelé správcovské firmy, volitelně podle oboru nebo textu' })
  @ApiQuery({ name: 'specialization', required: false, description: 'Obor, který dodavatel umí' })
  @ApiQuery({ name: 'q', required: false, description: 'Text v názvu dodavatele' })
  @ApiResponse({ status: 200, description: 'Seznam dodavatelů', standardSchema: supplierListResponse })
  suppliers(@Query() query: unknown): Promise<z.output<typeof supplierListResponse>> {
    const { specialization, q } = supplierQuery.parse(query);
    return this.service.searchSuppliers(requireContext(), {
      specialization,
      text: q,
      activeOnly: false,
      // `searchSuppliers` defaults to 10 for the `suppliers.search` tool's use case; the HTTP
      // listing must return every match, so a generous ceiling stands in for "no limit".
      limit: 1000,
    });
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Detail dodavatele' })
  @ApiResponse({ status: 200, description: 'Dodavatel', standardSchema: supplierResponse })
  async supplier(@Param('id') id: string): Promise<z.output<typeof supplierResponse>> {
    const supplierId = supplierIdSchema.parse(id);
    const found = await this.service.supplierById(requireContext(), supplierId);
    if (found === null) {
      throw new NotFoundError('Dodavatel nenalezen', {
        code: 'supplier_not_found',
        details: { supplierId },
      });
    }
    return found;
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Změní údaje dodavatele' })
  @ApiResponse({ status: 200, description: 'Upravený dodavatel', standardSchema: supplierResponse })
  update(@Param('id') id: string, @Body() body: unknown): Promise<z.output<typeof supplierResponse>> {
    const ctx = requireContext();
    if (!hasPermission(ctx.actor, WRITE)) {
      throw new ForbiddenError('Aktér nemá právo upravovat dodavatele', {
        code: 'permission_required',
        details: { permission: WRITE },
      });
    }
    return this.service.updateSupplier(ctx, supplierIdSchema.parse(id), updateSupplierRequest.parse(body));
  }

  @Get('svj/:svjId/contracts')
  @ApiOperation({ summary: 'Smlouvy SVJ platné dnes' })
  @ApiResponse({ status: 200, description: 'Seznam smluv', standardSchema: contractListResponse })
  contracts(@Param('svjId') svjId: string): Promise<z.output<typeof contractListResponse>> {
    return this.service.listContracts(requireContext(), svjIdSchema.parse(svjId));
  }
}
