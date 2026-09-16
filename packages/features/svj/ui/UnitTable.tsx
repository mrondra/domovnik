import type { ReactElement } from 'react';
import {
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../../../shared/src/ui/elements/index';
import { formatShare } from '../domain/share';
import type { UnitView } from '../domain/schemas';
import { formatArea, UNIT_KIND_LABEL } from './labels';

export interface UnitTableProps {
  readonly units: readonly UnitView[];
}

export const UnitTable = ({ units }: UnitTableProps): ReactElement => {
  if (units.length === 0) return <EmptyState title="SVJ zatím nemá evidované jednotky." />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Jednotka</TableHeaderCell>
          <TableHeaderCell>Typ</TableHeaderCell>
          <TableHeaderCell align="end">Podíl</TableHeaderCell>
          <TableHeaderCell align="end">Plocha</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {units.map((unit) => (
          <TableRow key={unit.id}>
            <TableCell>{unit.number}</TableCell>
            <TableCell>
              <Badge>{UNIT_KIND_LABEL[unit.kind]}</Badge>
            </TableCell>
            <TableCell align="end">{formatShare(unit.share)}</TableCell>
            <TableCell align="end">{formatArea(unit.floorArea)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
