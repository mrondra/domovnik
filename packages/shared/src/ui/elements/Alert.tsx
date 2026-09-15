import type { ReactElement, ReactNode } from 'react';
import { Stack } from '../layout/index';
import { Text } from '../typography/index';
import type { Tone } from '../tones';
import { cx } from '../cx';

export type AlertTone = 'info' | 'success' | 'danger';

const SURFACES: Readonly<Record<AlertTone, string>> = {
  info: 'border-slate-200 bg-slate-50',
  success: 'border-emerald-200 bg-emerald-50',
  danger: 'border-red-200 bg-red-50',
};

const TEXT: Readonly<Record<AlertTone, Tone>> = {
  info: 'default',
  success: 'success',
  danger: 'danger',
};

export interface AlertProps {
  readonly tone: AlertTone;
  readonly title?: string;
  readonly children?: ReactNode;
}

/**
 * Something the person has to read before going on. A failure is announced as it appears, so it is
 * an `alert`; a confirmation is a `status` and does not interrupt what a screen reader is saying.
 */
export const Alert = ({ tone, title, children }: AlertProps): ReactElement => (
  <div
    role={tone === 'danger' ? 'alert' : 'status'}
    className={cx('rounded-md border px-3 py-2.5', SURFACES[tone])}
  >
    <Stack gap="2xs">
      {title === undefined ? null : (
        <Text size="sm" weight="medium" tone={TEXT[tone]}>
          {title}
        </Text>
      )}
      {children}
    </Stack>
  </div>
);
