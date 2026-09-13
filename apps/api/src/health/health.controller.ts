import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { pingDatabase } from '../../../../packages/kernel/src/db/index';
import { Public } from '../http/decorators';
import { Endpoint } from '../openapi/contract';

const healthSchema = z.object({ status: z.literal('ok'), database: z.literal('ok') });

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @Endpoint({ summary: 'Liveness a dostupnost databáze', response: healthSchema })
  async check(): Promise<z.output<typeof healthSchema>> {
    await pingDatabase();
    return { status: 'ok', database: 'ok' };
  }
}
