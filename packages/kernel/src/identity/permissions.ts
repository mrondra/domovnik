import type { Actor } from '../context/index';
import type { Role } from './roles';

/**
 * Kernel default mapping. Features name the permissions they need on their tools; a deployment can
 * narrow a role further through `user_role` rows scoped to a single SVJ.
 */
const ROLE_PERMISSIONS: Readonly<Record<Role, readonly string[]>> = {
  tenant_admin: ['*'],
  manager: ['svj.*', 'ops.*', 'tasks.*', 'documents.*', 'comms.*', 'approval.decide'],
  finance: ['finance.*', 'svj.read', 'documents.read', 'approval.decide'],
  technician: ['ops.read', 'tasks.read', 'tasks.update', 'defects.*', 'field.*'],
  committee: ['svj.read', 'finance.read', 'ops.read', 'documents.read', 'approval.decide'],
  owner: ['owner.self'],
  agent_author: ['agent.compose'],
};

const matches = (pattern: string, permission: string): boolean => {
  if (pattern === '*' || pattern === permission) return true;
  if (!pattern.endsWith('.*')) return false;
  return permission.startsWith(pattern.slice(0, -1));
};

export const permissionsOf = (roles: readonly Role[]): readonly string[] =>
  roles.flatMap((role) => ROLE_PERMISSIONS[role]);

export const hasPermission = (actor: Actor, permission: string): boolean =>
  actor.type === 'system' || permissionsOf(actor.roles).some((pattern) => matches(pattern, permission));
