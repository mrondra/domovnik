import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { SvjService } from '../service/index';
import { departmentListResponse } from './svj.schema';

/** Departments are the management company's own organisation, so they hang off the tenant. */
@ApiTags('svj')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly svj: SvjService) {}

  @Get()
  @ApiOperation({ summary: 'Oddělení správcovské firmy' })
  @ApiResponse({ status: 200, description: 'Seznam oddělení', standardSchema: departmentListResponse })
  list(): Promise<z.output<typeof departmentListResponse>> {
    return this.svj.listDepartments(requireContext());
  }
}
