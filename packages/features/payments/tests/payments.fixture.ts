import { eq } from 'drizzle-orm';
import * as composedSchema from '../../../db/src/schema';
import type { RequestContext } from '../../../kernel/src/context/index';
import { schema, withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { startTestDb, withTestTenant, type TestDatabase } from '../../../kernel/src/testing/index';
import { generatePrescriptions, type Period } from '../../receivables/index';
import { SvjService, type Unit } from '../../svj/index';
import { createBankAccount } from '../service/index';
import type { BankAccountId } from '../domain/ids';

/** Matching reaches `receivables` and `invoices`; the world is the composed one (task 020). */
export const startPaymentsDb = (): Promise<TestDatabase> => startTestDb({ ...composedSchema });

export const PERIOD: Period = { year: 2026, month: 9 };
export const MONTHLY = 3300;

const PLAN = {
  items: [
    { code: 'fond_oprav', label: 'Fond oprav', basis: 'per_square_metre', rate: 25 },
    { code: 'zalohy_sluzby', label: 'Zálohy na služby', basis: 'per_unit', rate: 1800 },
    { code: 'sprava', label: 'Správa', basis: 'per_unit', rate: 250 },
  ],
  dueDayOfMonth: 15,
} as const;

export interface PaidHouse {
  readonly svjId: SvjId;
  readonly bankAccountId: BankAccountId;
  readonly units: readonly Unit[];
  /** The variable symbol of each unit, in the order the units were created. */
  readonly symbols: readonly string[];
}

let sequence = 0;

/**
 * A house whose every unit owes the same 3 300 Kč for September, and an account for the money to
 * arrive on. Identical amounts are what make the acceptance case readable: a movement either fits
 * or it does not, for a reason the test states rather than one the data hides.
 */
export const seedPaidHouse = async (ctx: RequestContext, unitCount: number): Promise<PaidHouse> => {
  sequence += 1;
  const svj = new SvjService();
  const created = await svj.createSvj(ctx, {
    name: `SVJ ${String(sequence)}`,
    ico: String(60_000_000 + sequence),
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
  });

  const house = await svj.createBuilding(ctx, {
    svjId: created.id,
    label: 'Vchod A',
    street: 'Krátká 1',
  });

  for (let number = 1; number <= unitCount; number += 1) {
    await svj.createUnit(ctx, {
      svjId: created.id,
      buildingId: house.id,
      number: String(number),
      kind: 'apartment',
      share: { numerator: 5000, denominator: unitCount * 5000 },
      floorArea: 50,
    });
  }

  const raised = await generatePrescriptions(ctx, { svjId: created.id, period: PERIOD, plan: PLAN });
  const account = await createBankAccount(ctx, {
    svjId: created.id,
    number: String(2_800_000_000 + sequence),
    bankCode: '2010',
    label: 'Běžný účet SVJ',
    isPrimary: true,
  });

  return {
    svjId: created.id,
    bankAccountId: account.id,
    units: await svj.listUnits(ctx, created.id),
    symbols: [...raised].map((one) => one.variableSymbol),
  };
};

/** How many events of a kind the outbox holds for this tenant; the agent is woken from it. */
export const eventCount = (ctx: RequestContext, name: string): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(schema.event).where(eq(schema.event.name, name));
    return rows.length;
  });

export const eventPayloads = (ctx: RequestContext, name: string): Promise<readonly unknown[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ payload: schema.event.payload })
      .from(schema.event)
      .where(eq(schema.event.name, name));
    return rows.map((row) => row.payload);
  });

export { withTestTenant };
export type { TestDatabase };
