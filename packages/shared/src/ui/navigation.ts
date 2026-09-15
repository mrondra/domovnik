/**
 * Where an item belongs. The shell is entered either inside one SVJ (`/s/<svjId>/…`) or above them
 * all (`/…`); `both` is for a screen that exists in either, with the data narrowed accordingly.
 */
export type NavigationScope = 'svj' | 'tenant' | 'both';

export interface NavigationItem {
  /** Path without the scope prefix — `approvals`, `finance/invoices`. The shell adds the prefix. */
  readonly href: string;
  readonly label: string;
  readonly scope: NavigationScope;
  /** Roles allowed to see the item. Omitted means everyone who is signed in. */
  readonly roles?: readonly string[];
  /** Ascending; the shell sorts by it, so a feature can place itself without knowing the others. */
  readonly order: number;
}
