import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { SvjService } from '../service/index';
import { svjDetailResponse, svjListResponse, unitListResponse } from './svj.schema';

/**
 * The context comes from the ambient scope `apps/api` opens per request (task 004 §2): the `@Ctx()`
 * parameter decorator lives in `apps/api` and a feature may not import from an app (ADR 0002).
 */
@ApiTags('svj')
@Controller('svj')
export class SvjController {
  constructor(private readonly svj: SvjService) {}

  @Get()
  @ApiOperation({ summary: 'SVJ dostupná přihlášenému aktérovi' })
  @ApiResponse({ status: 200, description: 'Seznam SVJ', standardSchema: svjListResponse })
  list(): Promise<z.output<typeof svjListResponse>> {
    return this.svj.listForActor(requireContext());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Základní údaje SVJ' })
  @ApiResponse({ status: 200, description: 'Detail SVJ', standardSchema: svjDetailResponse })
  detail(@Param('id') id: string): Promise<z.output<typeof svjDetailResponse>> {
    return this.svj.getById(requireContext(), svjIdSchema.parse(id));
  }

  @Get(':id/units')
  @ApiOperation({ summary: 'Jednotky SVJ' })
  @ApiResponse({ status: 200, description: 'Seznam jednotek', standardSchema: unitListResponse })
  units(@Param('id') id: string): Promise<z.output<typeof unitListResponse>> {
    return this.svj.listUnits(requireContext(), svjIdSchema.parse(id));
  }
}
