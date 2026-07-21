# @sdcorejs/utils Implementation Plan

> [!IMPORTANT]
> This is a historical implementation snapshot, not current API documentation.
> For v1.2.0 behavior, use [README](../../../README.md) and [migration guidance](../../../MIGRATION-1.2.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo pure TypeScript library `@sdcorejs/utils` với subpath exports `./models`, `./constants`, `./fns`, build bằng tsup, publish lên npm qua GitHub Actions khi merge vào `main`.

**Architecture:** Repo `sdcorejs-ultis/` đã tồn tại (chỉ có LICENSE). Code được migrate từ `@vn-angular/` (projects/sd-angular/utilities/ và projects/sd-angular/models/). Không có dependency Angular — chỉ có `rxjs` dùng trong `maybe-async` (peer dep). tsup build ra ESM + CJS + `.d.ts` với 4 entry points.

**Tech Stack:** TypeScript 5.7+, tsup, vitest, Node 20+, GitHub Actions, npm

---

### Task 1: Khởi tạo package.json và cấu hình TypeScript

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `.gitignore`
- Create: `.npmignore`

- [ ] **Step 1: Tạo package.json**

```json
{
  "name": "@sdcorejs/utils",
  "version": "1.0.0",
  "description": "Pure TypeScript utility library — models, constants, functions",
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./models": {
      "import": "./dist/models.mjs",
      "require": "./dist/models.js",
      "types": "./dist/models.d.ts"
    },
    "./constants": {
      "import": "./dist/constants.mjs",
      "require": "./dist/constants.js",
      "types": "./dist/constants.d.ts"
    },
    "./fns": {
      "import": "./dist/fns.mjs",
      "require": "./dist/fns.js",
      "types": "./dist/fns.d.ts"
    }
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "rxjs": ">=7.0.0"
  },
  "peerDependenciesMeta": {
    "rxjs": { "optional": true }
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "~5.7.2",
    "vitest": "^2.0.0"
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 2: Tạo tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Tạo tsconfig.build.json**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

- [ ] **Step 4: Tạo .gitignore**

```
node_modules/
dist/
*.tgz
.env
```

- [ ] **Step 5: Tạo .npmignore**

```
src/
*.spec.ts
*.test.ts
tsconfig*.json
tsup.config.ts
docs/
.github/
vitest.config.ts
```

- [ ] **Step 6: Cài dependencies**

```bash
npm install
```

Expected: `node_modules/` được tạo, không có error.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json tsconfig.build.json .gitignore .npmignore
git commit -m "chore: init package.json and TypeScript config"
```

---

### Task 2: Cấu hình tsup và vitest

**Files:**
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Tạo tsup.config.ts**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    models: 'src/models/index.ts',
    constants: 'src/constants/index.ts',
    fns: 'src/fns/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
});
```

- [ ] **Step 2: Tạo vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add tsup.config.ts vitest.config.ts
git commit -m "chore: add tsup build config and vitest"
```

---

### Task 3: Tạo src/models/ — interfaces và types thuần

**Files:**
- Create: `src/models/nested-key-of.model.ts`
- Create: `src/models/filter.model.ts`
- Create: `src/models/order.model.ts`
- Create: `src/models/paging.model.ts`
- Create: `src/models/operator.model.ts`
- Create: `src/models/size.model.ts`
- Create: `src/models/color.model.ts`
- Create: `src/models/maybe-async.model.ts`
- Create: `src/models/icon.model.ts`
- Create: `src/models/pattern.model.ts`
- Create: `src/models/language.model.ts`
- Create: `src/models/index.ts`

- [ ] **Step 1: Tạo src/models/nested-key-of.model.ts**

```ts
type Primitive = string | number | boolean | null | undefined | Date | Function;

export type SdNestedKeyOf<ObjectType, Depth extends number[] = []> = Depth['length'] extends 4
  ? never
  : ObjectType extends object
    ? {
        [Key in keyof ObjectType & string]: ObjectType[Key] extends Primitive
          ? Key
          : ObjectType[Key] extends Array<any>
            ? Key
            : ObjectType[Key] extends object
              ? Key | `${Key}.${SdNestedKeyOf<ObjectType[Key], [...Depth, 1]>}`
              : Key;
      }[keyof ObjectType & string]
    : string;
```

- [ ] **Step 2: Tạo src/models/operator.model.ts** (chỉ types — const sang constants/)

```ts
export type SdOperator = SdOperatorHasData | SdOperatorNoData;

export type SdOperatorHasData =
  | 'EQUAL'
  | 'NOT_EQUAL'
  | 'CONTAIN'
  | 'NOT_CONTAIN'
  | 'IN'
  | 'NOT_IN'
  | 'START_WITH'
  | 'END_WITH'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_OR_EQUAL'
  | 'LESS_OR_EQUAL'
  | 'BETWEEN';

export type SdOperatorNoData = 'NULL' | 'NOT_NULL';
```

- [ ] **Step 3: Tạo src/models/filter.model.ts**

