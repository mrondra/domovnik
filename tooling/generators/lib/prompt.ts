import { createInterface } from 'node:readline/promises';
import { GeneratorError } from './cli';

export interface ConfirmInput {
  readonly question: string;
  /** Set by a `--yes`-style flag, and by the tests, which have no terminal to answer from. */
  readonly preapproved: boolean;
  /** Named in the error when there is nobody to ask. */
  readonly flag: string;
}

export const confirm = async (input: ConfirmInput): Promise<boolean> => {
  if (input.preapproved) return true;
  if (!process.stdin.isTTY) {
    throw new GeneratorError(
      `${input.question} Bez terminálu se nelze zeptat – spusť znovu s ${input.flag}.`,
    );
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${input.question} [a/N] `);
    return ['a', 'ano', 'y', 'yes'].includes(answer.trim().toLowerCase());
  } finally {
    rl.close();
  }
};
