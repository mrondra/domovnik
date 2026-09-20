import type { NavigationItem } from '../../../shared/src/ui/navigation';

/** Only above the SVJ, and only for the person doing the showing (task 019). */
export const navigation: readonly NavigationItem[] = [
  { href: 'demo', label: 'Demo', scope: 'tenant', order: 800, roles: ['tenant_admin'] },
];
