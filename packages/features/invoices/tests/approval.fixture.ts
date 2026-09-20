import { createContext, type RequestContext } from '../../../kernel/src/context/index';
import { createUser } from '../../../kernel/src/identity/index';
import type { SvjId, UserId } from '../../../kernel/src/ids/index';
import { SvjService } from '../../svj/index';
import type { InvoiceId } from '../domain/ids';
import { processScenario, seedCleaningSupplier, seedTidySvj } from './extraction.fixture';

const svj = new SvjService();

export interface ReadyForApproval {
  readonly svjId: SvjId;
  readonly invoiceId: InvoiceId;
  readonly chairId: UserId;
  /** The chair's own context: a committee member of this SVJ and nothing else. */
  readonly chair: RequestContext;
}

let sequence = 0;

/**
 * An SVJ with a committee of one, an invoice that got through the checks, and the chair's own
 * context to decide with. It is the state the agent leaves behind before anyone is asked anything.
 */
export const readyForApproval = async (ctx: RequestContext, scenario: string): Promise<ReadyForApproval> => {
  sequence += 1;
  const created = await svj.createSvj(ctx, {
    name: `SVJ ${String(sequence)}`,
    ico: String(30_000_000 + sequence),
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
  });

  const chairId = await createUser(ctx, {
    email: `vybor${String(sequence)}@example.test`,
    displayName: 'Člen výboru',
    password: 'test-password',
    roles: ['committee'],
    svjId: created.id,
  });
  await svj.updateSvj(ctx, created.id, { committee: [chairId] });

  await seedTidySvj(ctx, created.id, await seedCleaningSupplier(ctx));
  const invoice = await processScenario(ctx, created.id, scenario);

  return {
    svjId: created.id,
    invoiceId: invoice.id,
    chairId,
    chair: createContext({
      tenantId: ctx.tenantId,
      actor: { type: 'user', id: chairId, roles: ['committee'] },
      svjScope: [created.id],
    }),
  };
};
