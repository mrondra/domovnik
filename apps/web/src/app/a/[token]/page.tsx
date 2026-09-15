import type { ReactElement } from 'react';
import { Container, Stack } from '../../../../../../packages/shared/src/ui/layout/index';
import { Heading } from '../../../../../../packages/shared/src/ui/typography/index';
import { SignedLinkScreen } from '../../../signed-link/SignedLinkScreen';

interface PageProps {
  readonly params: Promise<{ readonly token: string }>;
}

/** Outside the shell: the link authorises one decision, not the application (zadání kap. 2). */
const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { token } = await params;

  return (
    <Container as="main" size="md" gutter="lg" paddingY="2xl">
      <Stack gap="lg">
        <Heading level={1}>Domovník</Heading>
        <SignedLinkScreen token={token} />
      </Stack>
    </Container>
  );
};

export default Page;
