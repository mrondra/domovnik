import type { NavigationItem } from '../../../shared/src/ui/navigation';

/** Tenant-wide only: the address book belongs to the management company, not to one SVJ. */
export const navigation: readonly NavigationItem[] = [
  { href: 'suppliers', label: 'Dodavatelé', scope: 'tenant', order: 60, roles: ['manager', 'finance'] },
];
