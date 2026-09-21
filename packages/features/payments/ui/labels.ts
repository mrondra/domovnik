import type { MatchMethod, MatchStatus } from '../domain/types';

export const MATCH_STATUS_LABEL: Readonly<Record<MatchStatus, string>> = {
  unmatched: 'Nespárováno',
  matched: 'Spárováno',
  proposed: 'Čeká na schválení',
  ignored: 'Nepárovat',
};

export const MATCH_METHOD_LABEL: Readonly<Record<MatchMethod, string>> = {
  vs_amount: 'Podle symbolu a částky',
  vs_only: 'Podle symbolu',
  agent: 'Podle návrhu agenta',
  manual: 'Ručně',
};

export const BECAUSE_LABEL: Readonly<Record<string, string>> = {
  symbol_typo: 'Symbol na jeden překlep',
  balance_matches: 'Saldo jednotky sedí',
  two_months: 'Dva nebo tři měsíce dohromady',
  invoice_amount: 'Částka sedí na fakturu',
};

const CZK = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });
const DAY = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' });

export const formatAmount = (value: number): string => CZK.format(value);

export const formatDay = (value: string | null | undefined): string =>
  value === null || value === undefined ? '—' : DAY.format(new Date(`${value}T00:00:00.000Z`));

export const directionOf = (amount: number): string => (amount > 0 ? 'Příjem' : 'Výdaj');
