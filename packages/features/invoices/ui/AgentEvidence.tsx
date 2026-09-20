import Link from 'next/link';
import type { ReactElement } from 'react';
import { Badge, EmptyState } from '../../../shared/src/ui/elements/index';
import { Inline, Stack } from '../../../shared/src/ui/layout/index';
import { Text, linkClassName } from '../../../shared/src/ui/typography/index';
import { RECOMMENDATION_LABEL } from './labels';
import type { InvoiceDetailView } from './wire';

export interface AgentEvidenceProps {
  readonly approval: InvoiceDetailView['approval'];
  readonly agentRun: InvoiceDetailView['agentRun'];
  /** Where the approval lives in this application; the route prefix is not the feature's to know. */
  readonly approvalHref?: ((approvalId: string) => string) | undefined;
  /** Set only when the deployment has Langfuse; without it the trace id is still worth showing. */
  readonly traceHref?: ((traceId: string) => string) | undefined;
}

const TONE = { approve: 'positive', review: 'pending', reject: 'negative' } as const;

const cost = (run: NonNullable<InvoiceDetailView['agentRun']>): string =>
  `${run.model ?? 'neznámý model'} · ${String(run.inputTokens + run.outputTokens)} tokenů`;

/**
 * What the agent proposed and what it cost. It is shown as the sentence it wrote, not as the tool
 * call it was: a committee member decides about the invoice, not about a JSON payload (task 018).
 */
export const AgentEvidence = ({
  approval,
  agentRun,
  approvalHref,
  traceHref,
}: AgentEvidenceProps): ReactElement => {
  if (approval === null) {
    return <EmptyState title="K faktuře zatím není návrh pro výbor." />;
  }

  return (
    <Stack gap="md">
      <Inline gap="xs" align="center">
        <Badge tone={TONE[approval.recommendation]}>
          {RECOMMENDATION_LABEL[approval.recommendation] ?? approval.recommendation}
        </Badge>
        {approvalHref === undefined ? null : (
          <Link href={approvalHref(approval.id)} className={linkClassName({ weight: 'medium' })}>
            Otevřít schvalování
          </Link>
        )}
      </Inline>

      <Text size="sm">{approval.summary}</Text>

      {approval.risks.length === 0 ? null : (
        <Stack gap="2xs">
          <Text size="xs" tone="subtle" variant="label">
            Na co upozorňuje
          </Text>
          {approval.risks.map((risk) => (
            <Text key={risk} size="sm">
              • {risk}
            </Text>
          ))}
        </Stack>
      )}

      {agentRun === null ? null : (
        <Inline gap="xs" align="center">
          <Text size="xs" tone="subtle">
            {cost(agentRun)}
          </Text>
          {agentRun.traceId === null ? null : traceHref === undefined ? (
            <Text size="xs" tone="subtle">
              trace {agentRun.traceId}
            </Text>
          ) : (
            <Link href={traceHref(agentRun.traceId)} className={linkClassName({ size: 'xs' })}>
              Záznam běhu agenta
            </Link>
          )}
        </Inline>
      )}
    </Stack>
  );
};
