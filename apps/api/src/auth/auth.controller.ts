import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { z } from 'zod';
import { loadEnv } from '../../../../packages/kernel/src/env/index';
import { authenticate, createSession, revokeSession } from '../../../../packages/kernel/src/identity/index';
import { createContext } from '../../../../packages/kernel/src/context/index';
import { CurrentPrincipal, Public } from '../http/decorators';
import type { Principal } from '../http/state';
import { Endpoint } from '../openapi/contract';
import { acknowledgedSchema, loggedInSchema, loginSchema, meSchema } from './auth.schema';
import { clearedSessionCookie, sessionCookie, SESSION_TTL_SECONDS } from './session-cookie';

type Login = z.output<typeof loginSchema>;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  @HttpCode(200)
  @Endpoint({ summary: 'Přihlášení e-mailem a heslem', response: loggedInSchema })
  async login(
    @Body({ schema: loginSchema }) body: Login,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<z.output<typeof loggedInSchema>> {
    const user = await authenticate(body.email, body.password);
    const ctx = createContext({
      tenantId: user.tenantId,
      actor: { type: 'user', id: user.userId, roles: user.roles },
    });
    const session = await createSession(ctx, user.userId, SESSION_TTL_SECONDS);

    reply.header('set-cookie', sessionCookie(session.token, loadEnv().NODE_ENV === 'production'));
    return { userId: user.userId, expiresAt: session.expiresAt.toISOString() };
  }

  @Post('logout')
  @HttpCode(200)
  @Endpoint({ summary: 'Odhlášení a zneplatnění relace', response: acknowledgedSchema })
  async logout(
    @CurrentPrincipal() principal: Principal,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<z.output<typeof acknowledgedSchema>> {
    if (principal.sessionToken !== null) {
      await revokeSession(principal.ctx, principal.sessionToken);
    }
    reply.header('set-cookie', clearedSessionCookie(loadEnv().NODE_ENV === 'production'));
    return { ok: true };
  }

  @Get('me')
  @Endpoint({ summary: 'Kdo právě volá', response: meSchema })
  me(@CurrentPrincipal() principal: Principal): z.output<typeof meSchema> {
    const { ctx } = principal;
    return {
      tenantId: ctx.tenantId,
      userId: ctx.actor.id,
      roles: [...ctx.actor.roles],
      svjId: ctx.svjId ?? null,
      credential: principal.credential,
    };
  }
}
