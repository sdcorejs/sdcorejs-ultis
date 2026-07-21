# @sdcorejs/utils — Design Spec

> [!IMPORTANT]
> This is a historical design snapshot, not current API documentation.
> For v1.2.0 behavior, use [README](../../../README.md) and [migration guidance](../../../MIGRATION-1.2.md).

**Date:** 2026-05-20
**Status:** Approved

## Overview

`@sdcorejs/utils` là pure TypeScript utility library (framework-agnostic), tách từ `@vn-angular/` (`projects/sd-angular/utilities/` và `projects/sd-angular/models/`). Publish lên npm dưới scope `@sdcorejs/utils`, CI/CD qua GitHub Actions khi merge vào `main`.

## Package

- **Name:** `@sdcorejs/utils`
- **Type:** Pure TypeScript — không phụ thuộc Angular hay bất kỳ framework nào
- **Build tool:** tsup (ESM + CJS + `.d.ts`)
- **Node:** 20+

## Folder Structure

```
sdcorejs-ultis/
├── src/
│   ├── models/       ← interfaces + types thuần
│   │   └── index.ts
│   ├── constants/    ← export const values
│   │   └── index.ts
│   ├── fns/          ← functions + utility objects
│   │   └── index.ts
│   └── index.ts      ← re-export tất cả (barrel)
├── dist/             ← build output (gitignored)
├── docs/
├── .github/
│   └── workflows/
│       └── publish.yml
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## Subpath Exports

```ts
import { PagingModel, FilterModel } from '@sdcorejs/utils/models'
import { SD_EMPTY_STR, SdOperators, SUPPORTED_LANGUAGES } from '@sdcorejs/utils/constants'
import { ArrayUtilities, StringUtilities, hslToHex, detectIncognito } from '@sdcorejs/utils/fns'
// hoặc import tất cả
import { PagingModel, SD_EMPTY_STR, ArrayUtilities } from '@sdcorejs/utils'
```

## `package.json#exports`

```json
{
  "exports": {
    ".":           { "import": "./dist/index.mjs",     "require": "./dist/index.js",     "types": "./dist/index.d.ts" },
    "./models":    { "import": "./dist/models.mjs",    "require": "./dist/models.js",    "types": "./dist/models.d.ts" },
    "./constants": { "import": "./dist/constants.mjs", "require": "./dist/constants.js", "types": "./dist/constants.d.ts" },
    "./fns":       { "import": "./dist/fns.mjs",       "require": "./dist/fns.js",       "types": "./dist/fns.d.ts" }
  }
}
```

## Migration Mapping

| Source (`projects/sd-angular/`) | Destination (`src/`) | Ghi chú |
|---|---|---|
| `utilities/models/src/paging.model.ts` | `models/` | |
| `utilities/models/src/filter.model.ts` | `models/` | |
| `utilities/models/src/order.model.ts` | `models/` | |
| `utilities/models/src/size.model.ts` | `models/` | |
| `utilities/models/src/color.model.ts` | `models/` | |
| `utilities/models/src/maybe-async.model.ts` | `models/` | |
| `utilities/models/src/nested-key-of.model.ts` | `models/` | |
| `utilities/models/src/pattern.model.ts` | split: type→`models/`, const→`constants/` | |
| `utilities/models/src/operator.model.ts` | split: type→`models/`, const→`constants/` | |
| `utilities/models/src/empty.model.ts` | `constants/` | `SD_EMPTY_STR` |
| `utilities/models/src/icon.model.ts` | split: type→`models/`, const→`constants/` | |
| `models/src/language.model.ts` | split: type→`models/`, const→`constants/` | |
| `utilities/extensions/src/array.extension.ts` | `fns/` | |
| `utilities/extensions/src/string.extension.ts` | `fns/` | |
| `utilities/extensions/src/date.extension.ts` | `fns/` | |
| `utilities/extensions/src/number.extension.ts` | `fns/` | |
| `utilities/extensions/src/color.extension.ts` | `fns/` | |
| `utilities/extensions/src/utility.extension.ts` | `fns/` | |
| `utilities/extensions/src/detect-incognito.ts` | `fns/` | |
| `utilities/models/src/unwrap-signal.model.ts` | **skip** | phụ thuộc `@angular/core` |

## GitHub Actions — publish.yml

Trigger: push vào `main`. Steps: checkout → setup-node (registry npmjs) → `npm ci` → `npm run build` → `npm publish --access public`.

Requires secret: `NPM_TOKEN` trong GitHub repo settings.

## Branching

- Default branch: `main`
- First release branch: `release/1.0.0`
- Version trong `package.json`: `1.0.0`
