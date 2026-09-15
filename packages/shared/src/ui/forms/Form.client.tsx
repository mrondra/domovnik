'use client';

import { FormProvider, type FieldValues, type SubmitHandler, type UseFormReturn } from 'react-hook-form';
import type { ReactElement, ReactNode, SyntheticEvent } from 'react';
import { Stack } from '../layout/index';
import type { Space } from '../space';

export interface FormProps<Values extends FieldValues> {
  /** Built by the caller with `useForm({ resolver: zodResolver(schema) })`. */
  readonly form: UseFormReturn<Values>;
  readonly onSubmit: SubmitHandler<Values>;
  readonly gap?: Space;
  readonly children: ReactNode;
}

/**
 * The form element, the context the fields read from, and the rhythm between them. Validation is
 * the caller's zod schema; what happens on submit is the caller's server action.
 */
export const Form = <Values extends FieldValues>({
  form,
  onSubmit,
  gap = 'md',
  children,
}: FormProps<Values>): ReactElement => {
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    void form.handleSubmit(onSubmit)(event);
  };

  return (
    <FormProvider<Values> {...form}>
      <form noValidate onSubmit={submit}>
        <Stack gap={gap}>{children}</Stack>
      </form>
    </FormProvider>
  );
};
