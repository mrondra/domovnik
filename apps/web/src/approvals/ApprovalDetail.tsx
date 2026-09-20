import type { ReactElement } from 'react';
import { Badge, Card } from '../../../../packages/shared/src/ui/elements/index';
import { Stack } from '../../../../packages/shared/src/ui/layout/index';
import { Text } from '../../../../packages/shared/src/ui/typography/index';
import type { ApprovalDetail as Detail } from '../api/approvals';
import { statusLabel, type DecisionInput } from './decision';
import { DecisionForm } from './DecisionForm.client';
import { Evidence } from './Evidence';
import { evidenceRenderers } from './evidence.generated';
import { toneOf } from './tone';

export interface ApprovalDetailProps {
  readonly approval: Detail;
  readonly onDecide: (input: DecisionInput) => Promise<string | null>;
}

/**
 * A feature may ship a reading of its own proposal (task 018). When it does, that is what the
 * person deciding sees; the raw input stays for everything else, because a rendering that quietly
 * leaves fields out would be worse than JSON.
 */
const proposal = (approval: Detail): ReactElement => {
  const Renderer = evidenceRenderers[approval.toolName];
  if (Renderer === undefined) return <Evidence label="Vstup akce" value={approval.input} />;

  const rendered = <Renderer input={approval.input} />;
  return rendered.props === null ? <Evidence label="Vstup akce" value={approval.input} /> : rendered;
};

const outcome = (approval: Detail): ReactElement => (
  <Text size="sm" tone="muted">
    {approval.comment === null ? 'Rozhodnuto bez komentáře.' : `Komentář: ${approval.comment}`}
  </Text>
);

export const ApprovalDetail = ({ approval, onDecide }: ApprovalDetailProps): ReactElement => (
  <Stack gap="lg">
    <Card
      title={approval.toolName}
      description="Akce s dopadem čeká na rozhodnutí oprávněné osoby."
      actions={<Badge tone={toneOf(approval.status)}>{statusLabel(approval.status)}</Badge>}
    >
      <Stack gap="md">
        {proposal(approval)}
        <Evidence label="Evidence" value={approval.evidence} />
      </Stack>
    </Card>

    <Card title="Rozhodnutí" description="Schválení spustí odloženou akci; zamítnutí ji zahodí.">
      {approval.status === 'pending' ? <DecisionForm onDecide={onDecide} /> : outcome(approval)}
    </Card>
  </Stack>
);
