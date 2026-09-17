import { z } from 'zod';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { documentCategorySchema, documentSchema } from '../domain/schemas';
import { listDocuments } from '../service/index';

/** No link here: minting one presigned URL per row would sign files nobody asked to open. */
export const documentList = defineTool({
  name: 'document.list',
  description:
    'Vypíše dokumenty jednoho SVJ, od nejnovějších, volitelně jen jedné kategorie ' +
    '(invoice, contract, inspection_report, minutes, other). Vrací metadata bez odkazu ke ' +
    'stažení – ten dá document.get. SVJ mimo rozsah přihlášení se chová, jako by neexistovalo.',
  input: z.object({ svjId: z.uuid(), category: documentCategorySchema.optional() }),
  output: z.array(documentSchema).readonly(),
  permission: 'documents.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: (ctx, input) =>
    listDocuments(ctx, { svjId: svjIdSchema.parse(input.svjId), category: input.category }),
});
