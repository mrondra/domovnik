import { approvals } from '../../../packages/kernel/src/approvals/index';
import { createContext, type RequestContext } from '../../../packages/kernel/src/context/index';
import { closeConnections } from '../../../packages/kernel/src/db/index';
import { createSignedLink, createTenant, createUser } from '../../../packages/kernel/src/identity/index';
import type { ApprovalId, UserId } from '../../../packages/kernel/src/ids/index';

/**
 * An approval is normally opened by a tool, and no feature ships one yet. Until then the suite
 * writes the row itself, through the kernel — the same call a tool makes — so the screens under
 * test see exactly what they will see in production.
 */
export const DEMO_TOOL = 'letter.send';

/** Kept in step with `APPROVAL_LINK_PURPOSE` in `apps/api`; one app may not import another's source. */
const LINK_PURPOSE = 'approval.decide';

const PASSWORD = 'e2e-heslo-12345';

export interface Fixture {
  readonly ctx: RequestContext;
  readonly userId: UserId;
  readonly email: string;
  readonly password: string;
  readonly approvalId: ApprovalId;
}

/** A tenant of its own per run, so a run never reads or decides another run's approvals. */
export const seedPendingApproval = async (): Promise<Fixture> => {
  const run = Date.now().toString(36);
  const tenantId = await createTenant({ name: `E2E ${run}` });
  const system = createContext({ tenantId, actor: { type: 'system', id: null, roles: [] } });

  const email = `vybor-${run}@e2e.domovnik.test`;
  const userId = await createUser(system, {
    email,
    displayName: 'Karel Předseda',
    password: PASSWORD,
    roles: ['committee'],
  });

  const ctx = createContext({ tenantId, actor: { type: 'user', id: userId, roles: ['committee'] } });
  const approvalId = await approvals.create(ctx, {
    toolName: DEMO_TOOL,
    input: { to: 'Nováková', subject: 'Upomínka' },
    evidence: { reason: 'Nezaplacený předpis za dva měsíce' },
    approvers: [userId],
  });

  return { ctx, userId, email, password: PASSWORD, approvalId };
};

export const signedLinkFor = (fixture: Fixture): string =>
  createSignedLink({
    purpose: LINK_PURPOSE,
    tenantId: fixture.ctx.tenantId,
    actorId: fixture.userId,
    subjectId: fixture.approvalId,
    expiresIn: 600,
  });

export const statusOf = async (fixture: Fixture): Promise<string> =>
  (await approvals.get(fixture.ctx, fixture.approvalId)).status;

export const releaseDatabase = (): Promise<void> => closeConnections();
