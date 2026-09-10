import type { Names } from '../lib/names';

export const serviceTs = (names: Names): string => `import { Injectable } from '@nestjs/common';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { events } from '../../../kernel/src/events/index';
import { newRowId } from '../../../kernel/src/ids/index';
import { ${names.camel}RecordCreated } from '../domain/events';
import type { Create${names.pascal}RecordInput, ${names.pascal}Record } from '../domain/types';
import { ${names.camel}Record } from '../schema';

/**
 * The only place that writes. The audit row and the event go inside the same \`withTenant\`
 * transaction as the mutation, so neither can outlive a rollback (docs/engineering.md §5).
 */
@Injectable()
export class ${names.pascal}Service {
  createRecord(ctx: RequestContext, input: Create${names.pascal}RecordInput): Promise<${names.pascal}Record> {
    const id = newRowId();

    return withTenant(ctx, async (tx) => {
      await tx
        .insert(${names.camel}Record)
        .values({ id, tenantId: ctx.tenantId, svjId: input.svjId, title: input.title });

      await audit.record(ctx, {
        action: '${names.snake}.record.created',
        entity: '${names.snake}_record',
        entityId: id,
        reason: 'Založen záznam',
        after: { title: input.title },
      });

      await events.emit(ctx, ${names.camel}RecordCreated.create({ id, title: input.title }));

      return { id, svjId: input.svjId, title: input.title };
    });
  }
}
`;

export const moduleTs = (names: Names): string => `import { Module } from '@nestjs/common';
import { ${names.pascal}Service } from '../service/${names.kebab}.service';

/** Found by \`apps/api\` through the file name; nothing imports it by hand (AGENTS.md §6). */
@Module({ providers: [${names.pascal}Service], exports: [${names.pascal}Service] })
export class ${names.pascal}Module {}
`;
