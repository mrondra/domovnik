import type { NavigationItem } from '../../../shared/src/ui/navigation';

/** Inside one SVJ: its own account. Above them, money is looked at per house (task 023). */
export const navigation: readonly NavigationItem[] = [
  { href: 'payments', label: 'Platby', scope: 'svj', order: 40 },
];
