import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { DomainError, NotFoundError } from '../../../kernel/src/errors/index';
import { accountingAdapterFor } from '../adapters/index';
import { linkOf, linkSvj, requireLink } from '../service/index';
import { someSvj, startAccountingDb, withTestTenant, type TestDatabase } from './accounting.fixture';

let database: TestDatabase;
let ctx: RequestContext;

beforeAll(async () => {
  database = await startAccountingDb();
  ctx = (await withTestTenant()).ctx;
}, 300_000);

afterAll(async () => {
  await database.stop();
});

describe('which accounting unit an SVJ is', () => {
  it('is one link per house, however many times it is set', async () => {
    const svjId = someSvj();

    await linkSvj(ctx, { svjId, companyIco: '26512345' });
    await linkSvj(ctx, { svjId, companyIco: '26599999' });

    await expect(linkOf(ctx, svjId)).resolves.toMatchObject({
      companyIco: '26599999',
      accountingAdapter: 'mock',
      receivablesAdapter: 'internal',
    });
  });

  it('is nothing at all until somebody says so', async () => {
    const svjId = someSvj();

    await expect(linkOf(ctx, svjId)).resolves.toBeNull();
    await expect(requireLink(ctx, svjId)).rejects.toThrow(NotFoundError);
  });
});

describe('who serves an SVJ', () => {
  it('is the demo Pohoda when that is what the link says', async () => {
    const svjId = someSvj();
    await linkSvj(ctx, { svjId, companyIco: '26512345' });

    await expect(accountingAdapterFor(ctx, svjId)).resolves.toMatchObject({ kind: 'mock' });
  });

  it('is refused through mServer, which nobody has verified against a real Pohoda', async () => {
    const svjId = someSvj();
    await linkSvj(ctx, { svjId, companyIco: '26512345', accountingAdapter: 'mserver' });

    await expect(accountingAdapterFor(ctx, svjId)).rejects.toThrow(DomainError);
  });

  it('is refused for a house nobody linked', async () => {
    await expect(accountingAdapterFor(ctx, someSvj())).rejects.toThrow(NotFoundError);
  });
});
