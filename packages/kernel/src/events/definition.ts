import type { z } from 'zod';

export interface EventEnvelope<N extends string = string, P = unknown> {
  readonly name: N;
  readonly version: number;
  readonly payload: P;
}

export interface EventDefinition<N extends string, S extends z.ZodType> {
  readonly name: N;
  readonly version: number;
  readonly schema: S;
  /** Validates the payload at the point of emission, not at the point of consumption. */
  create(payload: z.input<S>): EventEnvelope<N, z.output<S>>;
}

const FIRST_VERSION = 1;

export const defineEvent = <N extends string, S extends z.ZodType>(
  name: N,
  schema: S,
  options: { readonly version?: number } = {},
): EventDefinition<N, S> => {
  const version = options.version ?? FIRST_VERSION;
  return {
    name,
    version,
    schema,
    create: (payload) => ({ name, version, payload: schema.parse(payload) }),
  };
};
