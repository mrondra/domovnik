import { AsyncLocalStorage } from 'node:async_hooks';
import { DomainError } from '../errors/taxonomy';
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

/**
 * For code that only ever runs inside a request and has no parameter to carry the context: a
 * feature's own controller, where the `@Ctx()` parameter decorator lives in `apps/api` and is out
 * of reach (ADR 0002). `apps/api` opens the scope in its Fastify hook (task 004 §2).
 */
export const requireContext = (): RequestContext => {
  const ctx = contextStore.getStore();
  if (ctx === undefined) {
    throw new DomainError('Kód běží mimo RequestContext', { code: 'context_missing' });
  }
  return ctx;
};
