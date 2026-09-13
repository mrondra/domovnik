import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { RequestContext } from '../../../../packages/kernel/src/context/index';
import {
  createApiToken,
  listApiTokens,
  revokeApiToken,
} from '../../../../packages/kernel/src/identity/index';
import { apiTokenIdSchema, svjIdSchema, userIdSchema } from '../../../../packages/kernel/src/ids/index';
import { getTools } from '../../../../packages/kernel/src/tools/index';
import { Ctx } from '../http/decorators';
import { Endpoint } from '../openapi/contract';
import {
  availableToolSchema,
  createTokenSchema,
  issuedTokenSchema,
  tokenSummarySchema,
} from './api-tokens.schema';
import { toTokenSummary } from './token-view';

const listSchema = z.array(tokenSummarySchema);
const toolsSchema = z.array(availableToolSchema);
const acknowledgedSchema = z.object({ ok: z.literal(true) });

@ApiTags('api-tokens')
@Controller('api-tokens')
export class ApiTokensController {
  @Get('tools')
  @Endpoint({ summary: 'Tooly, ze kterých lze pro token vybírat', response: toolsSchema })
  availableTools(@Ctx() ctx: RequestContext): z.output<typeof toolsSchema> {
    return getTools({ actor: ctx.actor }).map((tool) => ({
      name: tool.name,
      description: tool.description,
      readOnly: tool.readOnly,
      userComposable: tool.userComposable,
    }));
  }

  @Get()
  @Endpoint({ summary: 'Vydané tokeny včetně revokovaných', response: listSchema })
  async list(@Ctx() ctx: RequestContext): Promise<z.output<typeof listSchema>> {
    return (await listApiTokens(ctx)).map(toTokenSummary);
  }

  @Post()
  @HttpCode(201)
  @Endpoint({ summary: 'Vydání tokenu; plaintext se vrací jednou', response: issuedTokenSchema, status: 201 })
  async create(
    @Ctx() ctx: RequestContext,
    @Body({ schema: createTokenSchema }) body: z.output<typeof createTokenSchema>,
  ): Promise<z.output<typeof issuedTokenSchema>> {
    return createApiToken(ctx, {
      name: body.name,
      ownerUserId: userIdSchema.parse(ctx.actor.id),
      allowedTools: body.allowedTools,
      svjScope: body.svjScope?.map((id) => svjIdSchema.parse(id)),
      expiresAt: body.expiresAt === null ? undefined : new Date(body.expiresAt),
    });
  }

  @Delete(':id')
  @Endpoint({ summary: 'Revokace tokenu', response: acknowledgedSchema })
  async revoke(
    @Ctx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<z.output<typeof acknowledgedSchema>> {
    await revokeApiToken(ctx, apiTokenIdSchema.parse(id));
    return { ok: true };
  }
}
