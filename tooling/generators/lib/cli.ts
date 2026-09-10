/** A failure the user can act on: printed as one line, without a stack trace. */
export class GeneratorError extends Error {}

export interface ParsedArgs {
  readonly positionals: readonly string[];
  readonly flags: ReadonlySet<string>;
}

export const parseArgs = (argv: readonly string[]): ParsedArgs => ({
  positionals: argv.filter((argument) => !argument.startsWith('--')),
  flags: new Set(argv.filter((argument) => argument.startsWith('--')).map((flag) => flag.slice(2))),
});

export const report = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

export const reportCreated = (paths: readonly string[]): void => {
  report(paths.map((path) => `  + ${path}`).join('\n'));
};

export const run = (main: () => Promise<void>): void => {
  main().catch((cause: unknown) => {
    const message = cause instanceof Error ? cause.message : String(cause);
    process.stderr.write(`${message}\n`);
    if (!(cause instanceof GeneratorError)) process.stderr.write(`${String(cause)}\n`);
    process.exitCode = 1;
  });
};
