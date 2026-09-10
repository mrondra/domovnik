export interface Names {
  /** As typed on the command line: `field-reports`. */
  readonly kebab: string;
  /** Identifiers and tool actions: `fieldReports`. */
  readonly camel: string;
  /** Types, services, Nest modules: `FieldReports`. */
  readonly pascal: string;
  /** Tables and columns: `field_reports`. */
  readonly snake: string;
}

const KEBAB_CASE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const isKebabCase = (value: string): boolean => KEBAB_CASE.test(value);

const capitalise = (part: string): string => part.charAt(0).toUpperCase() + part.slice(1);

export const namesOf = (kebab: string): Names => {
  const parts = kebab.split('-');
  return {
    kebab,
    camel: parts.map((part, index) => (index === 0 ? part : capitalise(part))).join(''),
    pascal: parts.map(capitalise).join(''),
    snake: parts.join('_'),
  };
};

const DIACRITICS = /\p{Diacritic}/gu;
const NON_SLUG = /[^a-z0-9]+/g;

/** `Účtování v Pohodě` → `uctovani-v-pohode`, so an ADR file name survives a Czech title. */
export const slugify = (title: string): string =>
  title.normalize('NFD').replace(DIACRITICS, '').toLowerCase().replace(NON_SLUG, '-').replace(/^-|-$/g, '');
