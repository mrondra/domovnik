import type { z } from 'zod';
import { brand } from '../../../kernel/src/ids/index';

export const buildingIdSchema = brand('BuildingId');
export const unitIdSchema = brand('UnitId');
export const departmentIdSchema = brand('DepartmentId');

export type BuildingId = z.infer<typeof buildingIdSchema>;
export type UnitId = z.infer<typeof unitIdSchema>;
export type DepartmentId = z.infer<typeof departmentIdSchema>;
