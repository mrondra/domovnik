import { Controller, HttpCode, Param, Post, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { z } from 'zod';
import { requireContext } from '../../../kernel/src/context/index';
import { ForbiddenError } from '../../../kernel/src/errors/index';
import { DemoService } from '../service/index';
import { scenarioListResponse, scenarioRunResponse } from './demo.schema';

const OK = 200;
const ADMIN = 'tenant_admin';

/**
 * Tagged `demo` in the OpenAPI document so nobody mistakes it for part of the real API, and open
 * only to a tenant administrator: running a scenario creates real invoices in real SVJ.
 *
 * The role is checked here rather than with a guard, because the guards live in `apps/api` and a
 * feature may not import from an app (ADR 0002).
 */
@ApiTags('demo')
@Controller('demo/scenarios')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Get()
  @ApiOperation({ summary: 'Připravené demo scénáře (demo)' })
  @ApiResponse({ status: OK, description: 'Seznam scénářů', standardSchema: scenarioListResponse })
  list(): Promise<z.output<typeof scenarioListResponse>> {
    return this.demo.list(requireAdmin());
  }

  @Post(':code/run')
  @HttpCode(OK)
  @ApiOperation({ summary: 'Spustí demo scénář (demo)' })
  @ApiResponse({ status: OK, description: 'Výsledek scénáře', standardSchema: scenarioRunResponse })
  run(@Param('code') code: string): Promise<z.output<typeof scenarioRunResponse>> {
    return this.demo.run(requireAdmin(), code);
  }
}

const requireAdmin = (): ReturnType<typeof requireContext> => {
  const ctx = requireContext();
  if (!ctx.actor.roles.includes(ADMIN)) {
    throw new ForbiddenError('Demo scénáře smí spouštět jen správce tenanta', {
      code: 'demo_forbidden',
      details: { role: ADMIN },
    });
  }
  return ctx;
};
