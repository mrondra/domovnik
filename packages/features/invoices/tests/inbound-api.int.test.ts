import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  addPerson,
  bodyOf,
  signIn,
  startApi,
  type ApiHarness,
} from '../../../../apps/api/src/tests/api.fixture';
import { startTestStorage, type TestStorage } from '../../../kernel/src/testing/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { INVOICE_LINES, sampleInvoicePdf } from './fixtures/sample-invoice.fixture';
import { someSvj } from './invoices.fixture';
import { TEST_SCHEMA } from './world.fixture';

const CREATED = 201;
const inboundSchema = z.object({ invoiceId: z.uuid(), duplicateOf: z.uuid().optional() });

let api: ApiHarness;
let storage: TestStorage;
let svjId: SvjId;
let pdf: Buffer;
let accountant: string;
let chair: string;

beforeAll(async () => {
  api = await startApi(TEST_SCHEMA);
  storage = await startTestStorage();
  svjId = someSvj();
  pdf = await sampleInvoicePdf(INVOICE_LINES);

  accountant = await signIn(api, await addPerson(api.tenant.tenantId, 'ucetni@example.test', ['finance']));
  chair = await signIn(api, await addPerson(api.tenant.tenantId, 'vybor@example.test', ['committee'], svjId));
}, 300_000);

afterAll(async () => {
  await storage.stop();
  await api.stop();
});

const post = (cookie: string, attachment?: { name: string; body: Buffer; type: string }) => {
  const request = api
    .http()
    .post(`/svj/${svjId}/invoices/inbound`)
    .set('cookie', cookie)
    .field('from', 'fakturace@vytahy-praha.test')
    .field('subject', 'Faktura 2026-0042')
    .field('body', 'V příloze zasíláme fakturu.');

  return attachment === undefined
    ? request
    : request.attach('attachment', attachment.body, {
        filename: attachment.name,
        contentType: attachment.type,
      });
};

const invoicePart = { name: 'faktura.pdf', type: 'application/pdf', body: Buffer.alloc(0) };

describe('POST /svj/:svjId/invoices/inbound', () => {
  it('opens an invoice for someone who may book one', async () => {
    const response = await post(accountant, { ...invoicePart, body: pdf }).expect(CREATED);

    expect(bodyOf(response, inboundSchema).duplicateOf).toBeUndefined();
  });

  it('answers the invoice already opened when the same file arrives again', async () => {
    const again = await post(accountant, { ...invoicePart, body: pdf }).expect(CREATED);

    expect(bodyOf(again, inboundSchema).duplicateOf).toBeDefined();
  });

  it('refuses a committee member, who may read finance but not book it', async () => {
    expect((await post(chair, { ...invoicePart, body: pdf })).status).toBe(403);
  });

  it('refuses a message with no invoice in it', async () => {
    const response = await post(accountant, {
      name: 'podpis.png',
      type: 'image/png',
      body: Buffer.from('x'),
    });

    expect(response.status).toBe(422);
  });

  it('answers 401 without a credential', async () => {
    const response = await api
      .http()
      .post(`/svj/${svjId}/invoices/inbound`)
      .field('from', 'kdokoliv@example.test');

    expect(response.status).toBe(401);
  });
});

describe('the published OpenAPI document', () => {
  it('marks the simulated inbox as a demo endpoint', async () => {
    const document = bodyOf(
      await api.http().get('/openapi.json').expect(200),
      z.object({
        paths: z.record(z.string(), z.record(z.string(), z.object({ tags: z.array(z.string()).optional() }))),
      }),
    );

    expect(document.paths['/svj/{svjId}/invoices/inbound']?.['post']?.tags).toContain('demo');
  });
});
