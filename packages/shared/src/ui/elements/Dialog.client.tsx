'use client';

import * as Radix from '@radix-ui/react-dialog';
import type { ReactElement, ReactNode } from 'react';
import { Stack } from '../layout/index';
import { Heading, Text } from '../typography/index';

export interface DialogProps {
  readonly trigger: ReactNode;
  readonly title: string;
  /** Radix announces this to screen readers; a dialog without it is an unlabelled dialog. */
  readonly description: string;
  readonly children: ReactNode;
}

const OVERLAY = 'fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]';

const CONTENT = [
  'fixed top-1/2 left-1/2 z-50 w-[min(32rem,calc(100vw-2rem))]',
  '-translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-6 shadow-lg',
].join(' ');

export const Dialog = ({ trigger, title, description, children }: DialogProps): ReactElement => (
  <Radix.Root>
    <Radix.Trigger asChild>{trigger}</Radix.Trigger>
    <Radix.Portal>
      <Radix.Overlay className={OVERLAY} />
      <Radix.Content className={CONTENT}>
        <Stack gap="md">
          <Stack gap="2xs">
            <Radix.Title asChild>
              <Heading level={2}>{title}</Heading>
            </Radix.Title>
            <Radix.Description asChild>
              <Text size="sm" tone="subtle">
                {description}
              </Text>
            </Radix.Description>
          </Stack>
          {children}
        </Stack>
      </Radix.Content>
    </Radix.Portal>
  </Radix.Root>
);

export const DialogClose = Radix.Close;
