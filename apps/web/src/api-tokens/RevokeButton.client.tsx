'use client';

import { useTransition, type ReactElement } from 'react';
import { Button, Dialog, DialogClose } from '../../../../packages/shared/src/ui/elements/index';
import { Inline } from '../../../../packages/shared/src/ui/layout/index';

export interface RevokeButtonProps {
  readonly tokenId: string;
  readonly tokenName: string;
  readonly onRevoke: (id: string) => Promise<string | null>;
}

/** Revoking cannot be undone, so it is asked for twice. */
export const RevokeButton = ({ tokenId, tokenName, onRevoke }: RevokeButtonProps): ReactElement => {
  const [pending, startTransition] = useTransition();

  const revoke = (): void => {
    startTransition(async () => {
      await onRevoke(tokenId);
    });
  };

  return (
    <Dialog
      trigger={
        <Button variant="ghost" disabled={pending}>
          Revokovat
        </Button>
      }
      title={`Revokovat token ${tokenName}?`}
      description="Token okamžitě přestane platit. Klient, který ho používá, dostane 401."
    >
      <Inline gap="sm" justify="end">
        <DialogClose asChild>
          <Button>Zpět</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="danger" onClick={revoke}>
            Revokovat
          </Button>
        </DialogClose>
      </Inline>
    </Dialog>
  );
};
