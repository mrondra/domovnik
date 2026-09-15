import type { ReactElement } from 'react';
import { Card } from '../../../../packages/shared/src/ui/elements/index';
import { Stack } from '../../../../packages/shared/src/ui/layout/index';
import { Heading } from '../../../../packages/shared/src/ui/typography/index';
import { issueToken, revokeToken } from '../actions/api-tokens';
import { listApiTokens, listAvailableTools } from '../api/api-tokens';
import { TokenForm } from './TokenForm.client';
import { TokenTable } from './TokenTable';

export const SettingsScreen = async (): Promise<ReactElement> => {
  const [tokens, tools] = await Promise.all([listApiTokens(), listAvailableTools()]);

  return (
    <Stack gap="lg">
      <Heading level={1}>API a MCP přístup</Heading>
      <Card title="Nový token" description="Token nikdy neumí víc než ty — výběr toolů ho jen zužuje.">
        <TokenForm tools={tools} onIssue={issueToken} />
      </Card>
      <Card
        title="Vydané tokeny"
        description="Včetně revokovaných, aby bylo vidět, co kdy platilo."
        body="flush"
      >
        <TokenTable tokens={tokens} onRevoke={revokeToken} />
      </Card>
    </Stack>
  );
};
