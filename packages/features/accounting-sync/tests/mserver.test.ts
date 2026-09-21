import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContext } from '../../../kernel/src/context/index';
import { AdapterError } from '../../../kernel/src/errors/index';
import { tenantIdSchema } from '../../../kernel/src/ids/index';
import { postDataPack } from '../adapters/pohoda/mserver/client';

const ctx = createContext({
  tenantId: tenantIdSchema.parse('22222222-2222-4222-8222-222222222222'),
  actor: { type: 'system', id: null, roles: [] },
});

const config = { url: 'https://ucetni.example.test/', username: 'domovnik', password: 'tajne' };

const OK = '<rsp:responsePack state="ok" xmlns:rsp="x"><rsp:responsePackItem state="ok"/></rsp:responsePack>';

const answering = (body: string, status = 200): ReturnType<typeof vi.fn> => {
  const fetching = vi.fn(() => Promise.resolve(new Response(body, { status })));
  vi.stubGlobal('fetch', fetching);
  return fetching;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * How the request is shaped, and nothing about whether a real Pohoda accepts it — that is the
 * verification on POHODA Start which ADR 0005 names as the precondition and which has not happened.
 */
describe('posting a dataPack to mServer', () => {
  it('goes to the XML endpoint of the configured server, however the url was written', async () => {
    const fetching = answering(OK);

    await postDataPack(ctx, config, '<dat:dataPack/>');

    expect(fetching).toHaveBeenCalledWith('https://ucetni.example.test/xml', expect.anything());
  });

  it('identifies itself and carries the credentials of the installation', async () => {
    const fetching = answering(OK);

    await postDataPack(ctx, { ...config, instance: 'SVJ1' }, '<dat:dataPack/>');

    expect(fetching.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from('domovnik:tajne').toString('base64')}`,
        'STW-Application': 'Domovnik',
        'STW-Instance': 'SVJ1',
      },
    });
  });

  it('reads the answer as an answer', async () => {
    answering(OK);

    await expect(postDataPack(ctx, config, '<dat:dataPack/>')).resolves.toMatchObject({ ok: true });
  });

  it('says a server that is having a bad day is worth trying again', async () => {
    answering('', 503);

    await expect(postDataPack(ctx, config, '<dat:dataPack/>')).rejects.toMatchObject({
      code: 'pohoda_mserver_failed',
      retryable: true,
    });
  });

  it('says a refused request is not', async () => {
    answering('', 401);

    const failure = await postDataPack(ctx, config, '<dat:dataPack/>').catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(AdapterError);
    expect(failure).toMatchObject({ retryable: false });
  });
});
