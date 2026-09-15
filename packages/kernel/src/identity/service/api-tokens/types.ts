import type { Role } from '../../roles';
import type { ApiTokenId, SvjId, TenantId, UserId } from '../../../ids/index';

export interface CreateApiTokenInput {
  readonly name: string;
  readonly ownerUserId: UserId;
  readonly allowedTools: readonly string[];
  readonly svjScope?: readonly SvjId[] | undefined;
  readonly expiresAt?: Date | undefined;
}

export interface IssuedApiToken {
  readonly id: ApiTokenId;
  readonly token: string;
}

/** What a bearer token resolves to: the tenant, the owner and the owner's roles *right now*. */
export interface ApiTokenGrant {
  /** Identifies the token in the audit log (`via: api_token:<id>`, zadání kap. 9). */
  readonly id: ApiTokenId;
  readonly tenantId: TenantId;
  readonly ownerUserId: UserId;
  readonly allowedTools: readonly string[];
  readonly svjScope: readonly SvjId[] | null;
  readonly roles: readonly Role[];
}

export interface ApiTokenSummary {
  readonly id: ApiTokenId;
  readonly name: string;
  readonly ownerUserId: UserId;
  readonly allowedTools: readonly string[];
  readonly svjScope: readonly SvjId[] | null;
  readonly expiresAt: Date | null;
  readonly lastUsedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}
