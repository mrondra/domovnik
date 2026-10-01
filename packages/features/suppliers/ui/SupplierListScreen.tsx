import Link from 'next/link';
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
import { Inline, Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text, linkClassName, navLinkClassName } from '../../../shared/src/ui/typography/index';
import { specializationSchema, type Specialization } from '../domain/specializations';
import { SPECIALIZATION_LABEL } from './labels';
import type { SupplierView } from './wire';

const FILTERS: readonly (Specialization | 'all')[] = ['all', ...specializationSchema.options];

export interface SupplierListScreenProps {
  readonly suppliers: readonly SupplierView[];
  readonly specialization: Specialization | 'all';
  /** Where a row leads. The route prefix belongs to the application, not to the feature. */
  readonly detailHref: (supplierId: string) => string;
  readonly filterHref: (specialization: Specialization | 'all') => string;
}

export const SupplierListScreen = ({
  suppliers,
  specialization,
  detailHref,
  filterHref,
}: SupplierListScreenProps): ReactElement => (
  <Stack gap="lg">
    <Stack gap="2xs">
      <Heading level={1}>Dodavatelé</Heading>
      <Text size="sm" tone="subtle">
        Adresář firem, se kterými má správcovská firma nebo některé SVJ co do činění
      </Text>
    </Stack>

    <Inline gap="sm">
      {FILTERS.map((one) => (
        <Link
          key={one}
          href={filterHref(one)}
          className={navLinkClassName(one === specialization ? 'active' : 'idle')}
        >
          {one === 'all' ? 'Vše' : SPECIALIZATION_LABEL[one]}
        </Link>
      ))}
    </Inline>

    {suppliers.length === 0 ? (
      <EmptyState title="Pro tento obor tu není žádný dodavatel." />
    ) : (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Název</TableHeaderCell>
            <TableHeaderCell>Obory</TableHeaderCell>
            <TableHeaderCell>Kontakt</TableHeaderCell>
            <TableHeaderCell>Stav</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell>
                <Link href={detailHref(supplier.id)} className={linkClassName({ weight: 'medium' })}>
                  {supplier.name}
                </Link>
              </TableCell>
              <TableCell>
                <Inline gap="2xs">
                  {supplier.specializations.length === 0
                    ? '—'
                    : supplier.specializations.map((one) => (
                        <Badge key={one}>{SPECIALIZATION_LABEL[one]}</Badge>
                      ))}
                </Inline>
              </TableCell>
              <TableCell>{supplier.phone ?? supplier.email ?? '—'}</TableCell>
              <TableCell>
                <Badge tone={supplier.isActive ? 'positive' : 'neutral'}>
                  {supplier.isActive ? 'Aktivní' : 'Neaktivní'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Stack>
);
