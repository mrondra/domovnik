import { z } from 'zod';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { supplierIdSchema } from '../domain/ids';
import { invoiceStatusSchema } from '../domain/schemas';
import { supplierHistory } from '../service/index';

/** The context that tells an ordinary month from an unusual one. */
export const invoiceSupplierHistory = defineTool({
  name: 'invoice.supplierHistory',
  description:
    'Vypíše posledních dvanáct faktur jednoho dodavatele pro jedno SVJ: datum vystavení, ' +
    'částku, číslo a stav, od nejnovější. Použij, když potřebuješ vědět, jestli je částka ' +
    'obvyklá. Prázdný seznam znamená, že dodavatel tomuto SVJ ještě nefakturoval.',
  input: z.object({ svjId: z.uuid(), supplierId: z.uuid() }),
  output: z
    .array(
      z.object({
        issuedOn: z.iso.date().nullable(),
        amountTotal: z.number().nullable(),
        externalNumber: z.string().nullable(),
        status: invoiceStatusSchema,
      }),
    )
    .readonly(),
  permission: 'finance.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) =>
    supplierHistory(ctx, {
      svjId: svjIdSchema.parse(input.svjId),
      supplierId: supplierIdSchema.parse(input.supplierId),
    }),
});
