# Domovník

AI-native platforma pro správu SVJ. Viz `AGENTS.md` (pravidla), `docs/engineering.md` (konvence), `docs/adr/` (rozhodnutí), `docs/zadani.md` (zadání).

```
cp .env.example .env
pnpm install && pnpm dev
pnpm verify
```

Integrační testy potřebují `DATABASE_URL` k běžícímu Postgresu (`pnpm dev`); bez něj si `startTestDb()`
nastartuje vlastní kontejner. Každý testovací soubor si zakládá vlastní databázi i aplikační roli,
takže RLS izolace se testuje doopravdy (ADR 0013).

## Předpoklady

- Node podle `.nvmrc` (`nvm use`), pnpm podle pole `packageManager` v `package.json` (`corepack enable`).
- Docker (postgres, minio, langfuse přes `docker-compose.yml`).
- **gitleaks** – povinný, pre-commit hook ho volá: `brew install gitleaks` (macOS), jinak <https://github.com/gitleaks/gitleaks#installing>.
- **graphviz** – volitelný, jen pro `pnpm depcruise:graph`: `brew install graphviz`. Bez něj `pnpm verify` funguje, graf se nevygeneruje.
