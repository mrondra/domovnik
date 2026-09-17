import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ForbiddenError, NotFoundError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { documentIdSchema } from '../domain/ids';
import { documentDownloadUrl, findBySha256, getDocument, listDocuments } from '../service/index';
import {
  auditActions,
  scopedTo,
  someSvj,
  startDocumentsWorld,
  storeSample,
  withTestTenant,
  type TestTenant,
  type TestWorld,
} from './documents.fixture';

let world: TestWorld;
let tenant: TestTenant;
let svjA: SvjId;
let svjB: SvjId;

beforeAll(async () => {
  world = await startDocumentsWorld();
  tenant = await withTestTenant();
  svjA = someSvj();
  svjB = someSvj();
}, 300_000);

afterAll(async () => {
  await world.stop();
});

describe('storeDocument', () => {
  it('files the bytes and answers metadata that reads back', async () => {
    const stored = await storeSample(tenant.ctx, svjA, { title: 'Smlouva o úklidu' });

    expect(stored.size).toBeGreaterThan(0);
    expect(stored.storageKey).toContain(`tenants/${tenant.tenantId}/documents/`);
    await expect(getDocument(tenant.ctx, stored.id)).resolves.toMatchObject({
      title: 'Smlouva o úklidu',
      category: 'invoice',
      contentType: 'application/pdf',
      source: 'email',
      sha256: stored.sha256,
    });
  });

  it('serves the stored file over the download link', async () => {
    const stored = await storeSample(tenant.ctx, svjA, { body: 'obsah ke stažení' });

    const link = await documentDownloadUrl(tenant.ctx, stored.id);
    expect(link.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const response = await fetch(link.url);
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('obsah ke stažení');
  });

  it('writes an audit row for every stored document', async () => {
    const stored = await storeSample(tenant.ctx, svjA);

    await expect(auditActions(tenant.ctx, stored.id)).resolves.toStrictEqual(['document.store']);
  });

  it('refuses an SVJ outside the scope of the credential', async () => {
    await expect(storeSample(scopedTo(tenant.ctx, [svjB]), svjA)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('findBySha256', () => {
  it('recognises the same content stored under another name', async () => {
    const first = await storeSample(tenant.ctx, svjB, { body: 'dvakrát poslaná faktura' });
    const again = await storeSample(tenant.ctx, svjB, {
      title: 'Faktura znovu',
      body: 'dvakrát poslaná faktura',
    });

    expect(again.sha256).toBe(first.sha256);
    await expect(findBySha256(tenant.ctx, { svjId: svjB, sha256: first.sha256 })).resolves.toMatchObject({
      sha256: first.sha256,
    });
  });

  it('answers null for content nobody filed', async () => {
    await expect(findBySha256(tenant.ctx, { svjId: svjB, sha256: '0'.repeat(64) })).resolves.toBeNull();
  });
});

describe('reading documents', () => {
  it('lists one SVJ, newest first, and narrows by category', async () => {
    const svjId = someSvj();
    await storeSample(tenant.ctx, svjId, { title: 'Starší' });
    await storeSample(tenant.ctx, svjId, { title: 'Novější' });

    await expect(listDocuments(tenant.ctx, { svjId })).resolves.toHaveLength(2);
    await expect(listDocuments(tenant.ctx, { svjId, category: 'minutes' })).resolves.toStrictEqual([]);
  });

  it('hides a document of an SVJ outside the scope of the credential', async () => {
    const stored = await storeSample(tenant.ctx, svjA);
    const scoped = scopedTo(tenant.ctx, [svjB]);

    await expect(getDocument(scoped, stored.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(listDocuments(scoped, { svjId: svjA })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('answers NotFound for a document that does not exist', async () => {
    await expect(getDocument(tenant.ctx, documentIdSchema.parse(crypto.randomUUID()))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
