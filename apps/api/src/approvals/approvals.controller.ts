import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { approvals } from '../../../../packages/kernel/src/approvals/index';
import type { RequestContext } from '../../../../packages/kernel/src/context/index';
import { approvalIdSchema } from '../../../../packages/kernel/src/ids/index';
import { Ctx } from '../http/decorators';
import { Endpoint } from '../openapi/contract';
import { AllowedToolGuard } from './allowed-tool.guard';
import { toDetail, toSummary } from './approval-view';
import {
  approvalDetailSchema,
  approvalSummarySchema,
  decisionResultSchema,
  decisionSchema,
  inboxQuerySchema,
} from './approvals.schema';

const inboxSchema = z.array(approvalSummarySchema);

@ApiTags('approvals')
@Controller('approvals')
export class ApprovalsController {
  @Get()
  @Endpoint({ summary: 'Co mám rozhodnout', response: inboxSchema })
  async inbox(
    @Ctx() ctx: RequestContext,
    @Query({ schema: inboxQuerySchema }) query: z.output<typeof inboxQuerySchema>,
  ): Promise<z.output<typeof inboxSchema>> {
    return (await approvals.list(ctx, query)).map(toSummary);
  }

  @Get(':id')
  @Endpoint({ summary: 'Detail schválení včetně evidence', response: approvalDetailSchema })
  async detail(
    @Ctx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<z.output<typeof approvalDetailSchema>> {
    return toDetail(await approvals.get(ctx, approvalIdSchema.parse(id)));
  }

  @Post(':id/decide')
  @HttpCode(200)
  @UseGuards(AllowedToolGuard)
  @Endpoint({ summary: 'Rozhodnutí o schválení', response: decisionResultSchema })
  async decide(
    @Ctx() ctx: RequestContext,
    @Param('id') id: string,
    @Body({ schema: decisionSchema }) body: z.output<typeof decisionSchema>,
  ): Promise<z.output<typeof decisionResultSchema>> {
    const decided = await approvals.decide(ctx, approvalIdSchema.parse(id), body.decision, body.comment);
    return { status: decided.status };
  }
}
