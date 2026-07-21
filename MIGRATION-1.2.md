# Migrating to @sdcorejs/utils 1.2

Version 1.2 is a security and correctness release that preserves existing names and
import paths wherever doing so does not preserve unsafe behavior. Some malformed or
security-sensitive inputs that v1.1.x accepted now throw typed errors.

## Before upgrading

1. Run your test suite with v1.2 installed from a packed artifact.
2. Search for the deprecated APIs listed below.
3. Identify code that creates object keys or property paths from external input.
4. Confirm whether each paginated endpoint is zero- or one-based, then adapt any
   one-based service inside its transport callback.
5. Make numeric timestamp units explicit in client-side filters.
6. Replace security-sensitive uses of legacy `encrypt`, `decrypt`, and `hash`.

## Legacy obfuscation and AES-GCM

`StringUtilities.encrypt` and `decrypt` keep the exact v1.1.x reversible format so
stored values remain readable. They have been reclassified as deprecated obfuscation:
they provide no confidentiality, integrity, or authenticity.

- Rename non-security uses to `obfuscate` and `deobfuscate`; the payload format stays
  compatible.
- For new protected data, use `encryptAesGcm` and `decryptAesGcm` with a Web Crypto
  `CryptoKey` or 16/24/32-byte raw AES key.
- Do not pass passwords directly as keys.
- Do not overwrite legacy stored values until they have been read with `decrypt` and
  intentionally re-encrypted with AES-GCM.
- Store the returned versioned token unchanged. A wrong key, changed ciphertext, IV,
  or additional authenticated data fails authentication.

Missing Web Crypto support throws `WebCryptoUnavailableError`; unavailable secure
randomness throws `SecureRandomUnavailableError`. Handle these typed failures rather
than adding a weak or unauthenticated fallback.

## Unsafe object keys and property paths

Object construction, cloning/merging, query parsing, templates, array-to-object
conversion, and filter paths now reject `__proto__`, `prototype`, and `constructor`.
Expect `UnsafeObjectKeyError` or `UnsafePropertyPathError` instead of a partial result.

Paths now traverse own data properties only, do not invoke getters by default, reject
malformed syntax, and enforce a maximum depth. If inherited/accessor behavior was
intentional, copy the trusted value into an own data property before calling the helper.
Do not weaken these rules for untrusted paths.

`ObjectUtilities.clone` preserves cyclic graphs. Arrays, plain objects, and
null-prototype objects are deep-cloned, while custom-prototype records are sanitized to
safe own-property records. For v1.x compatibility, `Date`, `Map`, `Set`, functions, and
class instances remain leaf references. Merge recursively combines record-like objects,
replaces arrays and other non-plain values, treats `undefined` as "inherit default", and
treats `null` as an explicit override. Excessive depth now throws `ValidationError`;
raise the explicit `maxDepth` only for trusted, intentionally deep data.

## Serialization and hashing

`stableStringify` now always returns a string or throws. It supports deterministic
JSON-compatible data plus valid dates and rejects unsupported values, cycles, sparse
arrays, accessors, and class instances.

Use `canonicalStringify` for the documented extended JavaScript value domain. Use
`sha256Canonical` when a cryptographic digest of that representation is required, or
`sha256Blob` to hash actual Blob/File bytes.

`hash` remains as a deprecated compatibility name. Rename it to `hash32`, but remember
that the algorithm is collision-prone and non-cryptographic. Unsupported values that
previously collided or produced invalid output now throw.

## Date APIs

Choose APIs by semantic type:

| Legacy/ambiguous API | Replacement |
| --- | --- |
| permissive date-only parsing | `parseLocalDateStrict` |
| local date-time parsing | `parseLocalDateTimeStrict` |
| offset/Z timestamp parsing | `parseInstant` |
| `dayDiff` | `calendarDayDifference` or `elapsedDayDifference` |
| `yearDiff` | `completedYearDifference` |
| `age` | `completedAge` or `decimalYearDifference` |
| `addMiliseconds` | `addMilliseconds` |

