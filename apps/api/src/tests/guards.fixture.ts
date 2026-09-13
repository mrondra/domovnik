import { Controller, Get, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AuthenticationGuard } from '../http/authentication.guard';
import { registerRequestContext } from '../http/context-hook';
import { RequireSvjAccess, Roles } from '../http/decorators';
import { ErrorFilter } from '../http/exception.filter';
import { RolesGuard } from '../http/roles.guard';
import { SvjAccessGuard } from '../http/svj-access.guard';

/** Two routes that do nothing but carry the decorators, so the guards are what is under test. */
@Controller('probe')
class ProbeController {
  @Get('finance')
  @Roles('finance')
  finance(): { readonly ok: true } {
    return { ok: true };
  }

  @Get('svj')
  @RequireSvjAccess()
  svj(): { readonly ok: true } {
    return { ok: true };
  }
}

@Module({
  controllers: [ProbeController],
  providers: [
    { provide: APP_FILTER, useClass: ErrorFilter },
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: SvjAccessGuard },
  ],
})
class ProbeModule {}

export const startProbeApp = async (): Promise<NestFastifyApplication> => {
  const app = await NestFactory.create<NestFastifyApplication>(ProbeModule, new FastifyAdapter(), {
    logger: false,
  });
  registerRequestContext(app.getHttpAdapter().getInstance());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
};
