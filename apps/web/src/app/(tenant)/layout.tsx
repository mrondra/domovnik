import type { ReactElement, ReactNode } from 'react';
import { AppShell } from '../../shell/AppShell';

/** The view above every SVJ. The SVJ-scoped one is `app/s/[svjId]/layout.tsx`. */
const TenantLayout = ({ children }: { readonly children: ReactNode }): ReactElement => (
  <AppShell svjId={null}>{children}</AppShell>
);

export default TenantLayout;
