const ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/** Everything that goes into an element goes through here; a supplier called `A & B` is common. */
export const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/gu, (character) => ENTITIES[character] ?? character);

export const element = (name: string, value: string | number | undefined): string =>
  value === undefined || value === '' ? '' : `<${name}>${escapeXml(String(value))}</${name}>`;

export const wrap = (name: string, children: readonly string[], attributes = ''): string =>
  `<${name}${attributes}>${children.filter((one) => one !== '').join('')}</${name}>`;

/** Pohoda wants money as a plain decimal with a point, whatever the locale of the machine. */
export const money = (value: number): string => value.toFixed(2);
