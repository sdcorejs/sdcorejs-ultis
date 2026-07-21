# @sdcorejs/utils 1.2.0

## Security

- Blocks prototype-replacement keys in object builders, clone/merge operations, query
  parsing, templates, array indexing, and filters.
- Uses bounded own-data-property traversal that rejects unsafe/malformed paths and does
  not invoke getters by default.
- Adds versioned Web Crypto AES-GCM authenticated encryption with random 96-bit IVs,
  browser-safe base64url, optional authenticated data, and typed format/authentication
  failures.
- Fails missing Web Crypto or secure randomness explicitly with
  `WebCryptoUnavailableError` or `SecureRandomUnavailableError`; no weak fallback is
  introduced.
- Reclassifies legacy `encrypt`/`decrypt` accurately as reversible obfuscation while
  preserving the existing payload format.
- Generates UUID v4 values only with cryptographically secure randomness or throws.
- Rejects unsafe download protocols by default and prevents opener access for new tabs.

## New APIs

- `obfuscate`, `deobfuscate`, `encryptAesGcm`, and `decryptAesGcm`.
- `canonicalStringify`, `hash32`, `sha256Canonical`, and `sha256Blob`.
- Strict date parsing and explicit calendar/elapsed/year/age helpers.
- `validateFilter`, `evaluateFilter`, `ValidatedFilter`, and explicit timestamp units.
- `isFiniteNumber`, `isNumericString`, `parseFiniteNumber`, URL/UUID policy options,
  and `hasImageFileExtension`.
- `normalizeSubscribable` and dependency-free structural async types.
- Public `SdcoreUtilsError` hierarchy and focused security/validation errors.

## Correctness fixes

- Makes serialization deterministic and rejects unsupported values instead of
  returning `undefined`, colliding silently, or producing malformed output.
- Prevents local date-only values from shifting through UTC, validates calendar values,
  handles DST-aware calendar differences, constrains month-end arithmetic, and formats
  repeated tokens deterministically.
- Validates filter shapes before evaluation, enforces strict booleans/numbers/ranges,
  detects cyclic/deep groups, and requires explicit timestamp units.
- Inserts string replacement values literally, including `$&`, `$1`, ``$` ``, and `$'`.
- Makes array union linear and stable, bounds iterative tree search, validates paging,
  and preserves sparse-array behavior.
- Makes `addMilliseconds` use exact elapsed time across DST while retaining the legacy
  local-clock behavior in the deprecated misspelled wrapper.
- Constrains relative URL validation to the configured base origin and rejects
  cross-origin network-path/backslash references.
- Makes multi-page fetches terminating and lossless with response validation, abort,
  empty-page no-progress detection, changing-total policy, `maxPages`, duplicate-value
  preservation, and a strict page-0 start.

## Browser fixes

- Isolates concurrent file pickers, deterministically rejects cancel/timeout/validation
  failures, sets `accept`, calls validators once, and cleans up nodes/listeners.
- Allows only documented URL schemes, makes `data:` opt-in, sets
  `noopener noreferrer`, and always revokes object URLs.
- Makes clipboard failures awaitable through `Promise<void>`.
- Bounds the deprecated incognito heuristic and guarantees settlement.

## Packaging fixes

- Removes RxJS from runtime, peer dependencies, and public declarations while retaining
  structural compatibility with RxJS Observables supplied by applications.
- Publishes correct ESM, CommonJS, and condition-specific declaration targets for the
  root, models, constants, functions, and errors entry points.
- Marks the package side-effect free and targets ES2022 on Node.js 20, 22, and 24.
- Adds pull-request/release CI, explicit coverage floors, multi-timezone date tests,
  publint, Are the Types Wrong, packed ESM/CJS/type/browser consumers, no-RxJS proof,
  pinned RxJS compatibility consumers, and packed-package documentation-example compilation.

## Deprecated APIs

- `encrypt` / `decrypt` → `obfuscate` / `deobfuscate` for legacy naming, or the AES-GCM
  APIs for authenticated encryption.
- `hash` → `hash32` for the same non-cryptographic role, or `sha256Canonical`.
- `dayDiff`, `yearDiff`, and `age` → explicit date-difference/age APIs.
- `addMiliseconds` → `addMilliseconds`.
- `ValidationUtilities.isImageUrl` → `hasImageFileExtension`.
- broad `NumberUtilities.isNumber` → explicit finite/string/parse helpers.
- `ValidationUtilities.isNumber` → `isNumericString` for explicit syntax options.
- `normalizeAsync` → `normalizeSubscribable`.
- `detectIncognito` has no security-capable replacement.
- `legacyTimestampInference` → explicit timestamp units.

## Behavior changes

- Previously accepted unsafe object keys and paths now throw typed errors.
- Unsupported serialization values, cycles, sparse JSON arrays, and accessors now fail
  deterministically.
- Malformed filters now throw instead of sometimes matching; invalid entity data is a
  non-match.
- Strict date parsers reject overflow and ambiguous inputs.
- Pagination is strictly zero-based: array paging defaults to page `0`, and
  `fetchAllByPaging` always requests page `0` first. Its options are `maxPages`, `signal`,
  and `totalChangePolicy`; `pageBase` and `initialPage` are not public APIs. Adapt a
  one-based endpoint with `pageNumber + 1` only inside its transport callback.
- Unsafe/malformed download URLs reject; `data:` requires explicit opt-in.
- `copyToClipboard` returns a promise and propagates browser errors.
- UUID generation throws when Web Crypto is unavailable.
- Base64 (standard padded form), UUID, URL, number, and image-extension validation have
  explicit contracts. `isUuid()` validates generic UUID syntax; `isUuidV4()` enforces
  the version-4/RFC-variant contract.

## Migration instructions

Read [MIGRATION-1.2.md](./MIGRATION-1.2.md) before upgrading. In particular, inventory
legacy obfuscation and hash use, make filter timestamp units explicit, keep application
paging zero-based, adapt one-based services only at the transport boundary, handle
typed browser/paging/serialization errors, replace ambiguous date and number helpers,
and update any `normalizeAsync` consumer that relies on RxJS-only methods. See
[SECURITY.md](./SECURITY.md) for the APIs that must not be treated as security controls.
