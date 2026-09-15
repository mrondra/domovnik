'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button } from '../../../../packages/shared/src/ui/elements/index';
import { CheckboxGroup, Form, TextField } from '../../../../packages/shared/src/ui/forms/index';
import { Inline } from '../../../../packages/shared/src/ui/layout/index';
import type { AvailableTool } from '../api/api-tokens';
import { IssuedToken } from './IssuedToken.client';
import { newTokenSchema, type IssueResult, type NewTokenInput } from './form-schema';

export interface TokenFormProps {
  readonly tools: readonly AvailableTool[];
  readonly onIssue: (input: NewTokenInput) => Promise<IssueResult>;
}

export const TokenForm = ({ tools, onIssue }: TokenFormProps): ReactElement => {
  const form = useForm<NewTokenInput>({
    resolver: zodResolver(newTokenSchema),
    defaultValues: { name: '', allowedTools: [], expiresAt: '' },
  });
  const [issued, setIssued] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (values: NewTokenInput): void => {
    startTransition(async () => {
      const result = await onIssue(values);
      setError(result.ok ? null : result.message);
      if (result.ok) {
        setIssued(result.token);
        form.reset();
      }
    });
  };

  return (
    <Form form={form} onSubmit={submit}>
      <TextField name="name" label="Název tokenu" placeholder="Např. Claude Desktop" />
      <TextField name="expiresAt" label="Platnost do" type="date" hint="Prázdné = bez expirace." />
      <CheckboxGroup
        name="allowedTools"
        legend="Povolené tooly"
        empty="Zatím nejsou k dispozici žádné tooly."
        options={tools.map((tool) => ({
          value: tool.name,
          label: tool.name,
          description: tool.description,
        }))}
      />
      {error === null ? null : <Alert tone="danger" title={error} />}
      <IssuedToken token={issued} />
      <Inline>
        <Button type="submit" variant="primary" disabled={pending}>
          Vytvořit token
        </Button>
      </Inline>
    </Form>
  );
};
