'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button } from '../../../../packages/shared/src/ui/elements/index';
import { Form, TextareaField } from '../../../../packages/shared/src/ui/forms/index';
import { Inline } from '../../../../packages/shared/src/ui/layout/index';
import { decisionSchema, type DecisionInput } from './decision';

export interface DecisionFormProps {
  /** A server action, handed down from the page: the inbox decides, the e-mail link decides too. */
  readonly onDecide: (input: DecisionInput) => Promise<string | null>;
}

export const DecisionForm = ({ onDecide }: DecisionFormProps): ReactElement => {
  const form = useForm<DecisionInput>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { decision: 'approved', comment: '' },
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (values: DecisionInput): void => {
    startTransition(async () => {
      setError(await onDecide(values));
    });
  };

  const decide = (decision: DecisionInput['decision']) => (): void => {
    form.setValue('decision', decision);
    void form.handleSubmit(submit)();
  };

  return (
    <Form form={form} onSubmit={submit}>
      <TextareaField name="comment" label="Komentář" placeholder="Nepovinné zdůvodnění" />
      {error === null ? null : <Alert tone="danger" title={error} />}
      <Inline gap="sm">
        <Button variant="primary" disabled={pending} onClick={decide('approved')}>
          Schválit
        </Button>
        <Button variant="danger" disabled={pending} onClick={decide('rejected')}>
          Zamítnout
        </Button>
      </Inline>
    </Form>
  );
};
