# 010 – kernel: storage (S3/MinIO)

Reference: zadání kap. 3.2; `docker-compose.yml` (služba `minio`); `packages/kernel/src/env/schema.ts`; ADR 0013 (dvě role – zde analogicky jeden bucket, prefix per tenant).

## Navazuje na

- MinIO běží v compose (000). Env schéma nemá žádné S3 klíče.

## Cíl

Jediné místo pro ukládání souborů. Feature `documents` (011) nad ním staví metadata; nic jiného nesahá na S3 přímo (lint + depcruise: `@aws-sdk/*` jen v `packages/kernel/src/storage`).

## Vytvoří / upraví

- `packages/kernel/src/storage/README.md`, `index.ts`, `client.ts` (S3Client z `@aws-sdk/client-s3`, `forcePathStyle: true`), `keys.ts`, `operations.ts`, `presign.ts`, `storage.int.test.ts`.
- `packages/kernel/src/env/schema.ts` – `S3_ENDPOINT` (url), `S3_REGION` (default `us-east-1`), `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PRESIGN_TTL_SECONDS` (default 900). `.env.example` doplnit.
- `packages/kernel/src/testing/storage.ts` – `startTestStorage()`: testcontainer `minio/minio`, vytvoří bucket, vrátí env; export z `testing/index.ts`.
- `docker/minio/` – init skript vytvářející bucket `domovnik` (pokud compose ještě nemá).
- `tooling/eslint/practices.js` + `.dependency-cruiser.cjs` – pravidlo `no-direct-s3`: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` jen z `packages/kernel/src/storage`.
- `packages/kernel/src/index.ts` – re-export storage.

## Rozhraní

```ts
export type StorageKey = string & { readonly __brand: 'StorageKey' };
/** Klíč je vždy `tenants/<tenantId>/<area>/<uuid>[.ext]`; area je název feature ("documents"). */
export const storageKeyFor = (ctx: RequestContext, area: string, filename: string): StorageKey;
export const putObject = (ctx: RequestContext, key: StorageKey, body: Buffer | Readable, contentType: string): Promise<{ key: StorageKey; size: number; sha256: string }>;
export const getObject = (ctx: RequestContext, key: StorageKey): Promise<{ body: Readable; contentType: string; size: number }>;
export const deleteObject = (ctx: RequestContext, key: StorageKey): Promise<void>;
export const presignedGetUrl = (ctx: RequestContext, key: StorageKey, ttlSeconds?: number): Promise<string>;
```

Každá operace ověří, že `key` začíná prefixem `tenants/${ctx.tenantId}/` – jinak `ForbiddenError` (`storage_key_outside_tenant`). `sha256` se počítá při uploadu (stream hash).

## Testy

- `storage.int.test.ts` nad `startTestStorage()`: put → get (obsah + contentType) → presigned URL vrátí 200 přes fetch → delete → get vyhodí `NotFoundError`.
- Klíč cizího tenantu → `ForbiddenError`.
- Unit test `storageKeyFor` (uuid v7, zachování přípony, odmítnutí `..` a `/` ve filename).

## Akceptační kritéria

- `pnpm verify` zelený; coverage kernel ≥ 90 % drží.
- `git grep "@aws-sdk"` mimo `packages/kernel/src/storage` a `package.json` nic nenajde.

## Mimo rozsah

Metadata dokumentů, verze, kategorie (011). Upload z prohlížeče (přijde s UI dokumentů ve fázi 3; ve fázi 1 nahrává jen server).

## Stav po dokončení

`putObject/getObject/presignedGetUrl` v kernelu, `startTestStorage()` v testing.
