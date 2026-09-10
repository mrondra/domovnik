import { AsyncLocalStorage } from 'node:async_hooks';
import { pino, type DestinationStream, type Logger } from 'pino';
import { logLevel } from '../env/load';
import { REDACTION_CENSOR, redactionPaths } from './redaction';

export type LogBindings = Readonly<Record<string, string | number | undefined>>;

export const createRootLogger = (destination?: DestinationStream): Logger => {
  const options = {
    level: logLevel(),
    redact: { paths: [...redactionPaths], censor: REDACTION_CENSOR },
  };
  return destination === undefined ? pino(options) : pino(options, destination);
};

const rootLogger = createRootLogger();

const loggerStore = new AsyncLocalStorage<Logger>();

export const createLogger = (bindings: LogBindings = {}): Logger => rootLogger.child(bindings);

/** Runs `fn` with `logger` as the ambient logger, so nested code logs with the same bindings. */
export const withLogger = <T>(logger: Logger, fn: () => T): T => loggerStore.run(logger, fn);

export const logger = (): Logger => loggerStore.getStore() ?? rootLogger;

export type { Logger };
