import { AsyncLocalStorage } from 'node:async_hooks';
import { createLogger, withLogger, type Logger } from '../logger/logger';
import type { RequestContext } from './request-context';

const contextStore = new AsyncLocalStorage<RequestContext>();

export const contextLogger = (ctx: RequestContext): Logger =>
  createLogger({
    tenantId: ctx.tenantId,
    correlationId: ctx.correlationId,
    actorType: ctx.actor.type,
    actorId: ctx.actor.id ?? undefined,
    svjId: ctx.svjId,
    agentRunId: ctx.agentRunId,
  });

/** Makes `ctx` and a logger bound to it ambient for everything `fn` calls. */
export const runInContext = <T>(ctx: RequestContext, fn: () => T): T =>
  contextStore.run(ctx, () => withLogger(contextLogger(ctx), fn));

export const currentContext = (): RequestContext | undefined => contextStore.getStore();
