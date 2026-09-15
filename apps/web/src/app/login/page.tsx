import { redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { Card } from '../../../../../packages/shared/src/ui/elements/index';
import { Center, Container, Stack } from '../../../../../packages/shared/src/ui/layout/index';
import { Heading } from '../../../../../packages/shared/src/ui/typography/index';
import { signIn } from '../../actions/auth';
import { getSession } from '../../api/session';
import { LoginForm } from '../../auth/LoginForm.client';

const Page = async (): Promise<ReactElement> => {
  if ((await getSession()) !== null) redirect('/');

  return (
    <Center minHeight="screen">
      <Container as="main" size="sm" gutter="lg">
        <Stack gap="lg" align="stretch">
          <Stack gap="none" align="center">
            <Heading level={1}>Domovník</Heading>
          </Stack>
          <Card title="Přihlášení" description="Zadej e-mail a heslo, které ti dala správcovská firma.">
            <LoginForm onSignIn={signIn} />
          </Card>
        </Stack>
      </Container>
    </Center>
  );
};

export default Page;
