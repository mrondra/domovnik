# storage

The only way to object storage (MinIO locally, S3 in production). Neither the `S3Client` nor the
bucket name leaves this module — only the five operations below do.

| File            | Contents                                                                   |
| --------------- | -------------------------------------------------------------------------- |
| `client.ts`     | the memoised `S3Client`, the bucket name, and the SDK → taxonomy error map |
| `keys.ts`       | `StorageKey`, `storageKeyFor`, the tenant-prefix check                     |
| `operations.ts` | `putObject`, `getObject`, `deleteObject`                                   |
| `presign.ts`    | `presignedGetUrl` — a short-lived download link for the browser            |

A key is always `tenants/<tenantId>/<area>/<uuid>[.ext]`, where `area` is the name of the feature
that owns the file (`documents`). `storageKeyFor` builds it; the uploaded filename only contributes
its extension, because the original name is neither unique nor safe to put in a path.

**The rule:** every operation first checks that the key starts with the caller's tenant prefix and
throws `ForbiddenError` (`storage_key_outside_tenant`) when it does not. There is one bucket and no
RLS here, so that check is the whole isolation story — a key arriving in a request body would
otherwise read another tenant's file.

`putObject` returns `size` and the `sha256` of what was stored; that hash is what a feature compares
against to recognise the same file uploaded twice. The object is read into memory first, because S3
needs the content length before the first byte goes out.

`deleteObject` is idempotent: a key that is already gone is a success. `getObject` on a missing key
is a `NotFoundError`; anything else the SDK raises becomes an `AdapterError` whose `retryable` flag
follows the HTTP status.
