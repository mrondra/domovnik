import type { Names } from '../lib/names';

export const indexTs = (
  names: Names,
): string => `export { ${names.pascal}Module } from './api/${names.kebab}.module';
export { ${names.camel}RecordCreated } from './domain/events';
export type { Create${names.pascal}RecordInput, ${names.pascal}Record } from './domain/types';
export { ${names.pascal}Service } from './service/${names.kebab}.service';
`;

export const schemaTs = (names: Names): string => `import { text } from 'drizzle-orm/pg-core';
import { svjTable } from '../../kernel/src/db/index';

/**
 * Sample table — rename it or replace it. Going through \`svjTable\` is what puts \`tenant_id\`,
 * \`svj_id\` and the audit columns on it and what registers its RLS policy (docs/engineering.md §8).
 */
export const ${names.camel}Record = svjTable('${names.snake}_record', {
  title: text('title').notNull(),
});
`;

export const domainTypes = (
  names: Names,
): string => `import type { SvjId } from '../../../kernel/src/ids/index';

export interface ${names.pascal}Record {
  readonly id: string;
  readonly svjId: SvjId;
  readonly title: string;
}

export interface Create${names.pascal}RecordInput {
  readonly svjId: SvjId;
  readonly title: string;
}
`;

export const domainEvents = (names: Names): string => `import { z } from 'zod';
import { defineEvent } from '../../../kernel/src/events/index';

/** Domain events are past tense and named \`domena.entita.akce\` (docs/engineering.md §3). */
export const ${names.camel}RecordCreated = defineEvent(
  '${names.snake}.record.created',
  z.object({ id: z.uuid(), title: z.string().min(1) }),
);
`;

export const demoResetTs = (names: Names): string => `import { defineDemoReset } from '../../demo/index';

/**
 * What a demonstration threw away, once this feature has something worth throwing away. Returns
 * how many rows it removed — \`0\` until this feature writes something a demo scenario produces
 * (task 028).
 */
export const ${names.camel}DemoReset = defineDemoReset({
  feature: '${names.kebab}',
  run: () => Promise.resolve(0),
});
`;

export const demoReadme = (names: Names): string => `# ${names.kebab}/demo

| File       | Contents                                          |
| ---------- | -------------------------------------------------- |
| \`reset.ts\` | registers this feature's \`demoReset\` with \`demo\`  |

**The rule:** \`demo\` never imports this directory. A scenario kind of this feature's own belongs
here too, in its own file, found by \`demo\`'s glob discovery (\`loadDemoModules\`) the moment it
exists — nothing here is ever imported by name.
`;
