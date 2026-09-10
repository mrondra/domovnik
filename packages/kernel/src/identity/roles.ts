export const ROLES = [
  'tenant_admin',
  'manager',
  'finance',
  'technician',
  'committee',
  'owner',
  'agent_author',
] as const;

export type Role = (typeof ROLES)[number];
