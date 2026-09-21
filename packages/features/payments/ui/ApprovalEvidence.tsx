import type { ReactElement } from 'react';
import { Stack } from '../../../shared/src/ui/layout/index';
import { Text } from '../../../shared/src/ui/typography/index';
import { proposeMatchSchema } from '../domain/proposal';
import { formatAmount } from './labels';

export interface ApprovalEvidenceProps {
  readonly input: unknown;
}

/**
 * How `payment.proposeMatch` shows itself in the approval inbox: the sentence the agent wrote and
 * the amount, rather than the tool call it was. An accountant is being asked about money, not
 * about a JSON payload (task 023).
 */
export const ApprovalEvidence = ({ input }: ApprovalEvidenceProps): ReactElement | null => {
  const parsed = proposeMatchSchema.safeParse(input);
  if (!parsed.success) return null;

  return (
    <Stack gap="sm">
      <Text size="xs" tone="subtle" variant="label">
        Návrh spárování na {formatAmount(parsed.data.amount)}
      </Text>
      <Text size="sm" tone="default">
        {parsed.data.reason}
      </Text>
    </Stack>
  );
};
