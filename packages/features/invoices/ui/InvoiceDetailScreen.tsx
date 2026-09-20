import Link from 'next/link';
import type { ReactElement } from 'react';
import { Alert, Card } from '../../../shared/src/ui/elements/index';
import { Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text, linkClassName } from '../../../shared/src/ui/typography/index';
import { AgentEvidence } from './AgentEvidence';
import { ChecksList } from './ChecksList';
import { InvoiceFacts } from './InvoiceFacts';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { checkResultsOf, reviewNoteOf, type InvoiceDetailView } from './wire';

export interface InvoiceDetailScreenProps {
  readonly detail: InvoiceDetailView;
  readonly approvalHref?: ((approvalId: string) => string) | undefined;
  readonly traceHref?: ((traceId: string) => string) | undefined;
}

/** The whole story of one invoice: what it says, what the rules found, what the agent proposed. */
export const InvoiceDetailScreen = ({
  detail,
  approvalHref,
  traceHref,
}: InvoiceDetailScreenProps): ReactElement => {
  const note = reviewNoteOf(detail.checks);

  return (
    <Stack gap="lg">
      <Stack gap="2xs">
        <Heading level={1}>{detail.invoice.externalNumber ?? 'Faktura bez čísla'}</Heading>
        <Text size="sm" tone="subtle">
          Přijato {new Date(detail.invoice.receivedAt).toLocaleDateString('cs-CZ')} ze zdroje{' '}
          {detail.invoice.source}
        </Text>
      </Stack>

      {note === null ? null : (
        <Alert tone="info" title="Faktura čeká na člověka">
          <Stack gap="2xs">
            <Text size="sm">{note.note}</Text>
            {note.missing.map((item) => (
              <Text key={item} size="sm">
                • {item}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

      <Card
        title="Faktura"
        description="Údaje tak, jak byly přečteny z dokumentu."
        actions={<InvoiceStatusBadge status={detail.invoice.status} />}
      >
        <Stack gap="md">
          <InvoiceFacts detail={detail} />
          {detail.downloadUrl === null ? null : (
            <Link href={detail.downloadUrl} className={linkClassName({ weight: 'medium' })}>
              Otevřít sken faktury
            </Link>
          )}
        </Stack>
      </Card>

      <Card title="Kontroly" description="Co platforma ověřila sama, bez agenta.">
        <ChecksList checks={checkResultsOf(detail.checks)} />
      </Card>

      <Card title="Návrh pro výbor" description="Co k faktuře napsal agent a co ho to stálo.">
        <AgentEvidence
          approval={detail.approval}
          agentRun={detail.agentRun}
          approvalHref={approvalHref}
          traceHref={traceHref}
        />
      </Card>
    </Stack>
  );
};
