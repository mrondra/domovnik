import type { ReactElement } from 'react';
import { Badge, type BadgeTone } from '../../../shared/src/ui/elements/index';
import type { InvoiceStatus } from '../domain/status';
import { INVOICE_STATUS_LABEL } from './labels';

const TONE: Readonly<Record<InvoiceStatus, BadgeTone>> = {
  received: 'neutral',
  extracted: 'neutral',
  needs_review: 'pending',
  pending_approval: 'pending',
  approved: 'positive',
  rejected: 'negative',
  posted: 'positive',
  paid: 'positive',
};

export interface InvoiceStatusBadgeProps {
  readonly status: InvoiceStatus;
}

export const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps): ReactElement => (
  <Badge tone={TONE[status]}>{INVOICE_STATUS_LABEL[status]}</Badge>
);
