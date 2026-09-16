import type { NavigationItem } from '../../../shared/src/ui/navigation';

/**
 * `both`, because the screen exists in either scope with different data: above the SVJ it is the
 * overview across them, inside one it is that SVJ's own record (task 007 §5).
 */
export const navigation: readonly NavigationItem[] = [
  { href: 'svj', label: 'SVJ', scope: 'both', order: 20 },
];
