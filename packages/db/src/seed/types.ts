import type { RequestContext } from '../../../kernel/src/context/index';
import type { TenantId } from '../../../kernel/src/ids/index';

/** What the kernel seed hands to every feature seed: the demo tenant and a system context on it. */
export interface SeedContext {
  readonly tenantId: TenantId;
  readonly ctx: RequestContext;
}

/**
 * A feature exports one of these from `seed/index.ts`. `dependsOn` carries feature names, so a seed
 * that needs SVJ units in place declares it instead of relying on the order of the glob.
 */
export interface SeedModule {
  readonly name: string;
  readonly dependsOn?: readonly string[] | undefined;
  run(context: SeedContext): Promise<void>;
}
