# Domovník

AI-native platforma pro správu SVJ. Viz `AGENTS.md` (pravidla), `docs/engineering.md` (konvence), `docs/adr/` (rozhodnutí), `docs/zadani.md` (zadání).

```
cp .env.example .env
pnpm install && pnpm dev
pnpm verify
```

`pnpm dev` zvedne infrastrukturu v Dockeru a všechny aplikace: web (3000), API (3001), workers
(health na 3002) a MCP server (3003). Schválená akce se provede až ve workers (ADR 0015), takže bez
nich se rozhodnutí jen zapíše.

`pnpm test:e2e` spustí Playwright nad webem a API. Není součástí `pnpm verify` – potřebuje databázi,
běžící servery a prohlížeč (`npx playwright install chromium`).

Integrační testy potřebují `DATABASE_URL` k běžícímu Postgresu (`pnpm dev`); bez něj si `startTestDb()`
nastartuje vlastní kontejner. Každý testovací soubor si zakládá vlastní databázi i aplikační roli,
takže RLS izolace se testuje doopravdy (ADR 0013).

## Předpoklady

- Node podle `.nvmrc` (`nvm use`), pnpm podle pole `packageManager` v `package.json` (`corepack enable`).
- Docker (postgres, minio, langfuse přes `docker-compose.yml`).
- **gitleaks** – povinný, pre-commit hook ho volá: `brew install gitleaks` (macOS), jinak <https://github.com/gitleaks/gitleaks#installing>.
- **graphviz** – volitelný, jen pro `pnpm depcruise:graph`: `brew install graphviz`. Bez něj `pnpm verify` funguje, graf se nevygeneruje.
