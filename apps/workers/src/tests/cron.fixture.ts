import { DomainError } from '../../../../packages/kernel/src/errors/index';
import type { CronQueue } from '../runtime/scheduler';

export interface RecordingCronQueue extends CronQueue {
  readonly crons: Map<string, string>;
  /** Runs what the scheduler registered for that cron, without waiting for a clock. */
  fire(name: string): Promise<void>;
}

export const recordingCronQueue = (): RecordingCronQueue => {
  const crons = new Map<string, string>();
  const jobs = new Map<string, (jobs: readonly unknown[]) => Promise<unknown>>();

  return {
    crons,
    createQueue: () => Promise.resolve(),
    schedule: (name, cron) => {
      crons.set(name, cron);
      return Promise.resolve();
    },
    work: (name, _options, handler) => {
      jobs.set(name, handler);
      return Promise.resolve(`worker-${name}`);
    },
    fire: async (name) => {
      const job = jobs.get(name);
      if (job === undefined) {
        throw new DomainError(`Pro ${name} není registrovaná úloha`, { code: 'cron_job_missing' });
      }
      await job([{}]);
    },
  };
};
