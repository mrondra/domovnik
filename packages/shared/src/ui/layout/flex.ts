export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

export const ALIGN: Readonly<Record<Align, string>> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

export type Justify = 'start' | 'center' | 'end' | 'between';

export const JUSTIFY: Readonly<Record<Justify, string>> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};
