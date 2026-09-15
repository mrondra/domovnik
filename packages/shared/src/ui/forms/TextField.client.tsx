'use client';

import { useFormContext, type FieldValues } from 'react-hook-form';
import type { ReactElement, ReactNode } from 'react';
import { controlClassName } from './control';
import { FieldLayout } from './FieldLayout';
import { messageOf } from './field-error';

export type TextFieldType = 'text' | 'email' | 'password' | 'date';

export interface TextFieldProps {
  readonly name: string;
  readonly label: string;
  readonly type?: TextFieldType;
  readonly placeholder?: string;
  readonly autoComplete?: string;
  readonly hint?: ReactNode;
}

export const TextField = ({
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  hint,
}: TextFieldProps): ReactElement => {
  const { register, formState } = useFormContext<FieldValues>();
  const error = messageOf(formState.errors, name);

  return (
    <FieldLayout htmlFor={name} label={label} hint={hint} error={error}>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error === undefined ? undefined : true}
        className={controlClassName(error === undefined ? 'default' : 'invalid')}
        {...register(name)}
      />
    </FieldLayout>
  );
};