```ts
import { SdNestedKeyOf } from './nested-key-of.model';
import { SdOperatorHasData, SdOperatorNoData } from './operator.model';

export type SdFilter<T = any> = SdFilterHasData<T> | SdFilterBetween<T> | SdFilterNoData<T> | SdFilterAndOr<T>;

export interface SdFilterHasData<T = any> {
  field: SdNestedKeyOf<T>;
  operator: Exclude<SdOperatorHasData, 'BETWEEN'>;
  data: any;
}

export interface SdFilterBetween<T = any> {
  field: SdNestedKeyOf<T>;
  operator: 'BETWEEN';
  data: {
    from: string | number;
    to: string | number;
  };
}

export interface SdFilterNoData<T = any> {
  field: SdNestedKeyOf<T>;
  operator: SdOperatorNoData;
}

export interface SdFilterAndOr<T = any> {
  operator: 'AND' | 'OR';
  data: SdFilter<T>[];
}
```

- [ ] **Step 4: Tạo src/models/order.model.ts**

```ts
import { SdNestedKeyOf } from './nested-key-of.model';

export interface SdOrder<T = any> {
  field: SdNestedKeyOf<T>;
  direction: 'ASC' | 'DESC';
}
```

- [ ] **Step 5: Tạo src/models/paging.model.ts**

```ts
import { SdFilter } from './filter.model';
import { SdNestedKeyOf } from './nested-key-of.model';
import { SdOrder } from './order.model';

export interface SdQueryReq<T = any> {
  filters?: SdFilter<T>[];
  fields?: SdNestedKeyOf<T>[];
}

export interface SdPagingReq<T = any> extends SdQueryReq<T> {
  pageSize?: number;
  pageNumber?: number;
  orders?: SdOrder<T>[];
}

export interface SdPagingRes<T = any> {
  items: T[];
  total: number;
}
```

- [ ] **Step 6: Tạo src/models/size.model.ts**

```ts
export type SdSize = 'sm' | 'md' | 'lg';
```

- [ ] **Step 7: Tạo src/models/color.model.ts**

```ts
export type SdColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
```

- [ ] **Step 8: Tạo src/models/maybe-async.model.ts**

> Lưu ý: file này import từ `rxjs`. `rxjs` là peer dep optional — consumer cần cài nếu dùng `SdResolveMaybeAsync` / `SdNormalizeAsync`.

```ts
import { firstValueFrom, from, Observable, of } from 'rxjs';

export type SdMaybeAsync<T> = T | Promise<T> | Observable<T>;

export const SdResolveMaybeAsync = <T>(value: SdMaybeAsync<T>): Promise<T> => {
  if (value instanceof Promise) {
    return value;
  }
  if (isObservable(value)) {
    return firstValueFrom(value);
  }
  return Promise.resolve(value);
};

export const SdNormalizeAsync = <T>(value: SdMaybeAsync<T>): Observable<T> => {
  if (isObservable(value)) {
    return value;
  }
  if (value instanceof Promise) {
    return from(value);
  }
  return of(value);
};

function isObservable(obj: any): obj is Observable<any> {
  return obj && typeof obj.subscribe === 'function';
}
```

- [ ] **Step 9: Tạo src/models/icon.model.ts** (chỉ type — const sang constants/)

```ts
export type MaterialIconFontSet =
  | 'material-icons'
  | 'material-icons-outlined'
  | 'material-icons-round'
  | 'material-icons-sharp'
  | 'material-symbols-outlined';
```

- [ ] **Step 10: Tạo src/models/pattern.model.ts** (chỉ type và interface — const sang constants/)

```ts
export type SdPatternType = 'EMAIL' | 'PHONE' | 'PHONE_VN' | 'IDVN' | 'PASSPORT' | 'IDVN_OR_PASSPORT' | 'TIME';

export interface SdPatternCommon {
  type: SdPatternType;
  name: string;
  regex: string;
  errorMessage: string;
}
```

- [ ] **Step 11: Tạo src/models/language.model.ts** (chỉ type — const sang constants/)

```ts
export type Language = 'vi' | 'en' | 'ja' | 'ko' | 'zh';
```

- [ ] **Step 12: Tạo src/models/index.ts**

```ts
export * from './nested-key-of.model';
export * from './operator.model';
export * from './filter.model';
export * from './order.model';
export * from './paging.model';
export * from './size.model';
export * from './color.model';
export * from './maybe-async.model';
export * from './icon.model';
export * from './pattern.model';
export * from './language.model';
```

- [ ] **Step 13: Commit**

```bash
git add src/models/
git commit -m "feat: add models — types and interfaces"
```

---

### Task 4: Tạo src/constants/

**Files:**
- Create: `src/constants/operator.constants.ts`
- Create: `src/constants/pattern.constants.ts`
- Create: `src/constants/icon.constants.ts`
- Create: `src/constants/common.constants.ts`
- Create: `src/constants/language.constants.ts`
- Create: `src/constants/index.ts`

- [ ] **Step 1: Tạo src/constants/operator.constants.ts**

