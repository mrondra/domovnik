import type { ReactElement } from 'react';
import { Badge, type BadgeTone } from '../../../shared/src/ui/elements/index';
import type { MatchStatus } from '../domain/types';
import { MATCH_STATUS_LABEL } from './labels';

const TONE: Readonly<Record<MatchStatus, BadgeTone>> = {
  unmatched: 'pending',
  matched: 'positive',
  proposed: 'pending',
  ignored: 'neutral',
};

export interface MatchStatusBadgeProps {
  readonly status: MatchStatus;
}

export const MatchStatusBadge = ({ status }: MatchStatusBadgeProps): ReactElement => (
  <Badge tone={TONE[status]}>{MATCH_STATUS_LABEL[status]}</Badge>
);
