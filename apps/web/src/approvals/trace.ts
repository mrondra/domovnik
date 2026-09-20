import { webEnv } from '../env';

/**
 * Where an agent run can be read in full. Only a deployment with Langfuse has somewhere to point;
 * without it the trace id is still shown, because it is what an operator greps the logs for.
 */
export const traceHref = (): ((traceId: string) => string) | undefined => {
  const base = webEnv().LANGFUSE_BASE_URL;
  return base === undefined
    ? undefined
    : (traceId) => `${base.replace(/\/$/u, '')}/trace/${encodeURIComponent(traceId)}`;
};
