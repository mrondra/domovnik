import type { z } from 'zod';
import { brand } from './brand';

export const tenantIdSchema = brand('TenantId');
export const svjIdSchema = brand('SvjId');
export const userIdSchema = brand('UserId');
export const agentIdSchema = brand('AgentId');
export const agentRunIdSchema = brand('AgentRunId');
export const eventIdSchema = brand('EventId');
export const approvalIdSchema = brand('ApprovalId');
export const apiTokenIdSchema = brand('ApiTokenId');

export type TenantId = z.infer<typeof tenantIdSchema>;
export type SvjId = z.infer<typeof svjIdSchema>;
export type UserId = z.infer<typeof userIdSchema>;
export type AgentId = z.infer<typeof agentIdSchema>;
export type AgentRunId = z.infer<typeof agentRunIdSchema>;
export type EventId = z.infer<typeof eventIdSchema>;
export type ApprovalId = z.infer<typeof approvalIdSchema>;
export type ApiTokenId = z.infer<typeof apiTokenIdSchema>;