Date-only ISO values are now constructed in local calendar time and do not pass through
UTC midnight. Strict parsers reject overflow dates and invalid times with
`DateParseError`. `calendarDayDifference` is DST-safe. `addMonths` constrains to the
last valid target-month day by default; choose `overflow: 'balance'` for JavaScript's
rollover behavior or `overflow: 'reject'` to fail the operation.

`addMilliseconds` adds exact elapsed milliseconds through the instant timestamp. The
misspelled `addMiliseconds` wrapper retains its legacy local-clock setter behavior;
switching names can therefore intentionally change a result that crosses a DST offset
transition.

`completedAge` and `completedYearDifference` use February 28 as the anniversary of
February 29 in non-leap years. Confirm that policy against jurisdiction-specific legal
age rules before using it for regulated decisions.

## Filters

Use `validateFilter` at configuration boundaries and `evaluateFilter` to validate then
evaluate. Malformed operands, operators, paths, recursive/cyclic groups, reversed
`BETWEEN` ranges, and non-array `IN`/`NOT_IN` operands throw
`FilterValidationError`. Invalid entity field data produces a deterministic non-match.

Boolean and number coercion is strict. Empty/whitespace strings, hexadecimal values,
`NaN`, and infinity are not silently coerced. Numeric date fields require
`timestampUnit: 'seconds' | 'milliseconds'` globally, per field, or per filter.
`legacyTimestampInference: true` temporarily restores the deprecated magnitude
heuristic for controlled migrations.

Client-side filters are not an authorization control. Reapply access rules on a trusted
server.

## Pagination

The public paging contract is strictly zero-based: page `0` is the first page.
`ArrayUtilities.paging` has no paging-options argument, and `fetchAllByPaging` always
starts its callback at `0`. Its options retain only `maxPages`, `signal`, and
`totalChangePolicy`; the earlier unshipped `pageBase` and `initialPage` proposal is not
part of the v1.2 public API.

For a one-based service, translate `pageNumber + 1` only inside the transport callback.
Do not shift page numbers in models, callers, or helper options:

```ts
const items = await fetchAllByPaging(
  (pageSize, pageNumber, signal) =>
    client.list({ pageSize, pageNumber: pageNumber + 1, signal }),
);
```

`fetchAllByPaging` now throws on malformed later pages rather than returning `[]`, and
it rejects empty-page no-progress, changing totals by default, invalid sizes/pages,
abort signals, and `maxPages` exhaustion. Equal values from different offsets are
preserved rather than mistaken for a repeated page. Use `totalChangePolicy: 'latest'`
only when the endpoint intentionally reports a changing total.

When `signal` is supplied, it now races an in-flight page promise and is also passed as
the callback's optional third argument. Forward it to `fetch` or another transport to
cancel underlying I/O; existing two-argument callbacks continue to work.

## Browser helpers

- `BrowserUtilities.upload` rejects cancellation with `FilePickerCancelledError` and
  may time out; handle its rejected promise. Each invocation uses its own input.
- Filename validators keep their existing callback shape. Use `fileValidator` for the
  full `File`. A non-empty message rejects the selection. Validators run once.
- File extension, MIME, and size checks are UX checks, not trusted content validation.
- Downloads allow `http:`, `https:`, `blob:`, and same-origin relative URLs by default.
  Opt into `data:` only with `{ allowDataUrl: true }`, or list another reviewed scheme
  in `additionalProtocols`. That list can never enable `data:`, `javascript:`, or
  `vbscript:`. Unsafe schemes throw `UnsafeUrlProtocolError`.
- `copyToClipboard` now returns `Promise<void>`. Existing fire-and-forget calls still
  compile, but applications should `await` it and handle permission failures.
- `detectIncognito` is deprecated and bounded by a timeout. Its result is an unreliable
  heuristic and must never drive access or security decisions.

## UUID and validation helpers

