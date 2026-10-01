import type { Specialization } from '../domain/specializations';

export const SPECIALIZATION_LABEL: Readonly<Record<Specialization, string>> = {
  revize_elektro: 'Revize elektro',
  revize_hromosvod: 'Revize hromosvodu',
  revize_plyn: 'Revize plynu',
  vytahy: 'Výtahy',
  hasici_pristroje: 'Hasicí přístroje',
  kominy: 'Kominictví',
  uklid: 'Úklid',
  instalater: 'Instalatér',
  elektrikar: 'Elektrikář',
  strechy: 'Střechy',
  zednik: 'Zedník',
  pojisteni: 'Pojištění',
  energie: 'Energie',
  ostatni: 'Ostatní',
};
