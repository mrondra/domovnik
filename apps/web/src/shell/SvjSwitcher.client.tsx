'use client';

import { useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import { Select } from '../../../../packages/shared/src/ui/forms/index';
import { Text } from '../../../../packages/shared/src/ui/typography/index';
import type { SvjOption } from '../api/svj';

const ACROSS = 'across';

export interface SvjSwitcherProps {
  readonly options: readonly SvjOption[];
  readonly svjId: string | null;
  /** Only `manager` and `tenant_admin` may look across every SVJ at once (task 006 §3). */
  readonly canViewAcross: boolean;
}

/**
 * Switching goes to the chosen scope's overview rather than to the same sub-path: not every screen
 * exists in both views, and landing on a 404 is a worse answer than landing on the overview.
 */
export const SvjSwitcher = ({ options, svjId, canViewAcross }: SvjSwitcherProps): ReactElement => {
  const router = useRouter();

  const choices = [
    ...(canViewAcross ? [{ value: ACROSS, label: 'Všechna SVJ' }] : []),
    ...options.map((option) => ({ value: option.id, label: option.name })),
  ];

  /** An empty picker is a control that lies about having a choice. */
  if (choices.length === 0) {
    return (
      <Text size="sm" tone="subtle">
        Zatím žádné SVJ
      </Text>
    );
  }

  return (
    <Select
      name="svj"
      label="Vybrané SVJ"
      labelPlacement="screen-reader"
      value={svjId ?? ACROSS}
      options={choices}
      onChange={(value) => {
        router.push(value === ACROSS ? '/' : `/s/${value}`);
      }}
    />
  );
};
