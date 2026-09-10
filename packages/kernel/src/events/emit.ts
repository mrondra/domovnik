import type { RequestContext } from '../context/index';
import { currentTransaction } from '../db/tenant';
import { event as eventTable, eventOutbox } from '../db/schema/index';
import { DomainError } from '../errors/index';
import { eventIdSchema, newId, newRowId, type EventId } from '../ids/index';
import type { EventEnvelope } from './definition';

/**
 * Writes the event and its outbox row inside the caller's transaction, so an event can never
 * survive a rolled back mutation. Emitting outside `withTenant` is a programming error.
 */
export const emit = async (ctx: RequestContext, envelope: EventEnvelope): Promise<EventId> => {
  const tx = currentTransaction();
  if (tx === undefined) {
    throw new DomainError('events.emit musí běžet uvnitř withTenant', {
      code: 'event_outside_transaction',
      details: { event: envelope.name },
    });
  }

  const eventId = newId(eventIdSchema);
  const row = {
    id: eventId,
    tenantId: ctx.tenantId,
    createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
    name: envelope.name,
    version: envelope.version,
    payload: envelope.payload,
    actorType: ctx.actor.type,
    actorId: ctx.actor.id,
    correlationId: ctx.correlationId,
    svjId: ctx.svjId ?? null,
  };

  await tx.insert(eventTable).values(row);
  await tx.insert(eventOutbox).values({
    id: newRowId(),
    tenantId: ctx.tenantId,
    createdBy: row.createdBy,
    eventId,
    name: envelope.name,
  });

  return eventId;
};
