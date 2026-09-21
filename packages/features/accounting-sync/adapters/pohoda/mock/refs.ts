import { createHash } from 'node:crypto';
import { dataPack } from '../xml/builders';

const REF_LENGTH = 12;

/** Pohoda's own id, stood in for by something as stable as Pohoda's would be. */
export const refFor = (kind: string, key: string): string =>
  `${kind.toUpperCase()}-${createHash('sha256').update(key).digest('hex').slice(0, REF_LENGTH)}`;

/** The envelope the real adapter would post, built here too so both sides keep the same documents. */
export const packFor = (input: {
  readonly ico: string;
  readonly note: string;
  readonly id: string;
  readonly body: string;
}): string =>
  dataPack({
    id: input.id,
    ico: input.ico,
    note: input.note,
    items: [{ id: input.id, body: input.body }],
  });