```ts
import { SdOperator } from '../models/operator.model';

export const SdOperators: {
  value: SdOperator;
  symbol?: string;
  display: string;
}[] = [
  { value: 'EQUAL',            symbol: '=',                 display: 'core.operator.equal.display' },
  { value: 'NOT_EQUAL',        symbol: '≠',                 display: 'core.operator.not-equal.display' },
  { value: 'GREATER_THAN',     symbol: '>',                 display: 'core.operator.greater-than.display' },
  { value: 'LESS_THAN',        symbol: '<',                 display: 'core.operator.less-than.display' },
  { value: 'GREATER_OR_EQUAL', symbol: '≥',                 display: 'core.operator.greater-or-equal.display' },
  { value: 'LESS_OR_EQUAL',    symbol: '≤',                 display: 'core.operator.less-or-equal.display' },
  { value: 'CONTAIN',          symbol: 'join_inner',        display: 'core.operator.contain.display' },
  { value: 'NOT_CONTAIN',      symbol: 'join',              display: 'core.operator.not-contain.display' },
  { value: 'START_WITH',       symbol: 'line_start_circle', display: 'core.operator.start-with.display' },
  { value: 'END_WITH',         symbol: 'line_end_circle',   display: 'core.operator.end-with.display' },
  { value: 'IN',               symbol: 'checklist_rtl',     display: 'core.operator.in.display' },
  { value: 'NOT_IN',           symbol: 'event_list',        display: 'core.operator.not-in.display' },
  { value: 'NULL',             symbol: 'motion_photos_off', display: 'core.operator.null.display' },
  { value: 'NOT_NULL',         symbol: 'adjust',            display: 'core.operator.not-null.display' },
];
```

- [ ] **Step 2: Tạo src/constants/pattern.constants.ts**

```ts
import { SdPatternCommon } from '../models/pattern.model';
import { StringUtilities } from '../fns/string.fns';

export const SdPatternCommons: SdPatternCommon[] = [
  { type: 'EMAIL',            name: 'core.validator.email.name',    regex: StringUtilities.REGEX_EMAIL,           errorMessage: 'core.validator.email.error' },
  { type: 'PHONE',            name: 'core.validator.phone.name',    regex: StringUtilities.REGEX_PHONE,           errorMessage: 'core.validator.phone.error' },
  { type: 'PHONE_VN',         name: 'core.validator.phone-vn.name', regex: StringUtilities.REGEX_PHONE_VN,        errorMessage: 'core.validator.phone-vn.error' },
  { type: 'IDVN',             name: 'core.validator.cccd.name',     regex: StringUtilities.REGEX_IDVN,            errorMessage: 'core.validator.cccd.error' },
  { type: 'PASSPORT',         name: 'core.validator.passport.name', regex: StringUtilities.REGEX_PASSPORT,        errorMessage: 'core.validator.passport.error' },
  { type: 'IDVN_OR_PASSPORT', name: 'core.validator.id-vn.name',   regex: StringUtilities.REGEX_IDVN_OR_PASSPORT, errorMessage: 'core.validator.id-vn.error' },
  { type: 'TIME',             name: 'core.validator.time.name',     regex: StringUtilities.REGEX_TIME,            errorMessage: 'core.validator.time.error' },
];
```

- [ ] **Step 3: Tạo src/constants/icon.constants.ts**

```ts
import { MaterialIconFontSet } from '../models/icon.model';

export const DefaultMaterialIconFontSet: MaterialIconFontSet = 'material-icons-outlined';
```

- [ ] **Step 4: Tạo src/constants/common.constants.ts**

```ts
export const SD_EMPTY_STR = '--';
```

- [ ] **Step 5: Tạo src/constants/language.constants.ts**

```ts
import { Language } from '../models/language.model';

export const SUPPORTED_LANGUAGES: readonly Language[] = ['vi', 'en', 'ja', 'ko', 'zh'] as const;
```

- [ ] **Step 6: Tạo src/constants/index.ts**

```ts
export * from './common.constants';
export * from './icon.constants';
export * from './language.constants';
export * from './operator.constants';
export * from './pattern.constants';
```

- [ ] **Step 7: Commit**

```bash
git add src/constants/
git commit -m "feat: add constants"
```

---

### Task 5: Tạo src/fns/ — functions và utility objects

**Files:**
- Create: `src/fns/string.fns.ts`
- Create: `src/fns/array.fns.ts`
- Create: `src/fns/number.fns.ts`
- Create: `src/fns/date.fns.ts`
- Create: `src/fns/color.fns.ts`
- Create: `src/fns/utility.fns.ts`
- Create: `src/fns/detect-incognito.fns.ts`
- Create: `src/fns/index.ts`

- [ ] **Step 1: Tạo src/fns/string.fns.ts**

