# Changelog

## 1.2.0

### Minor Changes

- c57ad52: Ship the v1.2.0 production-foundation refactor in one release: add safe object/path
  handling and typed errors, authenticated AES-GCM APIs, deterministic canonical
  serialization and SHA-256, strict date/filter/number/URL contracts, terminating
  page-0-first pagination with a strictly zero-based contract, secure UUID v4 generation,
  hardened browser workflows, and a dependency-free structural `MaybeAsync` contract.
  Preserve legacy import paths and
  obfuscation payloads through documented deprecated wrappers while rejecting previously
  accepted unsafe or malformed inputs. One-based services adapt `pageNumber + 1` only in
  their transport callback; no paging-base compatibility options are public. Strengthen
  ESM/CommonJS declarations, packed consumer validation, coverage, multi-timezone tests,
  CI, security guidance, and the v1.2 migration path.

## 1.1.4

### Patch Changes

- Add `ObjectUtilities` with plain-object detection, deep clone, deep merge, and multi-source deep merge helpers. Update the docs site with interactive ObjectUtilities demos.

## 1.1.3

### Patch Changes

- 0c4c4a9: Add `FilterUtilities.match(filters, entity, options?)` for client-side evaluation of the `Filter` model against in-memory objects.

  Filter model gains a `dataType` discriminator (sibling of `data`, default `'absolute'`):

  - `'field'` — compare two fields on the same entity (`data: NestedKeyOf<T>`)
  - `'date-today'` — operand is the start of today (`data: 'TODAY'`)
  - `'date-relative'` — operand is a `DateRelative` (`{ amount, direction: 'previous' | 'next', unit: 'hour' | 'day' | 'week' | 'month' }`)

  New exports: `FilterDataType`, `DateRelative`, `FilterLiteral`, `FilterFieldType`, `MatchOptions<T>`, and `FilterUtilities` (`match`, `evaluate`, `relativeDate`, `isDateRelative`, `toEpoch`, `resolveData`, `resolveRelativeDate`).

  Type-aware coercion handles dates returned as `Date`, ISO strings, or numeric (ms/seconds) timestamps; pass `options.fieldTypes` when the caller knows the declared types for exact comparison.

## 1.1.2

### Patch Changes

- 0793771: Thêm operator `BETWEEN` (kèm icon SVG) vào `OPERATORS`.

## 1.1.1

### Patch Changes

- 7a81260: Thay `symbol` bằng `icon` (SVG path) trong `OPERATORS` để render biểu tượng toán tử trực tiếp.

## 1.1.0

### Minor Changes

- Add `NOT_START_WITH` and `NOT_END_WITH` operators to `OperatorHasData` union and `OPERATORS` UI metadata list. Fills a gap when building filter UIs that need negated prefix/suffix matching. Replaces the legacy typo `NOT_END_WIDTH` from `be-masterdata/core-be` with the correctly-spelled `NOT_END_WITH` — consumers migrating from `core-be` rename `NOT_END_WIDTH` → `NOT_END_WITH` at the call site.

All notable changes to `@sdcorejs/utils` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.3] — 2026-05-20

### Changed

- Repository renamed from `sdcorejs-ultis` to `sdcorejs-utils`
- Updated `homepage`, `repository.url`, `bugs.url` in `package.json`
- Updated GitHub Pages base URL to `/sdcorejs-utils/`
- Updated all internal links to reflect new repo name

---

## [1.0.2] — 2026-05-20

### Changed (breaking — rename)

- `models`: `PatternType` → `ValidationPatternType`, `PatternCommon` → `ValidationPattern`
- `models`: `ValidationPattern.regex` field renamed to `pattern` (aligns with Angular `Validators.pattern()`)
- `models`: `ValidationPatternType` members renamed — `PHONE_VN` → `VN_PHONE`, `IDVN` → `VN_ID`, `IDVN_OR_PASSPORT` → `VN_ID_OR_PASSPORT`
- `fns`: `StringUtilities.REGEX_PHONE_VN` → `REGEX_VN_PHONE`, `REGEX_IDVN` → `REGEX_VN_ID`, `REGEX_IDVN_OR_PASSPORT` → `REGEX_VN_ID_OR_PASSPORT`
- `constants`: `PATTERN_COMMONS` → `VALIDATION_PATTERNS`

### Added

