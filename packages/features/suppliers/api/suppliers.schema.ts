import { z } from 'zod';
import { contractSchema, supplierSchema } from '../domain/schemas';

/** The HTTP contract is the domain shape: one zod schema both validates and documents it. */
export const supplierListResponse = z.array(supplierSchema).readonly();
export const contractListResponse = z.array(contractSchema).readonly();
