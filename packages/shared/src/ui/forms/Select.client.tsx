'use client';

import type { ChangeEvent, ReactElement } from 'react';
import { cx } from '../cx';
import { Stack } from '../layout/index';
import { Text } from '../typography/index';
import { controlClassName } from './control';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SelectProps {
  readonly name: string;
  readonly label: string;
  /** `screen-reader` keeps the label for assistive technology where the context already says it. */
  readonly labelPlacement?: 'above' | 'screen-reader';
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
}

/**
 * A choice that is not part of a form — the SVJ switcher navigates on change. Fields bound to
 * react-hook-form live next door and read their value from the form context instead.
 */
export const Select = ({
  name,
  label,
  labelPlacement = 'above',
  value,
  options,
  onChange,
}: SelectProps): ReactElement => {
  const handle = (event: ChangeEvent<HTMLSelectElement>): void => {
    onChange(event.target.value);
  };

  return (
    <Stack gap="2xs">
      <label htmlFor={name} className={cx(labelPlacement === 'screen-reader' && 'sr-only')}>
        <Text as="span" size="sm" tone="default" weight="medium">
          {label}
        </Text>
      </label>
      <select id={name} value={value} onChange={handle} className={cx(controlClassName(), 'py-1.5')}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Stack>
  );
};
