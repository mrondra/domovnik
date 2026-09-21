import type { NavigationItem } from '../../../shared/src/ui/navigation';

/** Prescriptions and balances are about one house; there is no cross-SVJ view of them. */
export const navigation: readonly NavigationItem[] = [
  { href: 'receivables', label: 'Předpisy a saldo', scope: 'svj', order: 35 },
];