```ts
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */

const REGEX_EMAIL = '^(([^<>()[\\].,;:\\s@"]+(\\.[^<>()[\\].,;:\\s@"]+)*)|(".+"))@(([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{2,})$';
const REGEX_PHONE = '^[+]*[(]{0,1}[+]?[0-9]{1,4}[)]{0,1}[-\\s./0-9]*$';
const REGEX_PHONE_VN = '^(?:\\+84|0|84)(3[2-9]|5[2689]|7[06-9]|8[1-689]|9[0-9])\\d{7}$';
const REGEX_IDVN = '^\\d{12}$';
const REGEX_PASSPORT = '^[A-Z]\\d{7}$';
const REGEX_IDVN_OR_PASSPORT = '^(\\d{12}|[A-Z]\\d{7})$';
const REGEX_TIME = '^(?:[01]\\d|2[0-3]):[0-5]\\d$';

const isValidEmail = (value: any) => {
  if (!value) return false;
  return new RegExp(REGEX_EMAIL).test(value);
};

const isValidPhone = (value: any) => {
  if (!value) return false;
  return new RegExp(REGEX_PHONE).test(value);
};

const isValidCode = (value: any) => {
  if (!value) return false;
  return /^[a-zA-Z0-9\@\_\-]{2,20}$/.test(value);
};

const isNullOrEmpty = (value: any) => value === undefined || value === null || value === '';

const isNullOrWhiteSpace = (value: any) =>
  value === undefined || value === null || typeof value !== 'string' || value.match(/^\s*$/) !== null;

const changeAliasLowerCase = (alias: any) => {
  let str: string = alias?.toString() ?? '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, ' ');
  str = str.replace(/ + /g, ' ');
  return str.trim();
};

const aliasIncludes = (alias: any, searchText: any) =>
  changeAliasLowerCase(alias).includes(changeAliasLowerCase(searchText));

const format = (template: string, ...arr: any[]) => {
  for (let i = 0; i < arr.length; i++) {
    template = template.replace(new RegExp(`\\{${i}\\}`, 'gi'), arr[i]);
  }
  return template;
};

const getValueByPath = (entity: Record<string, any>, key: string) => {
  let value: any = entity;
  for (const part of key.split('.')) value = value?.[part];
  return value;
};

const templateToDisplay = (template: string, entity: Record<string, any>) => {
  if (!template) return template;
  const regex = /\$\{([A-Za-z0-9._-]*)\}/g;
  for (const match of template.match(regex) || []) {
    const key = match.slice(2, match.length - 1);
    if (key) template = template.replace(match, getValueByPath(entity, key) ?? '');
  }
  return template;
};

const EXACT_TEMPLATE_REGEX = /^\$\{([A-Za-z0-9._-]*)\}$/;
const NUMBER_LITERAL_REGEX = /^-?\d+(\.\d+)?$/;

const parseExpression = (template: string, entity: Record<string, any>) => {
  if (!template) return undefined;
  const trimmed = template.trim();
  const exactMatch = trimmed.match(EXACT_TEMPLATE_REGEX);
  if (exactMatch?.[1]) return getValueByPath(entity, exactMatch[1]);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  if (NUMBER_LITERAL_REGEX.test(trimmed)) return Number(trimmed);
  return templateToDisplay(template, entity);
};

const SALT = 'cb9f4b2a-d26c-4787-a66e-e7130ee00f95';

const encrypt = (obj: any) => {
  const chars = JSON.stringify(obj).split('');
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '{') chars[i] = '}';
    else if (chars[i] === '}') chars[i] = '{';
  }
  return encodeURI(SALT + chars.join(''));
};

const decrypt = (encripted: string) => {
  encripted = decodeURI(encripted);
  if (encripted.indexOf(SALT) !== 0) throw new Error('object cannot be decrypted');
  const strs = encripted.substring(SALT.length).split('');
  for (let i = 0; i < strs.length; i++) {
    if (strs[i] === '{') strs[i] = '}';
    else if (strs[i] === '}') strs[i] = '{';
  }
  return JSON.parse(strs.join(''));
};

const convertToSnakeCaseCode = (name: string): string => {
  if (typeof name !== 'string') throw new Error('Invalid name');
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
};

const generateUniqueCode = (name: string, existingCodes: string[]): string => {
  const baseCode = convertToSnakeCaseCode(name);
  if (!existingCodes.includes(baseCode)) return baseCode;
  let index = 1;
  let newCode = `${baseCode}_${index}`;
  while (existingCodes.includes(newCode)) { index++; newCode = `${baseCode}_${index}`; }
  return newCode;
};

const sha256 = async (input: string): Promise<string> => {
  const buffer = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const StringUtilities = {
  REGEX_EMAIL, REGEX_PHONE, REGEX_PHONE_VN, REGEX_IDVN, REGEX_PASSPORT, REGEX_IDVN_OR_PASSPORT, REGEX_TIME,
  isValidEmail, isValidPhone, isValidCode,
  changeAliasLowerCase, aliasIncludes,
  format, templateToDisplay, parseExpression,
  encrypt, decrypt,
  isNullOrEmpty, isNullOrWhiteSpace,
  convertToSnakeCaseCode, generateUniqueCode, sha256,
};
```

- [ ] **Step 2: Tạo src/fns/array.fns.ts**

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringUtilities } from './string.fns';

const search = <T = any>(items: T[], searchText: any, fields?: (string | undefined) | (string | undefined)[], children?: string): T[] => {
  if (!searchText?.toString()) return items;
  if (!items?.length) return items;
  if (Array.isArray(fields)) {
    const fs = fields.filter(e => e !== undefined && e !== null && e !== '') as string[];
    if (!fs.length)
      return items.filter(item => item !== undefined && item !== null && StringUtilities.aliasIncludes(item, searchText));
    return items.filter(
      item =>
        (item !== undefined && item !== null && fs.some(field => StringUtilities.aliasIncludes((item as any)[field], searchText))) ||
        (children && search((item as any)[children], searchText, fields, children)?.length),
    );
  }
  if (!fields)
    return items.filter(item => item !== undefined && item !== null && StringUtilities.aliasIncludes(item, searchText));
  return items.filter(
    item =>
      (item !== undefined && item !== null && StringUtilities.aliasIncludes((item as any)[fields], searchText)) ||
      (children && search((item as any)[children], searchText, fields, children)?.length),
  );
};

const union = <T = unknown>(key: string, ...args: (T[] | undefined | null)[]) => {
  let results: T[] = [];
  const filterUnion = <T = any>(val: T, index: number, self: T[]) =>
    val !== undefined && val !== null && self.findIndex(e => (e as any)[key] === (val as any)[key]) === index;
  if (!args?.length) return [];
  for (const arg of args) {
    if (Array.isArray(arg)) results = [...results, ...arg].filter(filterUnion);
  }
  return results;
};

