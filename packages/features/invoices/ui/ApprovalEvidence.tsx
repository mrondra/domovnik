import type { ReactElement } from 'react';
import { Stack } from '../../../shared/src/ui/layout/index';
import { Text } from '../../../shared/src/ui/typography/index';
import { RECOMMENDATION_LABEL } from './labels';
import { proposalView } from './wire';

export interface ApprovalEvidenceProps {
  readonly input: unknown;
}

/**
 * How `invoice.approve` shows itself in the approval inbox. The generic renderer prints the tool's
 * input as JSON, which is honest but unreadable; a committee member is being asked about an
 * invoice, so they are shown the sentence the agent wrote about it (task 018).
 *
 * A payload that does not parse falls back to nothing, and the inbox keeps its raw rendering —
 * a half-rendered proposal would be worse than the JSON.
 */
export const ApprovalEvidence = ({ input }: ApprovalEvidenceProps): ReactElement | null => {
  const parsed = proposalView.omit({ id: true, status: true }).safeParse(input);
  if (!parsed.success) return null;

  const { summary, recommendation, risks } = parsed.data;

  return (
    <Stack gap="sm">
      <Text size="xs" tone="subtle" variant="label">
        {RECOMMENDATION_LABEL[recommendation] ?? recommendation}
      </Text>
      <Text size="sm" tone="default">
        {summary}
      </Text>
      {risks.map((risk) => (
        <Text key={risk} size="sm">
          • {risk}
        </Text>
      ))}
    </Stack>
  );
};
