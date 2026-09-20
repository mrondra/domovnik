import type { InvoiceStatus } from '../domain/status';
import type { BudgetCategory } from '../domain/types';

/** Czech is what a person reads; the codes stay English because the code is written in it. */
export const INVOICE_STATUS_LABEL: Readonly<Record<InvoiceStatus, string>> = {
  received: 'Přijatá',
  extracted: 'Přečtená',
  needs_review: 'K ověření',
  pending_approval: 'Čeká na schválení',
  approved: 'Schválená',
  rejected: 'Zamítnutá',
  posted: 'Zaúčtovaná',
  paid: 'Zaplacená',
};

export const BUDGET_CATEGORY_LABEL: Readonly<Record<BudgetCategory, string>> = {
  uklid: 'Úklid',
  vytah: 'Výtah',
  energie: 'Energie',
  opravy: 'Opravy',
  revize: 'Revize',
  sprava: 'Správa',
  pojisteni: 'Pojištění',
  ostatni: 'Ostatní',
};

export const CHECK_LABEL: Readonly<Record<string, string>> = {
  supplier_unknown: 'Neznámý dodavatel',
  contract_missing: 'Chybí smlouva',
  amount_deviates: 'Jiná částka než ve smlouvě',
  budget_exceeded: 'Překročený rozpočet',
  duplicate_number: 'Faktura už je založená',
  due_soon: 'Blíží se splatnost',
  vs_missing: 'Chybí variabilní symbol',
  pdf_no_text: 'Nečitelné PDF',
};

export const RECOMMENDATION_LABEL: Readonly<Record<string, string>> = {
  approve: 'Doporučuje schválit',
  review: 'Doporučuje prověřit',
  reject: 'Doporučuje zamítnout',
};

const CZK = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });
const DAY = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' });

export const formatAmount = (value: number | null, currency = 'CZK'): string => {
  if (value === null) return '—';
  return currency === 'CZK' ? CZK.format(value) : `${String(value)} ${currency}`;
};

export const formatDay = (value: string | null): string =>
  value === null ? '—' : DAY.format(new Date(`${value}T00:00:00.000Z`));

/** A code nobody has written a label for is still better shown than hidden. */
export const checkLabel = (code: string): string => CHECK_LABEL[code] ?? code;
