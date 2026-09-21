import { z } from 'zod';
import { periodSchema } from '../domain/period';
import { prescriptionSchema, unitBalanceSchema } from '../domain/schemas';

/** What the browser side of this feature sees; the screens fetch nothing themselves (ADR 0017). */
export const prescriptionListView = z.array(prescriptionSchema);
export const unitBalanceListView = z.array(unitBalanceSchema);

export type PrescriptionView = z.output<typeof prescriptionSchema>;
export type UnitBalanceView = z.output<typeof unitBalanceSchema>;
export type PeriodView = z.output<typeof periodSchema>;
