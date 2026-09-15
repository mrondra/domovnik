'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button } from '../../../../packages/shared/src/ui/elements/index';
import { Form, TextField } from '../../../../packages/shared/src/ui/forms/index';
import { credentialsSchema, type Credentials } from './credentials';

export interface LoginFormProps {
  readonly onSignIn: (credentials: Credentials) => Promise<string | null>;
}

export const LoginForm = ({ onSignIn }: LoginFormProps): ReactElement => {
  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (credentials: Credentials): void => {
    startTransition(async () => {
      setError(await onSignIn(credentials));
    });
  };

  return (
    <Form form={form} onSubmit={submit}>
      <TextField name="email" label="E-mail" type="email" autoComplete="username" />
      <TextField name="password" label="Heslo" type="password" autoComplete="current-password" />
      {error === null ? null : <Alert tone="danger" title={error} />}
      <Button type="submit" variant="primary" width="full" disabled={pending}>
        Přihlásit
      </Button>
    </Form>
  );
};
