import { XMLParser } from 'fast-xml-parser';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AdapterError } from '../../../kernel/src/errors/index';
import { dataPack, parseResponsePack, receivedInvoice } from '../adapters/pohoda/xml/builders';
import { INVOICES, RISKY } from './xml.fixture';

/**
 * No XSD is checked in — Stormware's schemas are not ours to redistribute — so the structure is
 * verified by hand here: the document parses, the envelope carries what identifies the accounting
 * unit, and the invoice carries the fields ADR 0005 says it does. The snapshots hold the rest.
 */
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', removeNSPrefix: true });

const envelope = z.object({ dataPack: z.record(z.string(), z.unknown()) });

const attributesOf = (xml: string): Record<string, unknown> => envelope.parse(parser.parse(xml)).dataPack;

const packFor = (input: (typeof INVOICES)[number]['input']): string =>
  dataPack({
    id: input.invoiceId,
    ico: '26512345',
    note: `Přijatá faktura ${input.externalNumber}`,
    items: [{ id: input.invoiceId, body: receivedInvoice(input) }],
  });

describe.each(INVOICES)('a received invoice $name', ({ input }) => {
  const xml = packFor(input);

  it('is a document that parses', () => {
    expect(() => attributesOf(xml)).not.toThrow();
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
  });

  it('says which accounting unit it is about, and who is asking', () => {
    expect(attributesOf(xml)).toMatchObject({
      '@ico': '26512345',
      '@application': 'Domovnik',
      '@version': '2.0',
    });
  });

  it('carries the supplier, the dates and the total', () => {
    expect(xml).toContain('<inv:invoiceType>receivedInvoice</inv:invoiceType>');
    expect(xml).toContain(`<typ:ico>${input.supplier.ico}</typ:ico>`);
    expect(xml).toContain(`<inv:dateDue>${input.dueOn}</inv:dateDue>`);
    expect(xml).toContain(`<typ:priceHighSum>${input.amountTotal.toFixed(2)}</typ:priceHighSum>`);
  });

  it('is the document it was', () => {
    expect(xml).toMatchSnapshot();
  });
});

it('escapes what would otherwise end the document early', () => {
  const xml = packFor(RISKY);

  expect(xml).toContain('Beran &amp; syn &lt;úklid&gt;');
  expect(xml).not.toContain('<úklid>');
});

describe('what Pohoda answers with', () => {
  it('reads the reference of a document it created', () => {
    const result = parseResponsePack(
      '<rsp:responsePack version="2.0" state="ok" xmlns:rsp="x"><rsp:responsePackItem state="ok">' +
        '<rsp:producedDetails><rsp:id>42</rsp:id><rsp:number>2026000412</rsp:number>' +
        '</rsp:producedDetails></rsp:responsePackItem></rsp:responsePack>',
    );

    expect(result).toStrictEqual({ ok: true, id: '42', number: '2026000412', message: null });
  });

  it('reads a refusal as an answer, not as a failure', () => {
    const result = parseResponsePack(
      '<rsp:responsePack version="2.0" state="error" xmlns:rsp="x">' +
        '<rsp:responsePackItem state="error" note="Členění DPH UD neexistuje."/></rsp:responsePack>',
    );

    expect(result).toMatchObject({ ok: false, message: 'Členění DPH UD neexistuje.' });
  });

  it('refuses to guess at an answer it does not recognise', () => {
    expect(() => parseResponsePack('<html><body>503</body></html>')).toThrow(AdapterError);
  });
});
