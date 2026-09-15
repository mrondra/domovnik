import type { ReactElement } from 'react';
import {
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../../../../packages/shared/src/ui/elements/index';
import { Text } from '../../../../packages/shared/src/ui/typography/index';
import type { TokenSummary } from '../api/api-tokens';
import { RevokeButton } from './RevokeButton.client';

export interface TokenTableProps {
  readonly tokens: readonly TokenSummary[];
  readonly onRevoke: (id: string) => Promise<string | null>;
}

const day = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' });

const used = (at: string | null): string => (at === null ? 'Zatím nepoužit' : day.format(new Date(at)));

export const TokenTable = ({ tokens, onRevoke }: TokenTableProps): ReactElement => {
  if (tokens.length === 0) return <EmptyState title="Žádné tokeny zatím nevznikly." />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Název</TableHeaderCell>
          <TableHeaderCell>Tooly</TableHeaderCell>
          <TableHeaderCell>Naposledy použit</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell align="end">Akce</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tokens.map((token) => (
          <TableRow key={token.id}>
            <TableCell>
              <Text as="span" size="sm" tone="default" weight="medium">
                {token.name}
              </Text>
            </TableCell>
            <TableCell>{token.allowedTools.length}</TableCell>
            <TableCell>{used(token.lastUsedAt)}</TableCell>
            <TableCell>
              {token.revokedAt === null ? (
                <Badge tone="positive">Aktivní</Badge>
              ) : (
                <Badge tone="neutral">Revokován</Badge>
              )}
            </TableCell>
            <TableCell align="end">
              {token.revokedAt === null ? (
                <RevokeButton tokenId={token.id} tokenName={token.name} onRevoke={onRevoke} />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