const toObject = <T>(key: string, items: T[] | undefined | null): Record<string, T> => {
  if (!Array.isArray(items)) return {};
  return items
    .filter(item => item !== undefined && item !== null)
    .reduce<Record<string, any>>((obj, item: Record<string, any>) => {
      const objKey = item?.[key]?.toString();
      if (typeof objKey === 'string') obj[objKey] = item;
      return obj;
    }, {});
};

const distinct = <T = any>(items: T[] | undefined | null) => (Array.isArray(items) ? [...new Set(items)] : []);

const paging = <T = any>(items: T[] | undefined | null, pageSize: number, page = 0): T[] => {
  if (!Array.isArray(items)) return [];
  return items.filter((_, index) => index >= page * pageSize && index < (page + 1) * pageSize);
};

export const ArrayUtilities = { search, union, toObject, distinct, paging };
```

- [ ] **Step 3: Tạo src/fns/number.fns.ts**

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */

const toVNCurrency = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) return null;
  const val = +value;
  return !Number.isNaN(val) ? val.toLocaleString('vi-VN', { maximumFractionDigits: 10 }) : null;
};

const toVN = toVNCurrency;

const toISO = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) return null;
  const val = +value;
  return !Number.isNaN(val) ? val.toLocaleString('en-US', { maximumFractionDigits: 10 }) : null;
};

const isPositiveInteger = (value: any) => {
  if (!value) return false;
  return /^([0-9]*)$/.test(value) && +value > 0;
};

const isPositiveNumber = (value: any) => {
  if (!value) return false;
  return /^([0-9]*)(\.[0-9]+$){0,1}$/.test(value) && +value > 0;
};

const isNumber = (value: any) => {
  if (value === undefined || value === null || value === '') return false;
  return !Number.isNaN(+value);
};

const round = (value: any, digits = 2): number | null => {
  if (!NumberUtilities.isNumber(value)) return null;
  const val = Math.pow(10, digits);
  return Math.round(value * val) / val;
};

export const NumberUtilities = { toVNCurrency, toVN, toISO, isPositiveInteger, isPositiveNumber, isNumber, round };
```

- [ ] **Step 4: Tạo src/fns/date.fns.ts**

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NumberUtilities } from './number.fns';

const isDate = (value: any) => {
  if (value === undefined || value === null || value === '') return false;
  if (typeof value === 'string') {
    if (value.length < 8) return false;
    const date1 = value.substring(0, 10);
    const date2 = value.substring(0, 9);
    const date3 = value.substring(0, 8);
    const regex1 = /^(0[1-9]|[1-9]|1[0-2])(-|\/)(0[1-9]|[1-9]|[12][0-9]|3[01])(-|\/)(\d{4})$/;
    const regex2 = /^(\d{4})(-|\/)(0[1-9]|[1-9]|1[0-2])(-|\/)(0[1-9]|[1-9]|[12][0-9]|3[01])$/;
    const result = regex1.test(date1) || regex2.test(date1) || regex1.test(date2) || regex2.test(date2) || regex1.test(date3) || regex2.test(date3);
    return result ? !isNaN(new Date(value).getTime()) : false;
  }
  return !isNaN(new Date(value).getTime());
};

const toFormat = (value: any, format: string): string => {
  if (!isDate(value)) return '';
  const isDatePart = (type: Intl.DateTimeFormatPart['type']): type is 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' =>
    ['year', 'month', 'day', 'hour', 'minute', 'second'].includes(type);
  const date = new Date(value);
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(date);
  const map: Partial<Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string>> = {};
  parts.forEach(part => { if (isDatePart(part.type)) map[part.type] = part.value; });
  return format.replace('yyyy', map.year ?? '').replace('MM', map.month ?? '').replace('dd', map.day ?? '').replace('HH', map.hour ?? '').replace('mm', map.minute ?? '').replace('ss', map.second ?? '');
};

const addMiliseconds = (value: any, miliseconds: number) => {
  if (!isDate(value)) return null;
  const date = new Date(value);
  date.setMilliseconds(date.getMilliseconds() + miliseconds);
  return date;
};

