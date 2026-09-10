import { defineConfig } from 'drizzle-kit';

/**
 * `src/schema.ts` is generated (see `src/compose.ts`); Drizzle Kit only ever sees the composed
 * module, so a new feature needs no change here. Migrations are decorated afterwards with the RLS
 * policies and the pgvector extension — `pnpm db:generate` runs both steps.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
});
