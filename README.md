# @sdcorejs/utils

[![npm version](https://img.shields.io/npm/v/%40sdcorejs%2Futils.svg)](https://www.npmjs.com/package/@sdcorejs/utils)
[![CI](https://img.shields.io/github/actions/workflow/status/sdcorejs/sdcorejs-utils/ci.yml?branch=main&label=CI)](https://github.com/sdcorejs/sdcorejs-utils/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20%20%7C%2022%20%7C%2024-339933?logo=node.js&logoColor=white)](#runtime-support)
[![License](https://img.shields.io/github/license/sdcorejs/sdcorejs-utils)](./LICENSE)

Production-focused TypeScript utilities for validation, dates, filters, pagination,
browser workflows, serialization, safe object handling, and shared application models.

**Zero runtime dependencies · Framework agnostic · Fully typed · Tree-shakeable · ESM and CommonJS**

[Documentation](https://sdcorejs.github.io/sdcorejs-utils/) ·
[API reference](https://sdcorejs.github.io/sdcorejs-utils/#/api/models-types) ·
[Examples](https://sdcorejs.github.io/sdcorejs-utils/#/examples/security-data) ·
[Migration guide](./MIGRATION-1.2.md) ·
[1.2.0 release notes](./RELEASE_NOTES-1.2.0.md) ·
[Security policy](./SECURITY.md)

> [!NOTE]
> This README documents the v1.2 public contract. Releases are managed by Changesets,
> so the repository can contain v1.2 documentation before the npm `latest` tag moves.
> Use the npm badge above as the source of truth for the currently published version.

## What v1.2 provides

| Area | Highlights |
| --- | --- |
| Secure defaults | Safe own-property traversal, prototype-sensitive key rejection, secure UUID v4 generation, AES-GCM authenticated encryption, and typed failures. |
| Predictable data handling | Deterministic JSON and canonical serialization, cryptographic and non-cryptographic hashes with explicit contracts, bounded clone/merge operations, and strict number/URL validation. |
| Correct date behavior | Separate local dates, local date-times, and offset-bearing instants; DST-safe calendar differences; constrained month arithmetic; and explicit age/year semantics. |
| Validated filters | Typed filters, recursive validation, explicit timestamp units, safe property paths, and deterministic client-side evaluation. |
| Terminating pagination | A strictly zero-based page contract, response validation, abort support, changing-total policy, no-progress detection, and a page limit. |
| Browser workflows | Isolated file pickers, protocol-safe downloads, object URL cleanup, awaitable clipboard writes, and bounded legacy incognito detection. |
| Packaging | ESM, CommonJS, condition-specific declarations, public subpath exports, ES2022 output, no RxJS dependency, and packed-consumer validation. |

The documentation portal is English-first and includes a persistent English/Vietnamese
language switch, left navigation, API reference, searchable examples, migration notes,
and security guidance.

## Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Runtime support](#runtime-support)
- [Exports](#exports)
- [API overview](#api-overview)
- [Encryption and legacy obfuscation](#encryption-and-legacy-obfuscation)
- [Safe object and property-path handling](#safe-object-and-property-path-handling)
- [Serialization and hashing](#serialization-and-hashing)
- [Dates and timezones](#dates-and-timezones)
- [Filters](#filters)
- [Browser utilities](#browser-utilities)
- [Pagination](#pagination)
- [UUID and number/URL validation](#uuid-and-numberurl-validation)
- [MaybeAsync without RxJS](#maybeasync-without-rxjs)
- [Typed errors](#typed-errors)
- [Migration from 1.1](#migration-from-11)
- [Development, validation, and release](#development-validation-and-release)
- [Security reporting](#security-reporting)

## Installation

```sh
npm install @sdcorejs/utils
```

After v1.2.0 is published, applications that want the v1.2 contract can pin the minor
range explicitly:

```sh
npm install @sdcorejs/utils@^1.2.0
```

The package includes its TypeScript declarations. Do not install `@types/sdcorejs__utils`.
RxJS is optional and is neither installed nor imported by this package.

## Quick start

The root entry point exposes the complete public surface. Page indexes are zero-based,
so page `0` is always the first page.

```ts
import {
  ArrayUtilities,
  ValidationUtilities,
  type PagingReq,
} from '@sdcorejs/utils';

interface User {
  id: number;
  email: string;
}

const request: PagingReq<User> = {
  pageNumber: 0,
  pageSize: 2,
};

const users: User[] = [
  { id: 1, email: 'ada@example.com' },
  { id: 2, email: 'grace@example.com' },
  { id: 3, email: 'linus@example.com' },
];

const firstPage = ArrayUtilities.paging(
  users,
  request.pageSize ?? 20,
  request.pageNumber ?? 0,
);
const emailsAreValid = firstPage.every(user =>
  ValidationUtilities.isEmail(user.email),
);

void [firstPage, emailsAreValid];
```

## Runtime support

Version 1.2 supports Node.js 20, 22, and 24 and modern browsers capable of
running ES2022 output.

| Feature family | Required runtime capability |
| --- | --- |
| Models, constants, arrays, objects, filters, dates, numbers, and validation | ES2022 JavaScript |
| AES-GCM, secure UUID generation, and SHA-256 | Web Crypto through `globalThis.crypto` |
| File picker and downloads | Browser DOM, `File`, `Blob`, and `URL` APIs |
| Clipboard writes | `navigator.clipboard` plus the browser's secure-context, permission, and user-gesture policies |

Missing Web Crypto support fails explicitly with `WebCryptoUnavailableError` or
`SecureRandomUnavailableError`; security-sensitive operations never fall back to weak
randomness or unauthenticated encryption.

RxJS is not installed or imported by this package. `MaybeAsync` uses a structural
`SubscribableLike<T>` contract, so an RxJS Observable remains compatible when an
application already uses RxJS.

## Exports

All entry points provide ESM, CommonJS, and condition-specific TypeScript declarations:

| Import path | Purpose |
| --- | --- |
| `@sdcorejs/utils` | Complete public surface for convenient named imports. |
| `@sdcorejs/utils/models` | Models, option types, paging/filter contracts, and dependency-free async contracts. |
| `@sdcorejs/utils/constants` | Shared constants, supported languages, validation patterns, and filter operator metadata. |
| `@sdcorejs/utils/fns` | Standalone functions and utility namespaces. |
| `@sdcorejs/utils/errors` | Public typed error hierarchy for narrow recovery and broad library-level handling. |

Only these package entry points are public contracts. Do not import files directly from
`dist/` or `src/`.

```ts
import { DateUtilities, type PagingReq } from '@sdcorejs/utils';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import { ValidationUtilities } from '@sdcorejs/utils/fns';
import type { PagingRes } from '@sdcorejs/utils/models';

const request: PagingReq<{ id: number }> = { pageNumber: 0, pageSize: 20 };
const response: PagingRes<{ id: number }> = { items: [{ id: 1 }], total: 1 };
const valid = ValidationUtilities.isEmail('user@example.com');

void [DateUtilities, EMPTY_STR, request, response, valid];
```

CommonJS consumers receive the matching `.cjs` implementation and `.d.cts`
declarations through conditional exports:

```js
const { DateUtilities, ValidationUtilities } = require('@sdcorejs/utils');
```

## API overview

The documentation site contains searchable per-symbol signatures, runtime notes,
security notes, and compiled examples. The tables below are a map of the primary
public surface rather than a replacement for the full API reference.

### Utility namespaces

| Namespace | Main responsibilities | Selected members |
| --- | --- | --- |
| `ArrayUtilities` | Array search, stable set operations, safe record construction, and zero-based slicing. | `search`, `union`, `toObject`, `distinct`, `paging` |
| `BrowserUtilities` | File selection, safe downloads, clipboard writes, mobile hints, and bounded legacy private-mode detection. | `upload`, `download`, `downloadBlob`, `copyToClipboard`, `isMobile`, `detectIncognito` |
| `ColorUtilities` | Color conversion. | `hslToHex`, `rgbToHex` |
| `DateUtilities` | Strict parsing, formatting, calendar/elapsed arithmetic, month handling, and completed age/year calculations. | `parseLocalDateStrict`, `parseLocalDateTimeStrict`, `parseInstant`, `calendarDayDifference`, `elapsedDayDifference`, `addMonths`, `completedAge` |
| `FilterUtilities` | Filter validation, client-side evaluation, relative-date operands, and explicit timestamp conversion. | `validateFilter`, `evaluateFilter`, `match`, `resolveData`, `resolveRelativeDate`, `toEpoch` |
| `NumberUtilities` | Vietnamese/ISO formatting, rounding, strict numeric checks, and finite-number parsing. | `toVNCurrency`, `toVN`, `toISO`, `round`, `isFiniteNumber`, `isNumericString`, `parseFiniteNumber` |
| `ObjectUtilities` | Safe traversal, cloning/merging, query parsing, deterministic serialization, and hashing. | `getNestedValue`, `clone`, `merge`, `deepMerge`, `stableStringify`, `canonicalStringify`, `hash32`, `sha256Canonical` |
| `StringUtilities` | Validation regexes, Vietnamese aliases, templates, legacy obfuscation, AES-GCM, and string SHA-256. | `changeAliasLowerCase`, `format`, `parseExpression`, `obfuscate`, `encryptAesGcm`, `decryptAesGcm`, `sha256` |
| `Utilities` | General-purpose pagination, IDs, serialization, query parsing, traversal, cloning, and merging. | `fetchAllByPaging`, `randomId`, `generateUuid`, `parseQueryParams`, `getNestedValue`, `clone`, `deepMerge` |
| `ValidationUtilities` | Email/phone/identity/time/domain/IP/URL/UUID/code checks and strict numeric policies. | `validate`, `isEmail`, `isUrl`, `isUuid`, `isUuidV4`, `hasImageFileExtension`, `isFiniteNumber`, `isNumericString` |

### Standalone functions and contracts

| Family | Important exports |
| --- | --- |
| Pagination | `fetchAllByPaging`, `FetchAllByPagingOptions`, `PagingReq<T>`, `PagingRes<T>` |
| Serialization | `stableStringify`, `canonicalStringify`, `hash32`, `sha256Canonical`, `sha256Blob` |
| Filters | `Filter<T>`, `ValidatedFilter<T>`, `MatchOptions<T>`, `validateFilter`, `evaluateFilter` |
| Async interop | `MaybeAsync<T>`, `SubscribableLike<T>`, `resolveMaybeAsync`, `normalizeSubscribable` |
| Query models | `QueryReq<T>`, `Order<T>`, `NestedKeyOf<T>` |
| Shared UI models | `Size`, `Color`, `Language`, `MaterialIconFontSet`, `MaterialSymbolFontSet` |
| Constants | `EMPTY_STR`, `SUPPORTED_LANGUAGES`, `OPERATORS`, `VALIDATION_PATTERNS` |

Prefer focused subpath imports when they make an application's dependency boundary
clear. Prefer the root entry point when convenience and discoverability matter more;
both forms are supported and tree-shakeable.

## Encryption and legacy obfuscation

`StringUtilities.encrypt` and `decrypt` retain the v1.1.x wire format only for
compatibility. They are deprecated aliases for reversible obfuscation: they provide no
confidentiality, integrity, or authentication. Never use them for secrets, tokens,
authorization state, signed state, PII protection, or any other security boundary. Use
the accurately named `obfuscate` and `deobfuscate` only when legacy-format compatibility
is required.

Use AES-GCM for authenticated encryption. Every encryption uses a fresh 96-bit IV, raw
keys must be 16, 24, or 32 bytes, and tokens use the versioned
`sdcore.aesgcm.v1.<base64url-envelope>` format. A password string is not a key; derive
key material with a reviewed password-based scheme outside this library when needed.

```ts
import { StringUtilities } from '@sdcorejs/utils/fns';

const key = crypto.getRandomValues(new Uint8Array(32));
const token = await StringUtilities.encryptAesGcm(
  { userId: 42 },
  key,
  { additionalData: 'tenant:example' },
);
const value = await StringUtilities.decryptAesGcm<{ userId: number }>(
  token,
  key,
  { additionalData: 'tenant:example' },
);

void value;
```

Do not silently pass legacy `encrypt` output to `decryptAesGcm`; the formats are
intentionally distinct. Authentication failures throw `EncryptionAuthenticationError`,
while malformed or unsupported tokens throw `EncryptionFormatError`.

## Safe object and property-path handling

Object builders and path-based helpers reject `__proto__`, `prototype`, and
`constructor` with typed errors. Paths read own data properties only and skip accessors
by default. Dot paths, numeric brackets, and quoted brackets are supported with a
bounded depth. This protects utility output from prototype replacement, but it does not
replace application authorization or schema validation.

`clone` preserves cycles through an internal `WeakMap`, deep-clones arrays, plain
objects, and null-prototype objects, and sanitizes custom-prototype records into safe
own-property records. For v1.x compatibility, `Date`, `Map`, `Set`, functions, and class
instances remain leaf references. `merge`/`deepMerge` recursively merge record-like
objects; arrays and other non-plain values replace the default, `undefined` inherits the
default, and `null` overrides it. Clone/merge depth is bounded and configurable.

```ts
import { ObjectUtilities, UnsafePropertyPathError } from '@sdcorejs/utils';

const record = Object.create(null) as { profile?: { name?: string } };
record.profile = { name: 'Ada' };
const name = ObjectUtilities.getNestedValue(record, 'profile.name');

try {
  ObjectUtilities.getNestedValue(record, 'constructor.prototype');
} catch (error: unknown) {
  if (!(error instanceof UnsafePropertyPathError)) throw error;
}

void name;
```

## Serialization and hashing

`stableStringify` is deterministic for its documented JSON-compatible domain (plus
valid `Date` values). It sorts plain-object keys and rejects unsupported values, sparse
arrays, accessors, class instances, and cycles with typed errors.

`canonicalStringify` adds tagged encodings for `undefined`, non-finite numbers,
negative zero, `BigInt`, `Date`, `RegExp`, `Map`, `Set`, `ArrayBuffer`, typed arrays, and
sparse-array holes. It rejects functions, symbols, Blob/File metadata-only encoding,
arbitrary class instances, accessors, and cycles.

`hash32` is a fast, collision-prone, non-cryptographic compatibility hash. It is not
suitable for signatures, authentication, or persistent identity derived from untrusted
input. `sha256Canonical` hashes the canonical UTF-8 representation and returns lowercase
hex. `sha256Blob` hashes actual Blob/File bytes.

```ts
import { canonicalStringify, hash32, sha256Canonical } from '@sdcorejs/utils/fns';

const canonical = canonicalStringify(new Map([['role', 'admin']]));
const quickBucket = hash32({ b: 2, a: 1 });
const digest = await sha256Canonical({ a: 1, b: 2 });

void [canonical, quickBucket, digest];
```

## Dates and timezones

Use explicit APIs to separate local calendar dates, local date-times, and instants:

- `parseLocalDateStrict` validates a calendar date without a UTC date-only shift.
- `parseLocalDateTimeStrict` validates a local wall-clock value.
- `parseInstant` accepts ISO instants with `Z` or an explicit offset.
- `calendarDayDifference` compares calendar days and is stable across DST.
- `elapsedDayDifference` measures elapsed 24-hour units.
- `completedAge` and `completedYearDifference` return completed calendar years; a
  February 29 anniversary is February 28 in a non-leap year.
- `addMonths` defaults to constrained end-of-month behavior and also supports
  `overflow: 'balance' | 'reject'`.

The older permissive helpers remain available where safe. `dayDiff`, `yearDiff`, `age`,
and misspelled `addMiliseconds` are deprecated because their names or semantics are
ambiguous.

```ts
import { DateUtilities } from '@sdcorejs/utils/fns';

const birthday = DateUtilities.parseLocalDateStrict('2000-06-20');
const instant = DateUtilities.parseInstant('2026-07-20T09:30:00+07:00');
const days = DateUtilities.calendarDayDifference('2026-03-08', '2026-03-09');
const age = DateUtilities.completedAge(birthday, '2026-06-20');

void [instant, days, age];
```

## Filters

The supported comparison operators are `EQUAL`, `NOT_EQUAL`, `CONTAIN`,
`NOT_CONTAIN`, `IN`, `NOT_IN`, `START_WITH`, `NOT_START_WITH`, `END_WITH`,
`NOT_END_WITH`, `GREATER_THAN`, `LESS_THAN`, `GREATER_OR_EQUAL`, `LESS_OR_EQUAL`,
`BETWEEN`, `NULL`, and `NOT_NULL`. Logical groups use `AND` or `OR`.

`validateFilter` checks the complete shape, operand types, safe paths, recursion depth,
cycles, and ordered `BETWEEN` bounds. `evaluateFilter` validates then evaluates.
Malformed filters throw `FilterValidationError`; valid filters with invalid entity data
deterministically do not match. Numeric dates require an explicit `seconds` or
`milliseconds` unit. The deprecated `legacyTimestampInference` option exists only for
controlled migration.

Client-side filtering is a presentation/query convenience, never an authorization
boundary. Enforce access control on the trusted server.

```ts
import { FilterUtilities, type Filter } from '@sdcorejs/utils';

interface Product {
  name: string;
  price: number;
}

const filter: Filter<Product> = {
  field: 'price',
  operator: 'BETWEEN',
  data: { from: 100, to: 500 },
};
const validated = FilterUtilities.validateFilter<Product>(filter, {
  fieldTypes: { price: 'number' },
});
const matches = FilterUtilities.evaluateFilter(
  { name: 'Phone', price: 299 },
  validated,
  { fieldTypes: { price: 'number' } },
);

void matches;
```

## Browser utilities

`BrowserUtilities.upload` creates an isolated input for each call, cleans up listeners
and nodes, rejects cancellation with `FilePickerCancelledError`, and supports both the
legacy filename validator and a full-`File` validator. Extension, MIME, size, and other
client-side checks are user-experience validation only; validate content again on a
trusted server.

Downloads allow `http:`, `https:`, `blob:`, and same-origin relative URLs by default.
`data:` and additional protocols require explicit options; active or malformed schemes
throw `UnsafeUrlProtocolError`. Object URLs are revoked. `copyToClipboard` now returns
`Promise<void>` and propagates permission errors. `detectIncognito` remains deprecated:
private-mode detection is an unreliable, bounded heuristic and must not control security.

```ts
import { BrowserUtilities } from '@sdcorejs/utils/fns';

async function chooseTextFile(): Promise<File> {
  return BrowserUtilities.upload({
    accept: 'text/plain',
    extensions: ['txt'],
    maxSizeInMb: 2,
    fileValidator: file => file.type === 'text/plain' ? undefined : 'Expected text/plain',
  });
}

async function copyIdentifier(): Promise<void> {
  await BrowserUtilities.copyToClipboard('item-42');
}

void [chooseTextFile, copyIdentifier];
```

## Pagination

Paging is strictly zero-based: page `0` is the first page. `ArrayUtilities.paging` takes
`(items, pageSize, page?)` with no paging-options argument. `fetchAllByPaging` always
calls its transport callback with page `0` first and then increments consecutively.
Its options are limited to `maxPages`, `signal`, and `totalChangePolicy`.

`fetchAllByPaging` validates every response, accumulates linearly, detects empty-page
no-progress and changing totals, supports aborting, and enforces `maxPages`. Duplicate
values are preserved because equal payloads on different offsets may be legitimate.
Its optional signal races an in-flight page and is forwarded as the callback's third
argument so a transport such as `fetch` can cancel its own request.

```ts
import { fetchAllByPaging } from '@sdcorejs/utils/fns';

const rows = [1, 2, 3, 4, 5];
const all = await fetchAllByPaging(
  async (pageSize, pageNumber) => ({
    items: rows.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize),
    total: rows.length,
  }),
  2,
  { maxPages: 10 },
);

void all;
```

If a remote service is one-based, adapt only at the transport boundary. The helper and
the rest of the application remain zero-based:

```ts
import { fetchAllByPaging } from '@sdcorejs/utils/fns';

const allFromOneBasedService = await fetchAllByPaging(
  async (pageSize, pageNumber, signal) => {
    const response = await fetch(
      `/api/items?page=${pageNumber + 1}&pageSize=${pageSize}`,
      { signal },
    );
    return response.json() as Promise<{ items: number[]; total: number }>;
  },
  100,
);

void allFromOneBasedService;
```

## UUID and number/URL validation

`generateUuid` returns an RFC-compatible lowercase UUID v4 using
`crypto.randomUUID()` or `crypto.getRandomValues()`. It throws
`SecureRandomUnavailableError` rather than falling back to `Math.random`.
`randomId` is a separate, non-cryptographic convenience identifier.

Use `isFiniteNumber`, `isNumericString`, and `parseFiniteNumber` for explicit number
semantics. URL validation parses URLs and supports protocol, relative-path, credential,
and hostname policies. Relative mode constrains paths to the configured base origin and
rejects cross-origin network-path/backslash references; it is not an SSRF or redirect
policy. `hasImageFileExtension` checks only a filename/URL extension; it does not verify
remote content or file safety.

`ValidationUtilities.isUuid()` validates generic UUID syntax and can optionally enforce
a requested version or RFC variant. Use `ValidationUtilities.isUuidV4()` when the
contract specifically requires an RFC-compatible version-4 UUID.

```ts
import { Utilities, ValidationUtilities } from '@sdcorejs/utils/fns';

const id = Utilities.generateUuid();
const isUuid = ValidationUtilities.isUuid(id);
const isV4 = ValidationUtilities.isUuidV4(id);
const isDocumentationUrl = ValidationUtilities.isUrl('/guide/start', {
  allowRelative: true,
});

void [isUuid, isV4, isDocumentationUrl];
```

## MaybeAsync without RxJS

`resolveMaybeAsync` accepts a value, any realm-independent `PromiseLike`, or a validated
structural subscribable. It resolves the first emission and runs subscription cleanup;
errors reject, and completion without an emission rejects with
`EmptySubscribableError`. `normalizeSubscribable` provides the same small structural
contract. An existing subscribable is returned unchanged with its concrete type, so an
RxJS Observable input retains `.pipe()`; plain values and promises do not gain RxJS
operators. The legacy `normalizeAsync` name remains deprecated.

```ts
import {
  resolveMaybeAsync,
  type SubscribableLike,
  type SubscriptionLike,
} from '@sdcorejs/utils/models';

const source: SubscribableLike<number> = {
  subscribe(observer): SubscriptionLike {
    if (typeof observer === 'function') observer(42);
    else observer?.next?.(42);
    return { unsubscribe() {} };
  },
};

const answer = await resolveMaybeAsync(source);
void answer;
```

## Typed errors

All intentional library errors extend `SdcoreUtilsError`. Catch the narrowest error
when the application can recover, or catch the base class at a package boundary for
consistent reporting. The public error brand preserves `instanceof` checks across
independently bundled public entry points.

| Error family | Errors | Typical boundary |
| --- | --- | --- |
| `SecurityError` | `UnsafeObjectKeyError`, `UnsafePropertyPathError`, `WebCryptoUnavailableError`, `SecureRandomUnavailableError`, `EncryptionAuthenticationError`, `UnsafeUrlProtocolError` | Rejected unsafe input, unavailable secure capabilities, or failed authentication. |
| `ValidationError` | `CircularReferenceError`, `EncryptionFormatError`, `FilterValidationError`, `DateParseError`, `PagingResponseError`, `PagingLimitError`, `FilePickerCancelledError`, `EmptySubscribableError` | Invalid caller input, malformed remote data, cancellation, or a non-terminating operation. |
| `SerializationError` | `UnsupportedSerializationTypeError` | A value lies outside the selected serializer's documented domain. |

```ts
import {
  PagingLimitError,
  PagingResponseError,
  SdcoreUtilsError,
  fetchAllByPaging,
} from '@sdcorejs/utils';

async function loadPage(pageSize: number, pageNumber: number) {
  const response = await fetch(
    `/api/items?page=${pageNumber}&pageSize=${pageSize}`,
  );
  return response.json() as Promise<{ items: unknown[]; total: number }>;
}

try {
  await fetchAllByPaging(loadPage, 100, { maxPages: 50 });
} catch (error: unknown) {
  if (error instanceof PagingLimitError) {
    console.error('The endpoint exceeded the configured page limit.');
  } else if (error instanceof PagingResponseError) {
    console.error('The endpoint returned an invalid page.');
  } else if (error instanceof SdcoreUtilsError) {
    console.error(error.message);
  } else {
    throw error;
  }
}
```

## Migration from 1.1

Version 1.2 preserves supported package entry points and legacy payload compatibility,
but intentionally rejects several unsafe or ambiguous behaviors. Review the complete
[migration guide](./MIGRATION-1.2.md) and [release notes](./RELEASE_NOTES-1.2.0.md)
before upgrading.

Important integration changes:

- Pagination is strictly zero-based. `ArrayUtilities.paging` defaults to page `0`, and
  `fetchAllByPaging` always requests page `0` first. `pageBase` and `initialPage` are not
  public options.
- One-based services must translate `pageNumber + 1` only inside their transport
  callback.
- Unsafe object keys and paths now throw typed errors instead of being traversed or
  copied.
- Strict serializers reject unsupported values, accessors, cycles, and malformed sparse
  JSON arrays instead of producing ambiguous output.
- Malformed filters throw `FilterValidationError`; invalid entity values are deterministic
  non-matches. Numeric timestamps require an explicit unit.
- `copyToClipboard` now returns `Promise<void>` and exposes permission failures.
- Secure UUID, AES-GCM, and SHA-256 operations require Web Crypto and never use an
  insecure fallback.
- RxJS is no longer a runtime, peer, or declaration dependency. Existing Observables
  remain structurally compatible.

### Deprecated API map

| Deprecated API | Preferred replacement | Migration note |
| --- | --- | --- |
| `encrypt` / `decrypt` | `obfuscate` / `deobfuscate`, or AES-GCM APIs | Legacy bytes remain compatible, but legacy obfuscation is not encryption. AES-GCM tokens use a different format. |
| `hash` | `hash32` or `sha256Canonical` | `hash32` is collision-prone and non-cryptographic. |
| `dayDiff` | `calendarDayDifference` or `elapsedDayDifference` | Choose calendar boundaries or elapsed 24-hour units explicitly. |
| `yearDiff` | `completedYearDifference` | Completed-year semantics differ at anniversary boundaries. |
| `age` | `completedAge` or `decimalYearDifference` | Choose completed birthdays or a decimal result explicitly. |
| `addMiliseconds` | `addMilliseconds` | The corrected API adds exact elapsed milliseconds and can differ across DST changes. |
| `ValidationUtilities.isImageUrl` | `hasImageFileExtension` plus `isUrl` when required | File extensions do not prove content type or safety. |
| Broad `isNumber` wrappers | `isFiniteNumber`, `isNumericString`, or `parseFiniteNumber` | The replacement APIs make coercion and syntax policies explicit. |
| `normalizeAsync` | `normalizeSubscribable` | Plain values/promises receive the structural contract, not RxJS operators. |
| `detectIncognito` | No replacement | Private-mode detection is unreliable and must not drive security decisions. |
| `legacyTimestampInference` | Explicit `seconds` or `milliseconds` units | Keep the heuristic only as a temporary controlled migration option. |

## Development, validation, and release

Use the repository lockfile and Node.js 20, 22, or 24 for local work:

```sh
npm ci
npm run validate:all
```

| Command | Purpose |
| --- | --- |
| `npm test` | Run the library test suite once. |
| `npm run test:coverage` | Run tests with the configured statement, branch, function, and line coverage floors. |
| `npm run typecheck` | Type-check source and tests without emitting files. |
| `npm run build` | Build ESM, CommonJS, and declaration outputs. |
| `npm run validate:package` | Run publint, Are the Types Wrong, and packed-package runtime/type/browser/example checks. |
| `npm run validate` | Run root typecheck, coverage, build, and package validation. |
| `npm run validate:site` | Validate the bilingual documentation application. |
| `npm run validate:all` | Run both root package and documentation-site validation. |

CI validates Node.js 20, 22, and 24, plus date behavior in UTC,
Asia/Bangkok, America/New_York, and Europe/Berlin. It also validates the generated npm
tarball as ESM, CommonJS, TypeScript, browser, RxJS, and no-RxJS consumers.

### Release flow

Releases use Changesets; contributors should not manually edit the package version.

1. A feature or fix includes an appropriate file under `.changeset/`.
2. After the feature PR is reviewed and merged into `main`, the release workflow runs
   the full CI workflow.
3. Changesets creates or updates a separate release PR containing the version and
   changelog changes.
4. Merging that release PR publishes the package and creates the corresponding release
   metadata when npm credentials are configured.
5. Every successful push to `main` also validates and deploys the documentation site.

This separation means merging a feature PR does not directly edit `package.json` to
`1.2.0`; the version change remains reviewable in the Changesets release PR.

## Security reporting

Do not open a public issue for a suspected vulnerability. Use GitHub's private
[Report a vulnerability](https://github.com/sdcorejs/sdcorejs-utils/security/advisories/new)
flow and include the affected version, runtime, import path, minimal reproduction,
expected impact, and known mitigations. Never include real secrets or personal data.

Read [SECURITY.md](./SECURITY.md) for supported releases, cryptographic responsibilities,
object-key guarantees, dependency posture, and APIs that must not be treated as security
controls.

## License

[MIT](./LICENSE) © SDCoreJS contributors.
