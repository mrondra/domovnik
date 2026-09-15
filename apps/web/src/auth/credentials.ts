import { z } from 'zod';

/** Lives outside the action module: a `"use server"` file may export nothing but async functions. */
export const credentialsSchema = z.object({
  email: z.email('Zadej platný e-mail.'),
  password: z.string().min(1, 'Heslo je povinné.'),
});

export type Credentials = z.output<typeof credentialsSchema>;
