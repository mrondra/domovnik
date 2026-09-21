import type { NavigationItem } from '../../../shared/src/ui/navigation';

/** Inside one SVJ: how that house stands with the accounting (task 025). */
export const navigation: readonly NavigationItem[] = [
  { href: 'accounting', label: 'Účetnictví', scope: 'svj', order: 50, roles: ['finance', 'manager'] },
];
