import { escapeXml, wrap } from './escape';

export const APPLICATION = 'Domovnik';
export const DATA_PACK_VERSION = '2.0';

const NAMESPACES = [
  'xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd"',
  'xmlns:inv="http://www.stormware.cz/schema/version_2/invoice.xsd"',
  'xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd"',
  'xmlns:lst="http://www.stormware.cz/schema/version_2/list.xsd"',
  'xmlns:adb="http://www.stormware.cz/schema/version_2/addressbook.xsd"',
  'xmlns:bnk="http://www.stormware.cz/schema/version_2/bank.xsd"',
  'xmlns:ftr="http://www.stormware.cz/schema/version_2/filter.xsd"',
].join(' ');

export interface DataPackItem {
  readonly id: string;
  readonly body: string;
}

/**
 * The envelope every request to Pohoda travels in: who is asking, about which accounting unit, and
 * what for. `ico` is the accounting unit's, not ours — each SVJ is its own unit (zadání kap. 4).
 *
 * The element names follow the public `dataPack` 2.x documentation. Which of them a given Pohoda
 * build accepts is **unverified** — see this directory's README.
 */
export const dataPack = (input: {
  readonly id: string;
  readonly ico: string;
  readonly note: string;
  readonly items: readonly DataPackItem[];
}): string => {
  const attributes =
    ` version="${DATA_PACK_VERSION}" id="${escapeXml(input.id)}"` +
    ` ico="${escapeXml(input.ico)}" application="${APPLICATION}"` +
    ` note="${escapeXml(input.note)}" ${NAMESPACES}`;

  const items = input.items.map((item) =>
    wrap('dat:dataPackItem', [item.body], ` version="${DATA_PACK_VERSION}" id="${escapeXml(item.id)}"`),
  );

  return `<?xml version="1.0" encoding="utf-8"?>${wrap('dat:dataPack', items, attributes)}`;
};
