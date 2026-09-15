import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';
import { Box } from '../layout/index';

export type CellAlign = 'start' | 'end';

const ALIGN: Readonly<Record<CellAlign, string>> = { start: 'text-start', end: 'text-end' };

interface RowsProps {
  readonly children: ReactNode;
}

interface CellProps {
  readonly children?: ReactNode;
  readonly align?: CellAlign;
}

/** Wide tables scroll inside their own box rather than making the page scroll sideways. */
export const Table = ({ children }: RowsProps): ReactElement => (
  <Box overflow="scroll-x">
    <table className="w-full border-collapse text-sm">{children}</table>
  </Box>
);

export const TableHead = ({ children }: RowsProps): ReactElement => (
  <thead className="border-b border-slate-200 text-start text-xs font-medium tracking-wide text-slate-500 uppercase">
    {children}
  </thead>
);

export const TableBody = ({ children }: RowsProps): ReactElement => (
  <tbody className="divide-y divide-slate-100">{children}</tbody>
);

export const TableRow = ({ children }: RowsProps): ReactElement => (
  <tr className="align-middle">{children}</tr>
);

export const TableHeaderCell = ({ children, align = 'start' }: CellProps): ReactElement => (
  <th scope="col" className={cx('px-4 py-2.5 font-medium', ALIGN[align])}>
    {children}
  </th>
);

export const TableCell = ({ children, align = 'start' }: CellProps): ReactElement => (
  <td className={cx('px-4 py-3 text-slate-700', ALIGN[align])}>{children}</td>
);
