# @sdcorejs/utils

Dependency-light TypeScript utilities for validation, dates, filters, browser workflows,
serialization, object handling, and common application models.

## Installation

```sh
npm install @sdcorejs/utils
```

Version 1.2 supports Node.js 20, 22, and 24 and modern browsers with ES2022 support.
Authenticated encryption, secure UUID fallback, and SHA-256 require Web Crypto. Browser
file, download, and clipboard helpers additionally require their corresponding DOM APIs.
Missing Web Crypto support fails explicitly with `WebCryptoUnavailableError` or
`SecureRandomUnavailableError`; security-sensitive operations never fall back to weak
randomness or an unauthenticated implementation.

RxJS is not installed or imported by this package. `MaybeAsync` uses a structural
`SubscribableLike<T>` contract, so an RxJS Observable remains compatible when an
application already uses RxJS.

## Exports

All entry points provide ESM, CommonJS, and TypeScript declarations:

- `@sdcorejs/utils` — complete public surface
- `@sdcorejs/utils/models` — models and dependency-free async contracts
- `@sdcorejs/utils/constants` — constants and operator metadata
- `@sdcorejs/utils/fns` — functions and utility namespaces
- `@sdcorejs/utils/errors` — public error hierarchy

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

## Validation, build, and release

```sh
npm ci
npm run validate
```

`npm run validate` performs strict typechecking, tests with coverage thresholds, the
ESM/CJS build, publint, Are the Types Wrong, packed-package runtime/declaration/browser
smoke tests, and README/example compilation. Date tests also run in UTC,
Asia/Bangkok, America/New_York, and Europe/Berlin in CI.

Releases use Changesets. See [MIGRATION-1.2.md](./MIGRATION-1.2.md) before upgrading and
[SECURITY.md](./SECURITY.md) for security boundaries and reporting.

## License

MIT © SDCoreJS contributors.
