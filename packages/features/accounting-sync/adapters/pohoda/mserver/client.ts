import type { RequestContext } from '../../../../../kernel/src/context/index';
import { AdapterError } from '../../../../../kernel/src/errors/index';
import { parseResponsePack, type PohodaResult } from '../xml/builders';

export interface MServerConfig {
  readonly url: string;
  readonly username: string;
  readonly password: string;
  readonly instance?: string | undefined;
}

const APPLICATION = 'Domovnik';

/**
 * The one call mServer takes: a `dataPack` posted as XML over Basic auth. Everything else about
 * talking to a real Pohoda is the shape of the document, which is `../xml/`'s business.
 *
 * TODO: unverified against a real installation (ADR 0005 names verification on POHODA Start as the
 * precondition, and it has not happened). The header names, the instance header and the encoding
 * of the response all follow the public documentation. Nothing in the test suite exercises this.
 */
export const postDataPack = async (
  _ctx: RequestContext,
  config: MServerConfig,
  xml: string,
): Promise<PohodaResult> => {
  const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');

  const response = await fetch(`${config.url.replace(/\/$/u, '')}/xml`, {
    method: 'POST',
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      authorization: `Basic ${credentials}`,
      'STW-Application': APPLICATION,
      ...(config.instance === undefined ? {} : { 'STW-Instance': config.instance }),
    },
    body: xml,
  });

  if (!response.ok) {
    throw new AdapterError(`mServer odpověděl ${String(response.status)}`, {
      code: 'pohoda_mserver_failed',
      retryable: response.status >= 500,
      details: { status: response.status },
    });
  }

  return parseResponsePack(await response.text());
};
