import type { ReactElement, ReactNode } from 'react';
import { Stack } from '../layout/index';
import { Text } from '../typography/index';

export interface FieldLayoutProps {
  /** Ties the label to the control; the control carries the same value as its `id`. */
  readonly htmlFor: string;
  readonly label: string;
  readonly hint?: ReactNode;
  readonly error?: string | undefined;
  readonly children: ReactNode;
}

/** Label, control, hint, error — in that order, with the same rhythm in every form. */
export const FieldLayout = ({ htmlFor, label, hint, error, children }: FieldLayoutProps): ReactElement => (
  <Stack gap="2xs">
    <label htmlFor={htmlFor}>
      <Text as="span" size="sm" tone="default" weight="medium">
        {label}
      </Text>
    </label>
    {children}
    {hint === undefined ? null : (
      <Text size="xs" tone="subtle">
        {hint}
      </Text>
    )}
    {error === undefined ? null : (
      <Text size="xs" tone="danger">
        {error}
      </Text>
    )}
  </Stack>
);
