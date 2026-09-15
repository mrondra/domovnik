'use client';

import { useFormContext, type FieldValues } from 'react-hook-form';
import type { ReactElement, ReactNode } from 'react';
import { controlClassName } from './control';
import { FieldLayout } from './FieldLayout';
import { messageOf } from './field-error';

export interface TextareaFieldProps {
  readonly name: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly rows?: number;
  readonly hint?: ReactNode;
}

/** For prose the person writes: a reason, a comment. A single-line input would hide its own end. */
export const TextareaField = ({
  name,
  label,
  placeholder,
  rows = 3,
  hint,
}: TextareaFieldProps): ReactElement => {
  const { register, formState } = useFormContext<FieldValues>();
  const error = messageOf(formState.errors, name);

  return (
    <FieldLayout htmlFor={name} label={label} hint={hint} error={error}>
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error === undefined ? undefined : true}
        className={controlClassName(error === undefined ? 'default' : 'invalid')}
        {...register(name)}
      />
    </FieldLayout>
  );
};
