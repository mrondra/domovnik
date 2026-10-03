import type { TaskPriority } from '../../tasks/index';
import { checkLabel } from './checks';

export interface ReviewTaskFacts {
  readonly supplierName: string | null;
  readonly externalNumber: string | null;
  readonly reasons: readonly string[];
  readonly hasBlockingCheck: boolean;
}

export interface ReviewTaskContent {
  readonly title: string;
  readonly description: string;
  readonly priority: TaskPriority;
}

/**
 * `reasons` are check codes when a check blocked the invoice and one free sentence when something
 * else did; `checkLabel` hands a sentence back unchanged, so both read the same way.
 */
export const reviewTaskContent = (facts: ReviewTaskFacts): ReviewTaskContent => {
  const number = facts.externalNumber === null ? '' : ` ${facts.externalNumber}`;
  return {
    title: `Zkontrolovat fakturu ${facts.supplierName ?? 'neznámý'}${number}`,
    description: facts.reasons.map((reason) => `• ${checkLabel(reason)}`).join('\n'),
    priority: facts.hasBlockingCheck ? 'high' : 'normal',
  };
};
