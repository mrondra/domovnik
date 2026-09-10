# Domovník

AI-native platforma pro správu SVJ. Viz `AGENTS.md` (pravidla), `docs/engineering.md` (konvence), `docs/adr/` (rozhodnutí), `docs/zadani.md` (zadání).

```
pnpm install && pnpm dev
pnpm verify
```

## Předpoklady

- Node podle `.nvmrc` (`nvm use`), pnpm podle pole `packageManager` v `package.json` (`corepack enable`).
- Docker (postgres, minio, langfuse přes `docker-compose.yml`).
- **gitleaks** – povinný, pre-commit hook ho volá: `brew install gitleaks` (macOS), jinak <https://github.com/gitleaks/gitleaks#installing>.
- **graphviz** – volitelný, jen pro `pnpm depcruise:graph`: `brew install graphviz`. Bez něj `pnpm verify` funguje, graf se nevygeneruje.
