import type { NavigationItem, NavigationScope } from '../../../../packages/shared/src/ui/navigation';
import type { Session } from '../api/session';
import { featureNavigation } from './navigation.generated';

/**
 * What the kernel itself serves. Everything carrying a domain name — documents, inspections, tasks,
 * owners, finance — arrives as a feature's own `navigation` export (zadání kap. 3.1).
 */
const KERNEL_ITEMS: readonly NavigationItem[] = [
  { href: '', label: 'Přehled', scope: 'both', order: 0 },
  { href: 'approvals', label: 'Schvalování', scope: 'both', order: 10 },
  { href: 'settings/api-tokens', label: 'Nastavení', scope: 'tenant', order: 900 },
];

const inScope = (scope: NavigationScope, svjId: string | null): boolean =>
  scope === 'both' || (svjId === null ? scope === 'tenant' : scope === 'svj');

const allowedFor = (item: NavigationItem, roles: readonly string[]): boolean =>
  item.roles === undefined || item.roles.some((role) => roles.includes(role));

export const navigationFor = (session: Session, svjId: string | null): readonly NavigationItem[] =>
  [...KERNEL_ITEMS, ...featureNavigation]
    .filter((item) => inScope(item.scope, svjId) && allowedFor(item, session.roles))
    .sort((left, right) => left.order - right.order);

/** The prefix is the only difference between the cross-SVJ view and the view inside one SVJ. */
export const hrefOf = (item: NavigationItem, svjId: string | null): string => {
  const prefix = svjId === null ? '' : `/s/${svjId}`;
  if (item.href !== '') return `${prefix}/${item.href}`;
  return prefix === '' ? '/' : prefix;
};
