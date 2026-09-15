'use client';

import { useFormContext, type FieldValues } from 'react-hook-form';
import type { ReactElement } from 'react';
import { Stack } from '../layout/index';
import { Text } from '../typography/index';
import { messageOf } from './field-error';

export interface CheckboxOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

export interface CheckboxGroupProps {
  readonly name: string;
  readonly legend: string;
  readonly options: readonly CheckboxOption[];
  /** What to say when there is nothing to choose from. */
  readonly empty: string;
}

const Option = ({
  name,
  option,
}: {
  readonly name: string;
  readonly option: CheckboxOption;
}): ReactElement => {
  const { register } = useFormContext<FieldValues>();

  return (
    <label className="flex gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50">
      <input
        type="checkbox"
        value={option.value}
        className="mt-1 size-4 accent-slate-900"
        {...register(name)}
      />
      <Stack gap="none">
        <Text as="span" size="sm" tone="default">
          {option.label}
        </Text>
        {option.description === undefined ? null : (
          <Text as="span" size="xs" tone="subtle">
            {option.description}
          </Text>
        )}
      </Stack>
    </label>
  );
};

/** A checklist bound to one array field — the shape react-hook-form gives same-named checkboxes. */
export const CheckboxGroup = ({ name, legend, options, empty }: CheckboxGroupProps): ReactElement => {
  const { formState } = useFormContext<FieldValues>();
  const error = messageOf(formState.errors, name);

  return (
    <Stack as="fieldset" gap="2xs">
      <Text as="legend" size="sm" tone="default" weight="medium">
        {legend}
      </Text>
      {options.length === 0 ? (
        <Text size="sm" tone="subtle">
          {empty}
        </Text>
      ) : (
        <Stack gap="none">
          {options.map((option) => (
            <Option key={option.value} name={name} option={option} />
          ))}
        </Stack>
      )}
      {error === undefined ? null : (
        <Text size="xs" tone="danger">
          {error}
        </Text>
      )}
    </Stack>
  );
};