- `models`: 15 new `ValidationPatternType` members — `URL`, `DOMAIN`, `IPV4`, `IPV6`, `IMAGE_URL`, `SLUG`, `NUMBER`, `INTEGER`, `DECIMAL`, `POSITIVE_NUMBER`, `UUID`, `CODE_16`, `CODE_32`, `HEX_COLOR`, `BASE64`
- `fns`: 15 new `StringUtilities` regex constants — `REGEX_URL`, `REGEX_DOMAIN`, `REGEX_IPV4`, `REGEX_IPV6`, `REGEX_IMAGE_URL`, `REGEX_SLUG`, `REGEX_NUMBER`, `REGEX_INTEGER`, `REGEX_DECIMAL`, `REGEX_POSITIVE_NUMBER`, `REGEX_UUID`, `REGEX_CODE_16`, `REGEX_CODE_32`, `REGEX_HEX_COLOR`, `REGEX_BASE64`
- `constants`: `VALIDATION_PATTERNS` now covers all 22 pattern types
- Tests: 78 new tests for renamed and new regex patterns (total 468)

---

## [1.0.1] — 2026-05-20

### Changed

- `fns`: extracted `ColorUtilities` (`hslToHex`, `rgbToHex`) and `BrowserUtilities` from the old `Utilities` namespace
- `BrowserUtilities` uses `detectIncognito` (full cross-browser detection returning `{ isPrivate, browserName }`) instead of the simpler `isIncognito`
- `Utilities.allWithPaging` renamed to `fetchAllByPaging`
- `Utilities` now contains only general-purpose helpers: `fetchAllByPaging`, `randomId`, `hash`, `parseQueryParams`, `generateUuid`, `getNestedValue`
- Removed `Utilities.changeAliasLowerCase` (duplicate of `StringUtilities.changeAliasLowerCase`)
- Removed `Utilities.isIncognito` (replaced by `BrowserUtilities.detectIncognito`)
- Added `MaterialSymbolFontSet` type and `DEFAULT_MATERIAL_SYMBOL_FONT_SET` constant
- Added `SD_LANGUAGE_STORAGE_KEY` and `IPIFY_API_URL` constants (previously hardcoded strings)

---

## [1.0.0] — 2026-05-20

Initial release. Pure TypeScript utility library extracted from `@vn-angular/` (`projects/sd-angular/utilities/` and `projects/sd-angular/models/`).

### Added

**`@sdcorejs/utils/models`**

- `Filter<T>`, `FilterHasData<T>`, `FilterBetween<T>`, `FilterNoData<T>`, `FilterAndOr<T>`
- `Order<T>`, `QueryReq<T>`, `PagingReq<T>`, `PagingRes<T>`
- `NestedKeyOf<T>` — recursive dot-path type, depth-limited to 4 levels
- `Operator`, `OperatorHasData`, `OperatorNoData`
- `PatternType`, `PatternCommon`
- `MaybeAsync<T>`, `resolveMaybeAsync<T>()`, `normalizeAsync<T>()`
- `Size`, `Color`, `Language`, `MaterialIconFontSet`

**`@sdcorejs/utils/constants`**

- `EMPTY_STR` — default placeholder for empty display values (`'--'`)
- `OPERATORS` — lookup table for all 14 filter operators
- `PATTERN_COMMONS` — built-in validator definitions (email, phone, CCCD, passport, time)
- `SUPPORTED_LANGUAGES` — `['vi', 'en', 'ja', 'ko', 'zh']`
- `DEFAULT_MATERIAL_ICON_FONT_SET` — `'material-icons-outlined'`
- `DEFAULT_MATERIAL_SYMBOL_FONT_SET` — `'material-symbols-outlined'`

**`@sdcorejs/utils/fns`**

- `StringUtilities` — regex constants, validators, Vietnamese diacritic normalization, template interpolation, encrypt/decrypt, `sha256`
- `ArrayUtilities` — search (diacritic-insensitive, tree-aware), union, toObject, distinct, paging
- `NumberUtilities` — VN/ISO formatters, isNumber, round
- `DateUtilities` — isDate, toFormat, parseFrom, arithmetic (add days/hours/months), diff, timeDifference
- `Utilities` — upload (file picker with validation), download, downloadBlob, clipboard, allWithPaging, isIncognito, isMobile, randomId, hash, parseQueryParams, getClientPublicIp, generateUuid, getNestedValue
- `hslToHex`, `rgbToHex` — colour conversion utilities
- `detectIncognito` — cross-browser private-mode detection

### Infrastructure

- Build: tsup — outputs ESM (`.js`), CJS (`.cjs`), type declarations (`.d.ts`) for each subpath entry
- Test: vitest, 29 tests
- CI/CD: GitHub Actions — publish to npm on merge to `main`
- Subpath exports: `@sdcorejs/utils`, `./models`, `./constants`, `./fns`
