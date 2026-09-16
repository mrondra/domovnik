import { z } from 'zod';
import { departmentSchema, svjSchema, svjSummarySchema, unitSchema } from '../domain/schemas';

/** The HTTP contract is the domain shape: one zod schema both validates and documents it. */
export const svjListResponse = z.array(svjSummarySchema).readonly();
export const svjDetailResponse = svjSchema;
export const unitListResponse = z.array(unitSchema).readonly();
export const departmentListResponse = z.array(departmentSchema).readonly();
