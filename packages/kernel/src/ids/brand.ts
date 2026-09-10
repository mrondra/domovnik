import { z } from 'zod';
import { v7 as uuidv7 } from 'uuid';

export type BrandedId<B extends string> = PropertyKey extends B
  ? z.ZodUUID
  : z.core.$ZodBranded<z.ZodUUID, B>;

/**
 * Branded identifier schema. The brand makes `TenantId` and `SvjId` mutually unassignable even
 * though both are uuid strings at runtime.
 */
export const brand = <B extends string>(name: B): BrandedId<B> =>
  z.uuid({ error: `Not a valid ${name}` }).brand<B>();

/** Time-ordered uuid v7 so primary keys stay index-friendly. */
export const newId = <S extends z.ZodType>(schema: S): z.output<S> => schema.parse(uuidv7());

/** Primary key for rows whose identity is not referenced across module boundaries. */
export const newRowId = (): string => uuidv7();
