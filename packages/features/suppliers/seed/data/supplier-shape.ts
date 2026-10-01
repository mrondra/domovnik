import type { Specialization } from '../../domain/specializations';

export interface DemoSupplier {
  /** The stable key the seed upserts by, and what contracts and demo scenarios refer to. */
  readonly code: string;
  readonly name: string;
  readonly ico: string;
  readonly bankAccount: string;
  readonly email?: string | undefined;
  readonly specializations: readonly Specialization[];
  readonly phone?: string | undefined;
}