const addDays = (value: any, days: number) => {
  if (!isDate(value)) return null;
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const addHours = (value: any, hours: number) => {
  if (!isDate(value)) return null;
  const date = new Date(value);
  date.setHours(date.getHours() + hours);
  return date;
};

const addMonths = (value: any, months: number) => {
  if (!isDate(value)) return null;
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date;
};

const begin = (value: any): Date | null => {
  if (!isDate(value)) return null;
  return new Date(toFormat(value, 'MM/dd/yyyy'));
};

const end = (value: any): Date | null => {
  if (!isDate(value)) return null;
  return addMiliseconds(begin(addDays(value, 1)), -1);
};

const equal = (date1: any, date2: any) => {
  if (!isDate(date1) && !isDate(date2)) return true;
  if (!isDate(date1) || !isDate(date2)) return false;
  return new Date(date1).getTime() === new Date(date2).getTime();
};

const dayDiff = (date1: any, date2: any) => {
  if (!isDate(date1) || !isDate(date2)) return null;
  return Math.floor((new Date(date2).getTime() - new Date(date1).getTime()) / (24 * 3600 * 1000));
};

const monthDiff = (date1: any, date2: any) => {
  if (!isDate(date1) || !isDate(date2)) return null;
  const d1Y = new Date(date1).getFullYear(), d2Y = new Date(date2).getFullYear();
  const d1M = new Date(date1).getMonth(), d2M = new Date(date2).getMonth();
  return d2M + 12 * d2Y - (d1M + 12 * d1Y);
};

const yearDiff = (date1: any, date2: any) => {
  if (!isDate(date1) || !isDate(date2)) return null;
  return new Date(date2).getFullYear() - new Date(date1).getFullYear();
};

const age = (date1: any, date2: any) => {
  const diff = monthDiff(date1, date2);
  return diff == null ? null : NumberUtilities.round(diff / 12);
};

const parseFrom = (value: any, format: string) => {
  if (!value || !format) return null;
  value = value.toString();
  const dmy = format.includes('dd') && format.includes('MM') && format.includes('yyyy');
  const hms = format.includes('HH') || format.includes('mm') || format.includes('ss');
  let strDate = '';
  if (dmy) {
    const dd = value.substr(format.indexOf('dd'), 2);
    const MM = value.substr(format.indexOf('MM'), 2);
    const yyyy = value.substr(format.indexOf('yyyy'), 4);
    if (+yyyy > 0 && +MM > 0 && +dd > 0) strDate += `${MM}/${dd}/${yyyy}`;
    else return null;
  } else {
    const today = new Date();
    strDate += `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
  }
  if (hms) {
    const HH = format.includes('HH') ? value.substr(format.indexOf('HH'), 2) : '00';
    const mm = format.includes('mm') ? value.substr(format.indexOf('mm'), 2) : '00';
    const ss = format.includes('ss') ? value.substr(format.indexOf('ss'), 2) : '00';
    strDate += ` ${HH || '00'}:${mm || '00'}:${ss || '00'}`;
  }
  return isDate(strDate) ? new Date(strDate) : null;
};

const timeDifference = (previous: any, current: any = new Date()) => {
  if (!isDate(previous) || !isDate(current)) return '';
  const elapsed = new Date(current).getTime() - new Date(previous).getTime();
  const m = 60 * 1000, h = m * 60, d = h * 24, mo = d * 30, y = d * 365;
  if (elapsed < m) return `${Math.round(elapsed / 1000)} seconds ago`;
  if (elapsed < h) return `${Math.round(elapsed / m)} minutes ago`;
  if (elapsed < d) return `${Math.round(elapsed / h)} hours ago`;
  if (elapsed < mo) return `${Math.round(elapsed / d)} days ago`;
  if (elapsed < y) return `${Math.round(elapsed / mo)} months ago`;
  return `${Math.round(elapsed / y)} years ago`;
};

export const DateUtilities = {
  equal, dayDiff, monthDiff, yearDiff, age,
  parseFrom, isDate, toFormat,
  addMiliseconds, addHours, addDays, addMonths,
  begin, end, timeDifference,
};
```

- [ ] **Step 5: Tạo src/fns/color.fns.ts**

```ts
export function hslToHex(h: number, s: number, l: number): string {
  const hN = h / 360, sN = s / 100, lN = l / 100;
  let r: number, g: number, b: number;
  if (sN === 0) {
    r = g = b = lN;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
    const p = 2 * lN - q;
    r = hue2rgb(p, q, hN + 1 / 3);
    g = hue2rgb(p, q, hN);
    b = hue2rgb(p, q, hN - 1 / 3);
  }
  const toHex = (x: number) => { const h = Math.round(x * 255).toString(16); return h.length === 1 ? '0' + h : h; };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (x: number) => { const h = Math.round(Math.max(0, Math.min(255, x))).toString(16); return h.length === 1 ? '0' + h : h; };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
```

- [ ] **Step 6: Tạo src/fns/utility.fns.ts**

Copy nguyên nội dung từ `projects/sd-angular/utilities/extensions/src/utility.extension.ts`, đổi export name:

```ts
// (copy toàn bộ nội dung utility.extension.ts, chỉ đổi tên export cuối)
export { SdUtilities };
```

> Nội dung đầy đủ: xem `projects/sd-angular/utilities/extensions/src/utility.extension.ts` — giữ nguyên, không chỉnh sửa logic.

- [ ] **Step 7: Tạo src/fns/detect-incognito.fns.ts**

Copy nguyên nội dung từ `projects/sd-angular/utilities/extensions/src/detect-incognito.ts`:

```ts
// (copy toàn bộ nội dung detect-incognito.ts — giữ nguyên)
export const detectIncognito = (): Promise<{ isPrivate: boolean; browserName: string }> => { ... };
```

- [ ] **Step 8: Tạo src/fns/index.ts**

```ts
export * from './string.fns';
export * from './array.fns';
export * from './number.fns';
export * from './date.fns';
export * from './color.fns';
export * from './utility.fns';
export * from './detect-incognito.fns';
```

- [ ] **Step 9: Commit**

```bash
git add src/fns/
git commit -m "feat: add fns — StringUtilities, ArrayUtilities, NumberUtilities, DateUtilities, color, utility, detectIncognito"
```

---

### Task 6: Tạo barrel entry src/index.ts và kiểm tra build

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Tạo src/index.ts**

```ts
export * from './models';
export * from './constants';
export * from './fns';
```

- [ ] **Step 2: Chạy typecheck**

```bash
npm run typecheck
```

Expected: không có TypeScript error. Nếu có lỗi, fix trước khi tiếp tục.

- [ ] **Step 3: Chạy build**

```bash
npm run build
```

Expected: thư mục `dist/` xuất hiện với các file:
```
dist/index.js  dist/index.mjs  dist/index.d.ts
dist/models.js  dist/models.mjs  dist/models.d.ts
dist/constants.js  dist/constants.mjs  dist/constants.d.ts
dist/fns.js  dist/fns.mjs  dist/fns.d.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add barrel index, verify build passes"
```

---

### Task 7: Viết tests cơ bản

**Files:**
- Create: `src/fns/string.fns.spec.ts`
- Create: `src/fns/array.fns.spec.ts`
- Create: `src/fns/number.fns.spec.ts`
- Create: `src/models/nested-key-of.model.spec.ts`

- [ ] **Step 1: Tạo src/fns/string.fns.spec.ts**

```ts
import { describe, it, expect } from 'vitest';
import { StringUtilities } from './string.fns';

describe('StringUtilities', () => {
  describe('isValidEmail', () => {
    it('returns true for valid email', () => {
      expect(StringUtilities.isValidEmail('test@example.com')).toBe(true);
    });
    it('returns false for invalid email', () => {
      expect(StringUtilities.isValidEmail('not-an-email')).toBe(false);
    });
    it('returns false for null/undefined', () => {
      expect(StringUtilities.isValidEmail(null)).toBe(false);
      expect(StringUtilities.isValidEmail(undefined)).toBe(false);
    });
  });

  describe('changeAliasLowerCase', () => {
    it('removes Vietnamese diacritics', () => {
      expect(StringUtilities.changeAliasLowerCase('Nguyễn Văn A')).toBe('nguyen van a');
    });
    it('handles đ/Đ', () => {
      expect(StringUtilities.changeAliasLowerCase('Đội')).toBe('doi');
    });
  });

  describe('aliasIncludes', () => {
    it('finds Vietnamese text ignoring diacritics', () => {
      expect(StringUtilities.aliasIncludes('Nguyễn', 'nguyen')).toBe(true);
    });
    it('returns false when not found', () => {
      expect(StringUtilities.aliasIncludes('Nguyễn', 'Trần')).toBe(false);
    });
  });

  describe('convertToSnakeCaseCode', () => {
    it('converts Vietnamese name to snake_case', () => {
      expect(StringUtilities.convertToSnakeCaseCode('Đội Kỹ Thuật')).toBe('doi_ky_thuat');
    });
    it('throws for non-string input', () => {
      expect(() => StringUtilities.convertToSnakeCaseCode(123 as any)).toThrow('Invalid name');
    });
  });

  describe('generateUniqueCode', () => {
    it('returns base code when no conflict', () => {
      expect(StringUtilities.generateUniqueCode('test', [])).toBe('test');
    });
    it('appends _1 on first conflict', () => {
      expect(StringUtilities.generateUniqueCode('test', ['test'])).toBe('test_1');
    });
    it('increments suffix until unique', () => {
      expect(StringUtilities.generateUniqueCode('test', ['test', 'test_1'])).toBe('test_2');
    });
  });

  describe('isNullOrEmpty', () => {
    it('returns true for null, undefined, empty string', () => {
      expect(StringUtilities.isNullOrEmpty(null)).toBe(true);
      expect(StringUtilities.isNullOrEmpty(undefined)).toBe(true);
      expect(StringUtilities.isNullOrEmpty('')).toBe(true);
    });
    it('returns false for non-empty string', () => {
      expect(StringUtilities.isNullOrEmpty('hello')).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Tạo src/fns/array.fns.spec.ts**

```ts
import { describe, it, expect } from 'vitest';
import { ArrayUtilities } from './array.fns';

describe('ArrayUtilities', () => {
  describe('distinct', () => {
    it('removes duplicates from primitive array', () => {
      expect(ArrayUtilities.distinct([1, 2, 2, 3])).toEqual([1, 2, 3]);
    });
    it('returns empty array for null/undefined', () => {
      expect(ArrayUtilities.distinct(null)).toEqual([]);
      expect(ArrayUtilities.distinct(undefined)).toEqual([]);
    });
  });

  describe('paging', () => {
    it('returns correct page slice', () => {
      const items = [1, 2, 3, 4, 5];
      expect(ArrayUtilities.paging(items, 2, 0)).toEqual([1, 2]);
      expect(ArrayUtilities.paging(items, 2, 1)).toEqual([3, 4]);
      expect(ArrayUtilities.paging(items, 2, 2)).toEqual([5]);
    });
    it('returns empty for null input', () => {
      expect(ArrayUtilities.paging(null, 2)).toEqual([]);
    });
  });

  describe('toObject', () => {
    it('converts array to keyed object', () => {
      const items = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
      expect(ArrayUtilities.toObject('id', items)).toEqual({ a: { id: 'a', name: 'A' }, b: { id: 'b', name: 'B' } });
    });
    it('returns empty object for null', () => {
      expect(ArrayUtilities.toObject('id', null)).toEqual({});
    });
  });

  describe('union', () => {
    it('merges arrays deduplicating by key', () => {
      const a = [{ id: 1, v: 'a' }];
      const b = [{ id: 1, v: 'b' }, { id: 2, v: 'c' }];
      const result = ArrayUtilities.union('id', a, b);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
    });
  });

  describe('search', () => {
    it('returns all items when searchText is empty', () => {
      const items = [{ name: 'Nguyen' }];
      expect(ArrayUtilities.search(items, '')).toEqual(items);
    });
    it('filters by field ignoring diacritics', () => {
      const items = [{ name: 'Nguyễn Văn A' }, { name: 'Trần Thị B' }];
      expect(ArrayUtilities.search(items, 'nguyen', ['name'])).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 3: Tạo src/fns/number.fns.spec.ts**

```ts
import { describe, it, expect } from 'vitest';
import { NumberUtilities } from './number.fns';

describe('NumberUtilities', () => {
  describe('isNumber', () => {
    it('returns true for numeric values', () => {
      expect(NumberUtilities.isNumber(0)).toBe(true);
      expect(NumberUtilities.isNumber('123')).toBe(true);
    });
    it('returns false for null/undefined/empty', () => {
      expect(NumberUtilities.isNumber(null)).toBe(false);
      expect(NumberUtilities.isNumber('')).toBe(false);
    });
  });

  describe('round', () => {
    it('rounds to 2 decimal places by default', () => {
      expect(NumberUtilities.round(1.234)).toBe(1.23);
      expect(NumberUtilities.round(1.235)).toBe(1.24);
    });
    it('returns null for non-number', () => {
      expect(NumberUtilities.round('abc')).toBeNull();
    });
  });

  describe('isPositiveInteger', () => {
    it('returns true for positive integers', () => {
      expect(NumberUtilities.isPositiveInteger(5)).toBe(true);
      expect(NumberUtilities.isPositiveInteger('10')).toBe(true);
    });
    it('returns false for zero, negative, decimal', () => {
      expect(NumberUtilities.isPositiveInteger(0)).toBe(false);
      expect(NumberUtilities.isPositiveInteger(-1)).toBe(false);
      expect(NumberUtilities.isPositiveInteger(1.5)).toBe(false);
    });
  });
});
```

- [ ] **Step 4: Chạy tests**

```bash
npm test
```

Expected: tất cả tests PASS. Fix nếu có fail.

- [ ] **Step 5: Commit**

```bash
git add src/fns/*.spec.ts
git commit -m "test: add unit tests for StringUtilities, ArrayUtilities, NumberUtilities"
```

---

### Task 8: GitHub Actions — publish workflow

**Files:**
- Create: `.github/workflows/publish.yml`

- [ ] **Step 1: Tạo thư mục .github/workflows/**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Tạo .github/workflows/publish.yml**

```yaml
name: Publish to npm

on:
  push:
    branches:
      - main

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

> Trước khi merge vào main lần đầu, cần vào **GitHub repo → Settings → Secrets and variables → Actions → New repository secret** và tạo secret tên `NPM_TOKEN` với giá trị là npm access token (`npm token create`).

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions publish workflow"
```

---

### Task 9: Tạo branch release/1.0.0 và final check

- [ ] **Step 1: Verify build sạch một lần cuối**

```bash
npm run build && npm test
```

Expected: build thành công, tất cả tests PASS.

- [ ] **Step 2: Kiểm tra subpath exports hoạt động**

Tạo file tạm `test-exports.mjs` ở root:
```js
import { SdPagingReq } from './dist/models.mjs';
import { SD_EMPTY_STR, SUPPORTED_LANGUAGES } from './dist/constants.mjs';
import { StringUtilities, ArrayUtilities } from './dist/fns.mjs';

console.log('SD_EMPTY_STR:', SD_EMPTY_STR);
console.log('SUPPORTED_LANGUAGES:', SUPPORTED_LANGUAGES);
console.log('StringUtilities.isValidEmail:', StringUtilities.isValidEmail('test@test.com'));
console.log('ArrayUtilities.distinct:', ArrayUtilities.distinct([1, 1, 2]));
```

Chạy:
```bash
node test-exports.mjs
```

Expected output:
```
SD_EMPTY_STR: --
SUPPORTED_LANGUAGES: [ 'vi', 'en', 'ja', 'ko', 'zh' ]
StringUtilities.isValidEmail: true
ArrayUtilities.distinct: [ 1, 2 ]
```

Sau khi verify OK, xoá file tạm:
```bash
rm test-exports.mjs
```

- [ ] **Step 3: Tạo branch release/1.0.0**

```bash
git checkout -b release/1.0.0
git push -u origin release/1.0.0
```

- [ ] **Step 4: Final commit trên release/1.0.0**

```bash
git add -A
git status
# Đảm bảo không có file nhạy cảm (.env, credentials) trước khi commit
git commit -m "release: 1.0.0 — initial release with models, constants, fns"
```

---

## Notes

- `maybe-async.model.ts` import từ `rxjs` — là peer dep optional. Consumer không dùng `SdMaybeAsync` thì không cần cài rxjs.
- `SdPatternCommons` trong `constants/` phụ thuộc `StringUtilities` từ `fns/` — import cross-subpath này ổn vì tsup bundle riêng từng entry.
- `utility.fns.ts` (SdUtilities.upload) dùng `document`/`navigator` — chỉ hoạt động trên browser, không phải Node. Vitest environment đặt `node` nên không test được `upload`/`download` — bỏ qua browser-only fns trong test.
- Khi publish lần đầu, cần tạo npm org `@sdcorejs` nếu chưa có: `npm org create sdcorejs`.
