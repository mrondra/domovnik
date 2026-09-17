import { z } from 'zod';
import { defineTool, neverRequiresApproval } from '../../../kernel/src/tools/index';
import { documentIdSchema } from '../domain/ids';
import { documentSchema } from '../domain/schemas';
import { documentDownloadUrl, getDocument } from '../service/index';

/**
 * Defining the tool registers it; `loadToolsFrom` finds the file by glob, so nothing imports it by
 * hand (AGENTS.md §6). The link is minted with the answer, because a model that has the metadata
 * would otherwise need a second tool to reach the file itself.
 */
export const documentGet = defineTool({
  name: 'document.get',
  description:
    'Vrátí metadata jednoho dokumentu (název, kategorie, typ, velikost, otisk sha256, navázaná ' +
    'entita) a dočasný odkaz ke stažení. Použij, když znáš id dokumentu. ' +
    'Dokument SVJ mimo rozsah přihlášení se chová, jako by neexistoval.',
  input: z.object({ documentId: z.uuid() }),
  output: documentSchema.extend({ downloadUrl: z.url() }),
  permission: 'documents.read',
  approval: neverRequiresApproval,
  userComposable: true,
  readOnly: true,
  handler: async (ctx, input) => {
    const documentId = documentIdSchema.parse(input.documentId);
    const found = await getDocument(ctx, documentId);
    const link = await documentDownloadUrl(ctx, documentId);
    return { ...found, downloadUrl: link.url };
  },
});
