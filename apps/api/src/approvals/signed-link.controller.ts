import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { approvals } from '../../../../packages/kernel/src/approvals/index';
import { approvalIdSchema } from '../../../../packages/kernel/src/ids/index';
import { CurrentPrincipal } from '../http/decorators';
import type { Principal } from '../http/state';
import { Endpoint } from '../openapi/contract';
import { SignedLinkGuard } from './signed-link.guard';
import { toDetail } from './approval-view';
import { approvalDetailSchema, decisionResultSchema, decisionSchema } from './approvals.schema';

/**
 * Approving from an e-mail. The link is a **GET that only renders** and the decision is a POST, so
 * the anti-spam scanners that open every link in a message cannot approve anything (zadání kap. 2).
 * The approval is taken from the signature, never from the URL path or the body.
 */
@ApiTags('approvals')
@Controller('a')
@UseGuards(SignedLinkGuard)
export class SignedLinkController {
  @Get(':token')
  @Endpoint({ summary: 'Náhled schválení z podepsaného odkazu', response: approvalDetailSchema })
  async preview(@CurrentPrincipal() principal: Principal): Promise<z.output<typeof approvalDetailSchema>> {
    return toDetail(await approvals.get(principal.ctx, approvalIdSchema.parse(principal.subjectId)));
  }

  @Post(':token/decide')
  @HttpCode(200)
  @Endpoint({ summary: 'Rozhodnutí z podepsaného odkazu', response: decisionResultSchema })
  async decide(
    @CurrentPrincipal() principal: Principal,
    @Body({ schema: decisionSchema }) body: z.output<typeof decisionSchema>,
  ): Promise<z.output<typeof decisionResultSchema>> {
    const id = approvalIdSchema.parse(principal.subjectId);
    const decided = await approvals.decide(principal.ctx, id, body.decision, body.comment);
    return { status: decided.status, output: decided.output };
  }
}
