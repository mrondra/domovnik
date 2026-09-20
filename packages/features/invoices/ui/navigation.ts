import type { NavigationItem } from '../../../shared/src/ui/navigation';

/**
 * `both`, because the screen exists in either scope with different data: above the SVJ it is every
 * invoice the person may reach, inside one it is that SVJ's own. Across SVJ it is for the people
 * who work with money for the whole company; inside one, the committee sees its own (task 018).
 */
export const navigation: readonly NavigationItem[] = [
  { href: 'invoices', label: 'Faktury', scope: 'svj', order: 30 },
  { href: 'invoices', label: 'Faktury', scope: 'tenant', order: 30, roles: ['manager', 'finance'] },
];
