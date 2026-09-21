import type { ReactElement } from 'react';
import { Card, EmptyState } from '../../../shared/src/ui/elements/index';
import { Grid, Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text } from '../../../shared/src/ui/typography/index';
import { ManualMatch } from './ManualMatch.client';
import { MatchStatusBadge } from './MatchStatusBadge';
import { BECAUSE_LABEL, MATCH_METHOD_LABEL, directionOf, formatAmount, formatDay } from './labels';
import type { CandidateView, TransactionDetailView } from './wire';

export interface TransactionDetailScreenProps {
  readonly detail: TransactionDetailView;
  /** Omitted for somebody who may read the statement but not decide about it (zadání kap. 9). */
  readonly onMatch?: ((candidate: CandidateView) => Promise<string | null>) | undefined;
}

interface FactProps {
  readonly label: string;
  readonly value: string;
}

const Fact = ({ label, value }: FactProps): ReactElement => (
  <Stack gap="2xs">
    <Text size="xs" tone="subtle" variant="label">
      {label}
    </Text>
    <Text size="sm" tone="default">
      {value}
    </Text>
  </Stack>
);

export const TransactionDetailScreen = ({ detail, onMatch }: TransactionDetailScreenProps): ReactElement => {
  const { transaction, match, proposal, candidates } = detail;

  return (
    <Stack gap="lg">
      <Stack gap="2xs">
        <Heading level={1}>{formatAmount(transaction.amount)}</Heading>
        <Text size="sm" tone="subtle">
          {directionOf(transaction.amount)} z {formatDay(transaction.bookedOn)}
        </Text>
      </Stack>

      <Card
        title="Pohyb"
        description="Tak, jak ho nahlásila banka."
        actions={<MatchStatusBadge status={transaction.matchStatus} />}
      >
        <Grid columns={3} gap="md">
          <Fact label="Protistrana" value={transaction.counterpartyName ?? '—'} />
          <Fact label="Účet protistrany" value={transaction.counterpartyAccount ?? '—'} />
          <Fact label="Variabilní symbol" value={transaction.variableSymbol ?? '—'} />
          <Fact label="Zpráva" value={transaction.message ?? '—'} />
          <Fact label="Označení v bance" value={transaction.externalId} />
        </Grid>
      </Card>

      {match === null ? null : (
        <Card title="Spárováno" description="Čeho se pohyb týká.">
          <Grid columns={3} gap="md">
            <Fact label="Způsob" value={MATCH_METHOD_LABEL[match.method]} />
            <Fact label="Částka" value={formatAmount(match.amount)} />
            <Fact label="Jistota" value={`${String(Math.round(match.confidence * 100))} %`} />
          </Grid>
        </Card>
      )}

      {proposal === null ? null : (
        <Card title="Návrh agenta" description="Čeká na rozhodnutí financí.">
          <Text size="sm">{proposal.reason}</Text>
        </Card>
      )}

      <Card title="Čeho se může týkat" description="Možnosti spočítané z předpisů a faktur.">
        {candidates.length === 0 ? (
          <EmptyState title="Kód k tomuto pohybu nic nenašel." />
        ) : onMatch === undefined ? (
          <Stack gap="sm">
            {candidates.map((one) => (
              <Text key={`${one.because}-${one.targetId}`} size="sm">
                {one.label} — {BECAUSE_LABEL[one.because] ?? one.because}
              </Text>
            ))}
          </Stack>
        ) : (
          <ManualMatch candidates={candidates} onMatch={onMatch} />
        )}
      </Card>
    </Stack>
  );
};
