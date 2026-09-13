import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ApiTokensModule } from './api-tokens/api-tokens.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AuthModule } from './auth/auth.module';
import { featureModules } from './features/modules.generated';
import { HealthModule } from './health/health.module';
import { AuthenticationGuard } from './http/authentication.guard';
import { ErrorFilter } from './http/exception.filter';
import { RolesGuard } from './http/roles.guard';
import { SvjAccessGuard } from './http/svj-access.guard';

/**
 * Composition only (AGENTS.md §2). The kernel-owned endpoints live here because the entities they
 * serve — approvals, API tokens, identity — belong to the kernel; everything with a domain arrives
 * through `featureModules`, which is generated from what is on disk.
 */
@Module({
  imports: [HealthModule, AuthModule, ApprovalsModule, ApiTokensModule, ...featureModules],
  providers: [
    { provide: APP_FILTER, useClass: ErrorFilter },
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: SvjAccessGuard },
  ],
})
export class AppModule {}
