# 051 – field-reports: API a PWA pro technika

Reference: rozhodnutí fáze 2 – PWA bez offline režimu; ADR 0017.

## Navazuje na

- 050, 034 (úkoly v UI).

## Vytvoří / upraví

- Nové ADR (Accepted – schváleno tímto zadáním): „Mobilní rozhraní technika jako PWA bez offline režimu" (instalovatelnost ano, fronta offline ne; důvod: demo ukazuje AI, ne synchronizaci).
- API: `POST /svj/:svjId/field-reports` (multipart: `kind`, `category?`, `urgent?`, `buildingId?`, `unitId?`, `text?`, `audio?`, `photos[]?`; `field.write`), `GET /field-reports?mine=true&status=`, `GET /field-reports/:id` (+ vzniklé úkoly a závady).
- PWA v `apps/web`: `src/app/manifest.ts` (název „Domovník – technik", `start_url: '/t'`, `display: 'standalone'`, ikony SVG + PNG 192/512 generované skriptem do `public/`), `<meta name="theme-color">`. Service worker **ne**.
- Mobilní shell: route group `apps/web/src/app/t/` s layoutem bez sidebaru (spodní lišta: Úkoly, Nové hlášení, Moje hlášení), `/t` (moje úkoly – komponenty z `tasks/ui` v kompaktní variantě; když chybí, přidej `compact` prop, ne kopii), `/t/report` (nové hlášení), `/t/reports` (moje hlášení se stavem a vzniklými úkoly), `/t/tasks/[id]`.
- `field-reports/ui/`: `ReportForm.client.tsx` (výběr SVJ – default poslední použité; budova/jednotka volitelně; kategorie jako velká tlačítka + „Nevím / víc věcí"; přepínač urgentní; `VoiceRecorder.client.tsx` přes `MediaRecorder` s náhledem a délkou; fotky `<input type="file" accept="image/*" capture="environment" multiple>`; textové pole jako alternativa; odeslání server action → API), `MyReportsScreen.tsx`, `ReportStatusBadge.tsx`, `wire.ts`, `navigation.ts` (desktop „Hlášení z terénu" pro manager).
- Po přihlášení role `technician` přesměrovat na `/t` (middleware / login action).
- E2E `apps/web/e2e/field.e2e.ts`: technik → `/t/report` → kategorie „Úklid" + nahrání audio souboru přes `setInputFiles` (fixtura `sineWav` + replay přepisu) → hlášení `dispatched` → úkol v Úklidu. Druhý test: textové hlášení bez kategorie → agent (stub) → 4 úkoly.
- Viewport: ověř na 390×844 (Playwright device „iPhone 13").

## Akceptační kritéria

- Lighthouse „installable" (ruční ověření v reportu) – manifest validní, `start_url` funguje.
- `pnpm build`, e2e zelené.

## Stav po dokončení

Technik hlásí z mobilu hlasem nebo textem a vidí své úkoly.
