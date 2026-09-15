import type { ReactElement } from 'react';
import { Inline } from '../../../../packages/shared/src/ui/layout/index';
import type { ApprovalStatus } from '../api/approvals';
import { AppLink } from '../ui/AppLink';
import { statusLabel } from './decision';

const ORDER: readonly ApprovalStatus[] = ['pending', 'approved', 'rejected', 'expired'];

export interface StatusTabsProps {
  readonly basePath: string;
  readonly active: ApprovalStatus;
}

export const StatusTabs = ({ basePath, active }: StatusTabsProps): ReactElement => (
  <Inline gap="sm">
    {ORDER.map((status) => (
      <AppLink
        key={status}
        href={`${basePath}?status=${status}`}
        size="xs"
        tone={status === active ? 'default' : 'subtle'}
        weight={status === active ? 'medium' : 'regular'}
      >
        {statusLabel(status)}
      </AppLink>
    ))}
  </Inline>
);