`generateUuid` now returns an RFC-compatible UUID v4 using secure randomness or throws
`SecureRandomUnavailableError`; there is no `Math.random` fallback. Use `randomId` only
for non-security convenience identifiers.

Use `ValidationUtilities.isUrl` with explicit policy options. Replace claims that
`isImageUrl` validates image content with `hasImageFileExtension`, which checks syntax
only. `allowRelative` accepts paths only when they resolve to the configured base origin;
cross-origin network-path and backslash references now return `false`. The deprecated
`isImageUrl` keeps its URL-plus-extension role but now rejects embedded credentials
through the stricter URL parser. Replace broad `isNumber` checks with `isFiniteNumber`,
`isNumericString`, or `parseFiniteNumber`. Base64 checks now require standard padding unless the value already
forms complete four-character groups. `ValidationUtilities.isUuid()` checks generic UUID
syntax with optional version/variant policies; use `isUuidV4()` when version 4 plus the
RFC variant is required.

## MaybeAsync and RxJS

RxJS is no longer a peer or runtime dependency. `MaybeAsync<T>` accepts a value,
`PromiseLike<T>`, or structural `SubscribableLike<T>`. `resolveMaybeAsync` resolves the
first emission, cleans up the subscription, propagates errors, and rejects empty
completion with `EmptySubscribableError`.

`normalizeAsync` remains as a deprecated alias for `normalizeSubscribable`, but its
declared result for plain values and promises is no longer an RxJS `Observable`. Code
that calls RxJS-only methods such as `.pipe()` on those inputs must normalize in the
application with RxJS instead. An RxJS Observable passed into either normalization
function is returned unchanged with its concrete type, preserving its operators.

## Deprecated API map

| Deprecated | Replacement | v1.2 behavior/migration risk |
| --- | --- | --- |
| `encrypt` | `obfuscate` or `encryptAesGcm` | Legacy bytes unchanged; it is not encryption. |
| `decrypt` | `deobfuscate` or `decryptAesGcm` | Legacy values remain readable; formats are not interchangeable. |
| `hash` | `hash32` or `sha256Canonical` | Simple legacy values retain the hash; unsupported values now throw. |
| `dayDiff` | `calendarDayDifference` / `elapsedDayDifference` | Legacy floor semantics remain in the wrapper. |
| `yearDiff` | `completedYearDifference` | Legacy calendar-year boundary behavior remains in the wrapper. |
| `age` | `completedAge` / `decimalYearDifference` | Legacy decimal month-based behavior remains in the wrapper. |
| `addMiliseconds` | `addMilliseconds` | Legacy local-clock behavior remains in the wrapper; the replacement uses exact elapsed time and can differ across DST. |
| `ValidationUtilities.isImageUrl` | `hasImageFileExtension` | Neither API proves content type or safety; v1.2 URL parsing also rejects credentials/malformed values more strictly. |
| `NumberUtilities.isNumber` | explicit number helpers | Broad coercion remains only in the legacy wrapper. |
| `ValidationUtilities.isNumber` | `isNumericString` | Legacy decimal-string syntax remains unchanged; replacement options may accept exponent/hex syntax. |
| `normalizeAsync` | `normalizeSubscribable` | Plain/Promise inputs return only the structural contract; an existing RxJS input keeps its concrete type and operators. |
| `detectIncognito` | none | Bounded best-effort result remains unreliable. |
| `legacyTimestampInference` | explicit timestamp units | Heuristic available only as an opt-in migration switch. |

## Typed errors

Catch the narrow exported error when recovery is possible, or `SdcoreUtilsError` for the
library hierarchy. New validation errors include `UnsafeObjectKeyError`,
`UnsafePropertyPathError`, `UnsupportedSerializationTypeError`,
`EncryptionFormatError`, `EncryptionAuthenticationError`, `WebCryptoUnavailableError`,
`SecureRandomUnavailableError`, `FilterValidationError`, `PagingResponseError`,
`PagingLimitError`, `FilePickerCancelledError`, `UnsafeUrlProtocolError`, and
`DateParseError`.
