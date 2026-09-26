# 045 – quotes: API a web

## Navazuje na

- 44.

## Vytvoří / upraví

- API: `GET /svj/:svjId/quote-requests?status=`, `GET /quote-requests/:id` (poptávka, příjemci se stavem a odkazem na odeslaný e-mail, nabídky, `compareQuotes`, approval), `POST /quote-requests/:id/cancel`, `POST /quote-requests/:id/quotes` (multipart PDF + `supplierId` – ruční vložení nabídky, `ops.write`).
- `quotes/ui/`: `QuoteRequestListScreen.tsx`, `QuoteRequestDetailScreen.tsx` (příjemci, porovnávací tabulka s označením nejlevnější/nejrychlejší, doporučení agenta, stav approvalu), `QuoteUploadForm.client.tsx`, `labels.ts`, `wire.ts`, `navigation.ts` („Poptávky" pod SVJ, manager/committee).
- `taskOriginLinks` pro `quote_request`; odkaz z detailu revize (039) na poptávku.
- E2E `apps/web/e2e/quotes.e2e.ts` (s replay stubem – rozšíření stubu jen pro tyto dva agenty; celkový refaktor stubu je v 055): scénář hromosvod → manager schválí poptávku → scénář odpovědí → výbor schválí přidělení → revize má dodavatele.

## Akceptační kritéria

`pnpm build`, e2e zelené.
