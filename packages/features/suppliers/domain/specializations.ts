import { z } from 'zod';

/**
 * What a supplier can do. `inspections` (task 037) asks "does the SVJ have a contracted firm for
 * `revize_elektro`?" by filtering `Contract.covers` against this list.
 */
export const specializationSchema = z.enum([
  'revize_elektro',
  'revize_hromosvod',
  'revize_plyn',
  'vytahy',
  'hasici_pristroje',
  'kominy',
  'uklid',
  'instalater',
  'elektrikar',
  'strechy',
  'zednik',
  'pojisteni',
  'energie',
  'ostatni',
]);

export type Specialization = z.infer<typeof specializationSchema>;
