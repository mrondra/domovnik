import type { RequestContext } from '../../../../kernel/src/context/index';
import type { SvjId } from '../../../../kernel/src/ids/index';
import { listInvoices } from '../../../invoices/index';
import { listPrescriptions, type Period, type Prescription } from '../../../receivables/index';
import type { IncomingTransaction, IsoDay } from '../../domain/types';
import { formatPeriod, periodsBetween, within } from './periods';
import { mistype, type PayerProfile } from './profile';

const JOINT_MONTHS = 2;

/** What one unit sends in one month, or nothing at all. The order of the prescriptions decides. */
const paymentFor = (
  prescription: Prescription,
  at: number,
  period: Period,
  profile: PayerProfile,
  taken: ReadonlySet<string>,
): IncomingTransaction | null => {
  if (profile.silent.includes(at)) return null;

  const paysJointly = profile.joint === at;
  if (paysJointly && period.month % JOINT_MONTHS === 1) return null;

  const short = profile.short?.at === at ? profile.short.by : 0;
  const amount = prescription.totalAmount * (paysJointly ? JOINT_MONTHS : 1) - short;

  return {
    externalId: `syn-${formatPeriod(period)}-${prescription.variableSymbol}`,
    bookedOn: prescription.dueDate,
    amount,
    counterpartyName: `Vlastník ${prescription.variableSymbol}`,
    variableSymbol: profile.mistyped.includes(at)
      ? mistype(prescription.variableSymbol, taken)
      : prescription.variableSymbol,
    message: `Platba ${formatPeriod(period)}`,
  };
};

const incomeFor = async (
  ctx: RequestContext,
  svjId: SvjId,
  period: Period,
  profile: PayerProfile,
): Promise<readonly IncomingTransaction[]> => {
  const raised = await listPrescriptions(ctx, { svjId, period });
  const taken = new Set(raised.map((one) => one.variableSymbol));

  return raised.flatMap((prescription, at) => {
    const payment = paymentFor(prescription, at, period, profile, taken);
    return payment === null ? [] : [payment];
  });
};

/**
 * What left the account: the invoices the management company has already booked into Pohoda, paid
 * on the day they fell due. An invoice that has not been posted has not been paid either, so the
 * statement does not show one (ADR 0005).
 */
const expensesFor = async (
  ctx: RequestContext,
  svjId: SvjId,
  from: IsoDay,
  to: IsoDay,
): Promise<readonly IncomingTransaction[]> => {
  const posted = await listInvoices(ctx, { svjId, status: 'posted' });

  return posted.flatMap((invoice) =>
    within(invoice.dueOn, from, to) && invoice.amountTotal !== null && invoice.dueOn !== null
      ? [
          {
            externalId: `syn-inv-${invoice.id}`,
            bookedOn: invoice.dueOn,
            amount: -invoice.amountTotal,
            counterpartyName: 'Dodavatel',
            variableSymbol: invoice.variableSymbol ?? undefined,
            message: `Úhrada faktury ${invoice.externalNumber ?? ''}`.trim(),
          },
        ]
      : [],
  );
};

/**
 * A statement for one house and one stretch of time. It is a function of what the house was asked
 * to pay and of its profile — no randomness anywhere, so generating it twice gives the same file
 * and importing it twice adds nothing (task 021).
 */
export const generateStatement = async (
  ctx: RequestContext,
  svjId: SvjId,
  profile: PayerProfile,
  range: { readonly from: IsoDay; readonly to: IsoDay },
): Promise<readonly IncomingTransaction[]> => {
  const months = periodsBetween(range.from, range.to);
  const income: IncomingTransaction[] = [];

  for (const period of months) {
    income.push(...(await incomeFor(ctx, svjId, period, profile)));
  }

  return [...income, ...(await expensesFor(ctx, svjId, range.from, range.to))];
};
