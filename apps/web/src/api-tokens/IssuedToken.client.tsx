'use client';

import type { ReactElement } from 'react';
import { Alert } from '../../../../packages/shared/src/ui/elements/index';
import { Stack } from '../../../../packages/shared/src/ui/layout/index';
import { Code, Text } from '../../../../packages/shared/src/ui/typography/index';

export interface IssuedTokenProps {
  readonly token: string | null;
}

/** Shown once, right after issuing: the API keeps only a hash of it (zadání kap. 9). */
export const IssuedToken = ({ token }: IssuedTokenProps): ReactElement | null =>
  token === null ? null : (
    <Alert tone="success" title="Token vytvořen. Zkopíruj si ho teď.">
      <Stack gap="2xs">
        <Code tone="success">{token}</Code>
        <Text size="xs" tone="success">
          Podruhé už se nezobrazí — ukládá se jen jeho otisk.
        </Text>
      </Stack>
    </Alert>
  );
