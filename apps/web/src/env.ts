import { z } from 'zod';

/**
 * The web application holds no database, no object storage and no model key — it reads and writes
 * everything through the API (task 006 §5). Its environment is therefore its own, not the kernel's.
 */
const schema = z.object({
  API_URL: z.url().default('http://localhost:3001'),
});

export type WebEnv = z.output<typeof schema>;

let cached: WebEnv | undefined;

export const webEnv = (): WebEnv => (cached ??= schema.parse(process.env));
