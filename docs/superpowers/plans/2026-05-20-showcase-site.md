# Showcase Site Implementation Plan

> [!IMPORTANT]
> This is a historical implementation snapshot, not current API documentation.
> For v1.2.0 behavior, use [README](../../../README.md) and [migration guidance](../../../MIGRATION-1.2.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + vanilla TypeScript interactive showcase site for `@sdcorejs/utils` with four tabs (Constants, Models, Validation Playground, Functions Demo), auto-deployed to GitHub Pages via GitHub Actions.

**Architecture:** `docs-site/` is a self-contained Vite project at the repo root. It imports the library source directly via Vite path aliases (no npm publish needed). Each tab is a TypeScript module that renders into a shared `<main>` element. GitHub Actions builds and deploys on every push to `main`.

**Tech Stack:** Vite 5, TypeScript 5, vanilla DOM. Teal/Emerald theme. No framework. No external UI library.

---

## File Map

```
docs-site/
  index.html                       ← HTML shell, loads main.ts
  package.json                     ← Vite + TypeScript devDeps only
  tsconfig.json                    ← paths: aliasing @sdcorejs/utils/* → ../src/*
  vite.config.ts                   ← base + resolve.alias for subpath imports
  src/
    main.ts                        ← mount(): header, tab bar, content routing
    style.css                      ← CSS variables, layout, table, form, badge
    components/
      tab-bar.ts                   ← renderTabBar(tabs, active, onSelect) → HTMLElement
      code-block.ts                ← renderCodeBlock(code) → <pre> with manual highlighting
      result-badge.ts              ← renderResultBadge(valid, label?) → <span>
    tabs/
      constants.ts                 ← renderConstants(el): VALIDATION_PATTERNS + OPERATORS + SUPPORTED_LANGUAGES
      models.ts                    ← renderModels(el): static TS type code blocks
      validation.ts                ← renderValidation(el): split-view live validator
      functions.ts                 ← renderFunctions(el): sub-tabbed function demos

.github/
  workflows/
    deploy-docs.yml                ← trigger: push main → npm ci + vite build → deploy-pages
```

---

## Task 1: Scaffold docs-site project

**Files:**
- Create: `docs-site/package.json`
- Create: `docs-site/tsconfig.json`
- Create: `docs-site/vite.config.ts`
- Create: `docs-site/index.html`

- [ ] **Step 1: Create `docs-site/package.json`**

```json
{
  "name": "@sdcorejs/utils-docs",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "typescript": "~5.7.2",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create `docs-site/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "lib": ["ES2022", "DOM"],
    "paths": {
      "@sdcorejs/utils":            ["../src/index.ts"],
      "@sdcorejs/utils/models":     ["../src/models/index.ts"],
      "@sdcorejs/utils/constants":  ["../src/constants/index.ts"],
      "@sdcorejs/utils/fns":        ["../src/fns/index.ts"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `docs-site/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/sdcorejs-ultis/',
  resolve: {
    alias: [
      { find: '@sdcorejs/utils/models',    replacement: resolve(__dirname, '../src/models/index.ts') },
      { find: '@sdcorejs/utils/constants', replacement: resolve(__dirname, '../src/constants/index.ts') },
      { find: '@sdcorejs/utils/fns',       replacement: resolve(__dirname, '../src/fns/index.ts') },
      { find: '@sdcorejs/utils',           replacement: resolve(__dirname, '../src/index.ts') },
    ],
  },
});
```

Note: more-specific aliases (`/models`, `/constants`, `/fns`) must appear before the bare `@sdcorejs/utils` alias.

- [ ] **Step 4: Create `docs-site/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>@sdcorejs/utils — Interactive Reference</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Create empty `docs-site/src/main.ts` to satisfy Vite**

```typescript
console.log('scaffold ok');
```

- [ ] **Step 6: Install deps and verify dev server starts**

```bash
cd docs-site && npm install
npm run dev
```

Expected: Vite prints `http://localhost:5173/sdcorejs-ultis/` (or similar port), browser shows blank page with no console errors.

- [ ] **Step 7: Commit**

```bash
git add docs-site/
git commit -m "feat(docs-site): scaffold Vite project with teal theme"
```

---

## Task 2: Global theme CSS + shell layout

**Files:**
- Create: `docs-site/src/style.css`
- Create: `docs-site/src/components/tab-bar.ts`
- Create: `docs-site/src/components/result-badge.ts`
- Create: `docs-site/src/components/code-block.ts`
- Modify: `docs-site/src/main.ts`

- [ ] **Step 1: Create `docs-site/src/style.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary:        #0f766e;
  --primary-hover:  #0d9488;
  --accent:         #14b8a6;
  --accent-light:   #ccfbf1;
  --bg:             #f0fdfa;
  --surface:        #ffffff;
  --border:         #d1fae5;
  --text:           #134e4a;
  --text-muted:     #6b7280;
  --valid:          #16a34a;
  --invalid:        #dc2626;
  --radius:         6px;
  --shadow:         0 1px 3px rgba(0,0,0,.08);
}

body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); font-size: 14px; }

.site-header { background: var(--primary); color: white; height: 56px; padding: 0 24px; display: flex; align-items: center; }
.header-inner { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1280px; margin: 0 auto; }
.header-logo { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; }
.header-link { color: var(--accent-light); font-size: 13px; text-decoration: none; }
.header-link:hover { text-decoration: underline; }

.tab-bar { background: var(--surface); border-bottom: 1px solid var(--border); display: flex; gap: 4px; padding: 0 24px; }
.tab-btn { background: none; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); cursor: pointer; font-size: 13px; padding: 12px 16px; transition: color .15s, border-color .15s; }
.tab-btn:hover { color: var(--primary); }
.tab-btn.active { border-bottom-color: var(--primary); color: var(--primary); font-weight: 600; }

.tab-content { max-width: 1280px; margin: 0 auto; padding: 24px; }

table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
th { background: #f0fdfa; color: var(--text-muted); font-size: 11px; font-weight: 600; letter-spacing: .5px; padding: 10px 14px; text-align: left; text-transform: uppercase; }
td { border-top: 1px solid var(--border); padding: 10px 14px; vertical-align: top; }
tr:hover td { background: #f9fffe; }

.code-block { background: #0d1117; border-radius: var(--radius); color: #e6edf3; font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 12px; line-height: 1.6; overflow-x: auto; padding: 16px; }
.code-block .kw { color: #ff7b72; }
.code-block .ty { color: #79c0ff; }
.code-block .st { color: #a5d6ff; }
.code-block .cm { color: #8b949e; }

input[type="text"], input[type="number"], input[type="date"], select, textarea {
  border: 1px solid var(--border); border-radius: var(--radius); color: var(--text);
  font-size: 13px; outline: none; padding: 8px 12px; transition: border-color .15s; width: 100%;
}
input:focus, select:focus, textarea:focus { border-color: var(--accent); }

button.btn-primary { background: var(--primary); border: none; border-radius: var(--radius); color: white; cursor: pointer; font-size: 13px; font-weight: 600; padding: 8px 18px; transition: background .15s; }
button.btn-primary:hover { background: var(--primary-hover); }

.badge-valid   { background: #dcfce7; border-radius: var(--radius); color: var(--valid);   display: inline-flex; align-items: center; font-weight: 700; gap: 6px; padding: 4px 10px; }
.badge-invalid { background: #fee2e2; border-radius: var(--radius); color: var(--invalid); display: inline-flex; align-items: center; font-weight: 700; gap: 6px; padding: 4px 10px; }

.section-title { color: var(--primary); font-size: 16px; font-weight: 700; margin-bottom: 12px; }
.section { margin-bottom: 32px; }
.search-bar { margin-bottom: 12px; max-width: 320px; }

.split { display: grid; gap: 24px; grid-template-columns: 1fr 1fr; }
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.panel-title { color: var(--text-muted); font-size: 11px; font-weight: 600; letter-spacing: .5px; margin-bottom: 12px; text-transform: uppercase; }

.sub-tabs { display: flex; gap: 4px; margin-bottom: 16px; }
.sub-tab-btn { background: none; border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-muted); cursor: pointer; font-size: 12px; padding: 5px 12px; }
.sub-tab-btn.active { background: var(--accent-light); border-color: var(--accent); color: var(--primary); font-weight: 600; }

.demo-row { align-items: flex-start; display: flex; gap: 12px; margin-bottom: 16px; }
.demo-label { color: var(--text-muted); font-family: monospace; font-size: 12px; min-width: 220px; padding-top: 10px; }
.demo-output { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); color: var(--primary); flex: 1; font-family: monospace; font-size: 13px; min-height: 36px; padding: 8px 12px; word-break: break-all; }
```

- [ ] **Step 2: Create `docs-site/src/components/tab-bar.ts`**

```typescript
export function renderTabBar(
  tabs: { id: string; label: string }[],
  activeId: string,
  onSelect: (id: string) => void
): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'tab-bar';
  for (const tab of tabs) {
    const btn = document.createElement('button');
    btn.className = `tab-btn${tab.id === activeId ? ' active' : ''}`;
    btn.dataset.tab = tab.id;
    btn.textContent = tab.label;
    btn.addEventListener('click', () => onSelect(tab.id));
    nav.appendChild(btn);
  }
  return nav;
}
```

- [ ] **Step 3: Create `docs-site/src/components/result-badge.ts`**

```typescript
export function renderResultBadge(valid: boolean, label?: string): HTMLElement {
  const span = document.createElement('span');
  span.className = valid ? 'badge-valid' : 'badge-invalid';
  span.textContent = `${valid ? '✓' : '✗'} ${label ?? (valid ? 'valid' : 'invalid')}`;
  return span;
}
```

- [ ] **Step 4: Create `docs-site/src/components/code-block.ts`**

```typescript
export function renderCodeBlock(code: string): HTMLElement {
  const pre = document.createElement('pre');
  pre.className = 'code-block';
  pre.innerHTML = highlightTS(code);
  return pre;
}

function highlightTS(code: string): string {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /\b(export|type|interface|const|let|readonly|extends|import|from|return|async|await|string|boolean|number|void|null|undefined|Promise|Array)\b/g,
      '<span class="kw">$1</span>'
    )
    .replace(/'([^']*)'/g, '<span class="st">\'$1\'</span>')
    .replace(/\/\/.*/g, '<span class="cm">$&</span>');
}
```

- [ ] **Step 5: Create empty stubs for the four tab modules**

```typescript
// docs-site/src/tabs/constants.ts
export function renderConstants(_el: HTMLElement): void {}

// docs-site/src/tabs/models.ts
export function renderModels(_el: HTMLElement): void {}

// docs-site/src/tabs/validation.ts
export function renderValidation(_el: HTMLElement): void {}

// docs-site/src/tabs/functions.ts
export function renderFunctions(_el: HTMLElement): void {}
```

- [ ] **Step 6: Implement `docs-site/src/main.ts`**

```typescript
import './style.css';
import { renderTabBar } from './components/tab-bar';
import { renderConstants } from './tabs/constants';
import { renderModels } from './tabs/models';
import { renderValidation } from './tabs/validation';
import { renderFunctions } from './tabs/functions';

const TABS = [
  { id: 'constants',  label: 'Constants' },
  { id: 'models',     label: 'Models' },
  { id: 'validation', label: 'Validation Playground' },
  { id: 'functions',  label: 'Functions Demo' },
];

type TabId = 'constants' | 'models' | 'validation' | 'functions';

const RENDERERS: Record<TabId, (el: HTMLElement) => void> = {
  constants:  renderConstants,
  models:     renderModels,
  validation: renderValidation,
  functions:  renderFunctions,
};

function mount(): void {
  const app = document.getElementById('app')!;

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="header-inner">
      <span class="header-logo">@sdcorejs/utils</span>
      <a class="header-link" href="https://github.com/sdcorejs/sdcorejs-ultis" target="_blank" rel="noreferrer">GitHub ↗</a>
    </div>
  `;
  app.appendChild(header);

  let activeTab: TabId = 'validation';
  const content = document.createElement('main');
  content.className = 'tab-content';

  const tabBar = renderTabBar(TABS, activeTab, (id) => {
    activeTab = id as TabId;
    tabBar.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.tab === id)
    );
    content.innerHTML = '';
    RENDERERS[activeTab](content);
  });

  app.appendChild(tabBar);
  app.appendChild(content);
  RENDERERS[activeTab](content);
}

mount();
```

- [ ] **Step 7: Verify in browser**

Run: `cd docs-site && npm run dev`

Expected: teal header with `@sdcorejs/utils` title, four tab buttons, no console errors.

- [ ] **Step 8: Commit**

```bash
git add docs-site/src/
git commit -m "feat(docs-site): shell layout — header, tab bar, CSS theme"
```

---

## Task 3: Constants tab

**Files:**
- Modify: `docs-site/src/tabs/constants.ts`

- [ ] **Step 1: Implement `docs-site/src/tabs/constants.ts`**

```typescript
import { VALIDATION_PATTERNS, OPERATORS, SUPPORTED_LANGUAGES } from '@sdcorejs/utils/constants';

const SAMPLE_VALID: Record<string, string> = {
  EMAIL: 'user@example.com',      PHONE: '+84901234567',
  VN_PHONE: '0912345678',         VN_ID: '001234567890',
  PASSPORT: 'B1234567',           VN_ID_OR_PASSPORT: '001234567890',
  TIME: '09:30',                  URL: 'https://example.com',
  DOMAIN: 'example.com',          IPV4: '192.168.1.1',
  IPV6: '2001:db8::1',            IMAGE_URL: 'https://cdn.example.com/img.jpg',
  SLUG: 'hello-world',            NUMBER: '-3.14',
  INTEGER: '42',                  DECIMAL: '3.14',
  POSITIVE_NUMBER: '10',          UUID: '550e8400-e29b-41d4-a716-446655440000',
  CODE_16: 'ABCDEF1234567890',    CODE_32: 'ABCDEF1234567890abcdef1234567890',
  HEX_COLOR: '#1A2B3C',           BASE64: 'SGVsbG8=',
};

export function renderConstants(el: HTMLElement): void {
  el.innerHTML = '';

  // ── VALIDATION_PATTERNS ──────────────────────────────────────────
  const sec1 = document.createElement('div');
  sec1.className = 'section';
  sec1.innerHTML = '<div class="section-title">VALIDATION_PATTERNS</div>';

  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = 'Search by type…';
  search.className = 'search-bar';
  sec1.appendChild(search);

  const table1 = buildPatternsTable();
  sec1.appendChild(table1);

  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    table1.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach(row => {
      row.style.display = row.dataset.type?.includes(q) ? '' : 'none';
    });
  });

  el.appendChild(sec1);

  // ── OPERATORS ────────────────────────────────────────────────────
  const sec2 = document.createElement('div');
  sec2.className = 'section';
  sec2.innerHTML = '<div class="section-title">OPERATORS</div>';

  const table2 = document.createElement('table');
  table2.innerHTML = '<thead><tr><th>value</th><th>symbol</th><th>display</th></tr></thead>';
  const tbody2 = document.createElement('tbody');
  for (const op of OPERATORS) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><code>${op.value}</code></td><td>${op.symbol}</td><td>${op.display}</td>`;
    tbody2.appendChild(tr);
  }
  table2.appendChild(tbody2);
  sec2.appendChild(table2);
  el.appendChild(sec2);

  // ── SUPPORTED_LANGUAGES ──────────────────────────────────────────
  const sec3 = document.createElement('div');
  sec3.className = 'section';
  sec3.innerHTML = `
    <div class="section-title">SUPPORTED_LANGUAGES</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${[...SUPPORTED_LANGUAGES].map(l =>
        `<span style="background:var(--accent-light);border-radius:4px;color:var(--primary);font-family:monospace;font-size:13px;padding:4px 10px">'${l}'</span>`
      ).join('')}
    </div>
  `;
  el.appendChild(sec3);
}

function buildPatternsTable(): HTMLTableElement {
  const table = document.createElement('table');
  table.innerHTML = '<thead><tr><th>type</th><th>pattern</th><th>sample valid input</th></tr></thead>';
  const tbody = document.createElement('tbody');
  for (const p of VALIDATION_PATTERNS) {
    const tr = document.createElement('tr');
    tr.dataset.type = p.type.toLowerCase();
    const truncated = p.pattern.length > 60 ? p.pattern.slice(0, 60) + '…' : p.pattern;
    tr.innerHTML = `
      <td><code style="color:var(--primary);font-weight:600">${p.type}</code></td>
      <td><code style="color:var(--text-muted);font-size:11px" title="${p.pattern}">${truncated}</code></td>
      <td><code style="color:var(--valid)">${SAMPLE_VALID[p.type] ?? ''}</code></td>
    `;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}
```

- [ ] **Step 2: Verify in browser**

Click "Constants" tab. Expected:
- Searchable table of 22 VALIDATION_PATTERNS with type, truncated regex, sample input
- Table of 14 OPERATORS
- Row of language badges: `'vi'`, `'en'`, `'ja'`, `'ko'`, `'zh'`
- Typing in search box filters the patterns table

- [ ] **Step 3: Commit**

```bash
git add docs-site/src/tabs/constants.ts
git commit -m "feat(docs-site): constants tab — VALIDATION_PATTERNS, OPERATORS, SUPPORTED_LANGUAGES"
```

---

## Task 4: Models tab

**Files:**
- Modify: `docs-site/src/tabs/models.ts`

- [ ] **Step 1: Implement `docs-site/src/tabs/models.ts`**

```typescript
import { renderCodeBlock } from '../components/code-block';

const SNIPPETS: { title: string; code: string }[] = [
  {
    title: 'ValidationPatternType',
    code:
`export type ValidationPatternType =
  | 'EMAIL' | 'PHONE' | 'VN_PHONE' | 'VN_ID'
  | 'PASSPORT' | 'VN_ID_OR_PASSPORT' | 'TIME'
  | 'URL' | 'DOMAIN' | 'IPV4' | 'IPV6' | 'IMAGE_URL' | 'SLUG'
  | 'NUMBER' | 'INTEGER' | 'DECIMAL' | 'POSITIVE_NUMBER'
  | 'UUID' | 'CODE_16' | 'CODE_32' | 'HEX_COLOR' | 'BASE64';`,
  },
  {
    title: 'ValidationPattern',
    code:
`export interface ValidationPattern {
  type: ValidationPatternType;
  name: string;         // i18n key
  pattern: string;      // regex string → pass to Validators.pattern()
  errorMessage: string; // i18n key
}`,
  },
  {
    title: 'Filter<T>',
    code:
`export type Filter<T> =
  | FilterHasData<T>
  | FilterBetween<T>
  | FilterNoData<T>
  | FilterAndOr<T>;

export interface FilterHasData<T> {
  field: NestedKeyOf<T>;
  operator: OperatorHasData;
  data: unknown;
}

export interface FilterBetween<T> {
  field: NestedKeyOf<T>;
  operator: 'BETWEEN';
  from: unknown;
  to: unknown;
}

export interface FilterAndOr<T> {
  operator: 'AND' | 'OR';
  filters: Filter<T>[];
}`,
  },
  {
    title: 'PagingReq<T> / PagingRes<T>',
    code:
`export interface PagingReq<T> extends QueryReq<T> {
  pageSize: number;
  pageNumber: number;
  orders?: Order<T>[];
}

export interface PagingRes<T> {
  items: T[];
  total: number;
}`,
  },
  {
    title: 'MaybeAsync<T>',
    code:
`export type MaybeAsync<T> = T | Promise<T> | Observable<T>;

// Resolve any variant → Promise<T>  (requires rxjs)
const result = await resolveMaybeAsync(value);

// Normalize any variant → Observable<T>  (requires rxjs)
const obs$ = normalizeAsync(value);`,
  },
];

export function renderModels(el: HTMLElement): void {
  el.innerHTML = '';
  for (const s of SNIPPETS) {
    const section = document.createElement('div');
    section.className = 'section';
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = s.title;
    section.appendChild(title);
    section.appendChild(renderCodeBlock(s.code));
    el.appendChild(section);
  }
}
```

- [ ] **Step 2: Verify in browser**

Click "Models" tab. Expected: 5 sections with dark code blocks showing type definitions.

- [ ] **Step 3: Commit**

```bash
git add docs-site/src/tabs/models.ts
git commit -m "feat(docs-site): models tab — TS type definitions as code blocks"
```

---

## Task 5: Validation Playground tab

**Files:**
- Modify: `docs-site/src/tabs/validation.ts`

- [ ] **Step 1: Implement `docs-site/src/tabs/validation.ts`**

```typescript
import { ValidationUtilities } from '@sdcorejs/utils/fns';
import { VALIDATION_PATTERNS } from '@sdcorejs/utils/constants';
import type { ValidationPatternType } from '@sdcorejs/utils/models';
import { renderResultBadge } from '../components/result-badge';

const GROUPS: { label: string; types: ValidationPatternType[] }[] = [
  { label: 'Vietnamese',   types: ['VN_PHONE', 'VN_ID', 'VN_ID_OR_PASSPORT'] },
  { label: 'Common',       types: ['EMAIL', 'PHONE', 'PASSPORT', 'TIME'] },
  { label: 'Web / Network',types: ['URL', 'DOMAIN', 'IPV4', 'IPV6', 'IMAGE_URL', 'SLUG'] },
  { label: 'Numeric',      types: ['NUMBER', 'INTEGER', 'DECIMAL', 'POSITIVE_NUMBER'] },
  { label: 'Identifiers',  types: ['UUID', 'CODE_16', 'CODE_32', 'HEX_COLOR', 'BASE64'] },
];

export function renderValidation(el: HTMLElement): void {
  el.innerHTML = `
    <div class="section-title">Validation Playground</div>
    <div class="split">
      <div class="panel">
        <div class="panel-title">Input</div>
        <div style="margin-bottom:12px">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Value</label>
          <input type="text" id="val-input" placeholder="Enter a value to validate…" />
        </div>
        <div style="margin-bottom:16px">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Pattern</label>
          <select id="val-type"></select>
        </div>
        <button class="btn-primary" id="val-btn">Validate</button>
      </div>
      <div class="panel" id="val-result-panel">
        <div class="panel-title">Result</div>
        <div id="val-result" style="min-height:160px">
          <p style="color:var(--text-muted);font-size:13px">Enter a value to validate.</p>
        </div>
      </div>
    </div>
  `;

  // Populate dropdown with optgroups
  const select = el.querySelector<HTMLSelectElement>('#val-type')!;
  for (const group of GROUPS) {
    const og = document.createElement('optgroup');
    og.label = group.label;
    for (const type of group.types) {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      og.appendChild(opt);
    }
    select.appendChild(og);
  }

  const input   = el.querySelector<HTMLInputElement>('#val-input')!;
  const resultEl = el.querySelector<HTMLDivElement>('#val-result')!;

  const run = (): void => {
    const type  = select.value as ValidationPatternType;
    const value = input.value;
    if (!value) {
      resultEl.innerHTML = '<p style="color:var(--text-muted);font-size:13px">Enter a value to validate.</p>';
      return;
    }
    const valid   = ValidationUtilities.validate(type, value);
    const pattern = VALIDATION_PATTERNS.find(p => p.type === type)?.pattern ?? '';

    resultEl.innerHTML = '';
    resultEl.appendChild(renderResultBadge(valid));
    resultEl.innerHTML += `
      <div style="margin-top:12px;font-size:12px;color:var(--text-muted)">Pattern type</div>
      <div style="font-family:monospace;font-weight:600;color:var(--primary);margin-top:2px">${type}</div>
      <div style="margin-top:12px;font-size:12px;color:var(--text-muted)">Regex</div>
      <div style="font-family:monospace;font-size:11px;color:var(--text-muted);margin-top:4px;word-break:break-all">${pattern}</div>
      <div style="margin-top:16px">
        <pre class="code-block" style="font-size:11px">ValidationUtilities.validate('${type}', '${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')
// → ${valid}</pre>
      </div>
    `;
  };

  let timer: ReturnType<typeof setTimeout>;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 300); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(timer); run(); } });
  el.querySelector('#val-btn')!.addEventListener('click', run);
  select.addEventListener('change', run);
}
```

- [ ] **Step 2: Verify in browser**

Click "Validation Playground" tab. Expected:
- Two-column layout: left has text input + grouped dropdown + Validate button
- Type `user@example.com`, select `EMAIL` → right panel shows green ✓ valid badge, regex, code snippet
- Type `notanemail` → red ✗ invalid badge
- Changing dropdown with same input re-runs automatically

- [ ] **Step 3: Commit**

```bash
git add docs-site/src/tabs/validation.ts
git commit -m "feat(docs-site): validation playground — live split-view validator"
```

---

## Task 6: Functions Demo tab

**Files:**
- Modify: `docs-site/src/tabs/functions.ts`

- [ ] **Step 1: Implement `docs-site/src/tabs/functions.ts`**

```typescript
import { StringUtilities, ValidationUtilities, DateUtilities, NumberUtilities } from '@sdcorejs/utils/fns';
import { renderResultBadge } from '../components/result-badge';

type SubTab = 'string' | 'validation' | 'date' | 'number';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'string',     label: 'StringUtilities' },
  { id: 'validation', label: 'ValidationUtilities' },
  { id: 'date',       label: 'DateUtilities' },
  { id: 'number',     label: 'NumberUtilities' },
];

export function renderFunctions(el: HTMLElement): void {
  el.innerHTML = '';

  const subTabBar  = document.createElement('div');
  subTabBar.className = 'sub-tabs';
  const contentArea = document.createElement('div');
  let active: SubTab = 'string';

  const RENDER: Record<SubTab, (el: HTMLElement) => void> = {
    string:     renderStringDemos,
    validation: renderValidationDemos,
    date:       renderDateDemos,
    number:     renderNumberDemos,
  };

  for (const tab of SUB_TABS) {
    const btn = document.createElement('button');
    btn.className = `sub-tab-btn${tab.id === active ? ' active' : ''}`;
    btn.dataset.subtab = tab.id;
    btn.textContent = tab.label;
    btn.addEventListener('click', () => {
      active = tab.id;
      subTabBar.querySelectorAll<HTMLButtonElement>('.sub-tab-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.subtab === tab.id)
      );
      contentArea.innerHTML = '';
      RENDER[tab.id](contentArea);
    });
    subTabBar.appendChild(btn);
  }

  el.appendChild(subTabBar);
  el.appendChild(contentArea);
  RENDER[active](contentArea);
}

// ── helpers ───────────────────────────────────────────────────────

function mkInput(placeholder: string, value = ''): HTMLInputElement {
  const el = document.createElement('input');
  el.type = 'text'; el.placeholder = placeholder; el.value = value; el.style.flex = '1';
  return el;
}

function mkOutput(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'demo-output';
  return el;
}

function mkRow(label: string, inputEl: HTMLElement, outputEl: HTMLElement): HTMLElement {
  const row = document.createElement('div');
  row.className = 'demo-row';
  const lbl = document.createElement('div');
  lbl.className = 'demo-label';
  lbl.textContent = label;
  row.append(lbl, inputEl, outputEl);
  return row;
}

// ── StringUtilities demos ─────────────────────────────────────────

function renderStringDemos(el: HTMLElement): void {
  // changeAliasLowerCase
  const aliasIn = mkInput('Nhập tiếng Việt…', 'Nguyễn Văn Anh');
  const aliasOut = mkOutput();
  const updateAlias = (): void => { aliasOut.textContent = StringUtilities.changeAliasLowerCase(aliasIn.value); };
  aliasIn.addEventListener('input', updateAlias);
  updateAlias();
  el.appendChild(mkRow('changeAliasLowerCase(s)', aliasIn, aliasOut));

  // format
  const fmtTpl = mkInput('Template', 'Hello {0}, bạn {1} tuổi');
  const fmtArgs = mkInput('Args (comma-separated)', 'World, 25');
  const fmtOut = mkOutput();
  const updateFmt = (): void => {
    fmtOut.textContent = StringUtilities.format(fmtTpl.value, ...fmtArgs.value.split(',').map(s => s.trim()));
  };
  fmtTpl.addEventListener('input', updateFmt);
  fmtArgs.addEventListener('input', updateFmt);
  updateFmt();
  el.appendChild(mkRow('format(template, ...args)', fmtTpl, fmtOut));
  el.appendChild(mkRow('args', fmtArgs, document.createElement('div')));

  // encrypt / decrypt round-trip
  const encIn = mkInput('JSON value', '{"id":1,"name":"test"}');
  const encOut = mkOutput();
  const decOut = mkOutput();
  const updateEnc = (): void => {
    try {
      const enc = StringUtilities.encrypt(JSON.parse(encIn.value));
      encOut.textContent = enc;
      decOut.textContent = JSON.stringify(StringUtilities.decrypt(enc));
    } catch {
      encOut.textContent = 'Invalid JSON';
      decOut.textContent = '';
    }
  };
  encIn.addEventListener('input', updateEnc);
  updateEnc();
  el.appendChild(mkRow('encrypt(obj)', encIn, encOut));
  el.appendChild(mkRow('decrypt(encrypted)', document.createElement('div'), decOut));
}

// ── ValidationUtilities quick-test ───────────────────────────────

function renderValidationDemos(el: HTMLElement): void {
  const cases: { fn: string; placeholder: string; test: (v: string) => boolean }[] = [
    { fn: 'isEmail',    placeholder: 'user@example.com',                          test: ValidationUtilities.isEmail },
    { fn: 'isUrl',      placeholder: 'https://example.com',                        test: ValidationUtilities.isUrl },
    { fn: 'isUuid',     placeholder: '550e8400-e29b-41d4-a716-446655440000',       test: ValidationUtilities.isUuid },
    { fn: 'isIpv4',     placeholder: '192.168.1.1',                                test: ValidationUtilities.isIpv4 },
    { fn: 'isVnPhone',  placeholder: '0912345678',                                 test: ValidationUtilities.isVnPhone },
    { fn: 'isHexColor', placeholder: '#1A2B3C',                                    test: ValidationUtilities.isHexColor },
  ];
  for (const c of cases) {
    const inp = mkInput(c.placeholder);
    const out = document.createElement('div');
    out.style.flex = '0 0 auto';
    const update = (): void => {
      out.innerHTML = '';
      if (inp.value) out.appendChild(renderResultBadge(c.test(inp.value)));
    };
    inp.addEventListener('input', update);
    el.appendChild(mkRow(`ValidationUtilities.${c.fn}(v)`, inp, out));
  }
}

// ── DateUtilities demos ───────────────────────────────────────────

function renderDateDemos(el: HTMLElement): void {
  // toFormat
  const dateIn = document.createElement('input');
  dateIn.type = 'date';
  dateIn.value = new Date().toISOString().slice(0, 10);
  dateIn.style.flex = '1';
  const fmtIn  = mkInput('Format string', 'dd/MM/yyyy HH:mm');
  const fmtOut = mkOutput();
  const updateDateFmt = (): void => {
    try { fmtOut.textContent = DateUtilities.toFormat(new Date(dateIn.value), fmtIn.value); }
    catch { fmtOut.textContent = 'Invalid date'; }
  };
  dateIn.addEventListener('input', updateDateFmt);
  fmtIn.addEventListener('input', updateDateFmt);
  updateDateFmt();
  el.appendChild(mkRow('toFormat(date, format)', dateIn, fmtOut));
  el.appendChild(mkRow('format string', fmtIn, document.createElement('div')));

  // timeDifference
  const pastIn = document.createElement('input');
  pastIn.type = 'date';
  pastIn.style.flex = '1';
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  pastIn.value = twoWeeksAgo.toISOString().slice(0, 10);
  const diffOut = mkOutput();
  const updateDiff = (): void => {
    try { diffOut.textContent = DateUtilities.timeDifference(new Date(pastIn.value)); }
    catch { diffOut.textContent = 'Invalid date'; }
  };
  pastIn.addEventListener('input', updateDiff);
  updateDiff();
  el.appendChild(mkRow('timeDifference(past)', pastIn, diffOut));
}

// ── NumberUtilities demos ─────────────────────────────────────────

function renderNumberDemos(el: HTMLElement): void {
  // toVNCurrency
  const vnIn  = mkInput('Number', '1234567.89');
  const vnOut = mkOutput();
  const updateVn = (): void => {
    const n = parseFloat(vnIn.value);
    vnOut.textContent = isNaN(n) ? 'Invalid' : NumberUtilities.toVNCurrency(n);
  };
  vnIn.addEventListener('input', updateVn);
  updateVn();
  el.appendChild(mkRow('toVNCurrency(n)', vnIn, vnOut));

  // round
  const rndIn    = mkInput('Number',  '3.14159');
  const digitsIn = mkInput('Digits',  '2');
  const rndOut   = mkOutput();
  const updateRnd = (): void => {
    const n = parseFloat(rndIn.value);
    const d = parseInt(digitsIn.value, 10);
    rndOut.textContent = isNaN(n) || isNaN(d) ? 'Invalid' : String(NumberUtilities.round(n, d));
  };
  rndIn.addEventListener('input', updateRnd);
  digitsIn.addEventListener('input', updateRnd);
  updateRnd();
  el.appendChild(mkRow('round(n, digits)', rndIn, rndOut));
  el.appendChild(mkRow('digits', digitsIn, document.createElement('div')));
}
```

- [ ] **Step 2: Verify in browser**

Click "Functions Demo" tab. Expected:
- Four sub-tabs: StringUtilities / ValidationUtilities / DateUtilities / NumberUtilities
- **StringUtilities**: type Vietnamese text → see normalized output live; template format works; encrypt/decrypt round-trip
- **ValidationUtilities**: type into inputs → green/red badge appears instantly
- **DateUtilities**: pick a date → see formatted output; pick past date → "X days ago"-style text
- **NumberUtilities**: type number → `1.234.568 ₫` format; change digits → rounded result

- [ ] **Step 3: Commit**

```bash
git add docs-site/src/tabs/functions.ts
git commit -m "feat(docs-site): functions demo tab — String/Validation/Date/Number live demos"
```

---

## Task 7: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/deploy-docs.yml`

- [ ] **Step 1: Create `.github/workflows/deploy-docs.yml`**

```yaml
name: Deploy Docs to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: docs-site/package-lock.json

      - name: Install docs-site deps
        run: npm ci
        working-directory: docs-site

      - name: Build docs site
        run: npm run build
        working-directory: docs-site

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs-site/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

Note: Only `docs-site/package-lock.json` is cached — no root deps needed because Vite resolves `@sdcorejs/utils` directly from source via `resolve.alias`.

- [ ] **Step 2: Enable GitHub Pages in repository settings**

Go to: `https://github.com/sdcorejs/sdcorejs-ultis/settings/pages`

Set **Source** → **GitHub Actions** (not a branch).

- [ ] **Step 3: Commit and push to trigger deploy**

```bash
git add .github/workflows/deploy-docs.yml
git commit -m "ci: deploy docs site to GitHub Pages on push to main"
git push origin main
```

- [ ] **Step 4: Verify deployment**

Go to: `https://github.com/sdcorejs/sdcorejs-ultis/actions`

Expected: workflow `Deploy Docs to GitHub Pages` runs and shows green ✓.

Then open: `https://sdcorejs.github.io/sdcorejs-ultis/`

Expected: teal header with `@sdcorejs/utils`, four tabs, Validation Playground loads as default tab.

---

## Self-Review

**Spec coverage:**
- ✅ Constants tab: VALIDATION_PATTERNS searchable table, OPERATORS, SUPPORTED_LANGUAGES
- ✅ Models tab: ValidationPatternType, ValidationPattern, Filter, Paging, MaybeAsync
- ✅ Validation Playground: split view, grouped dropdown, live 300ms debounce, result badge + regex + code snippet
- ✅ Functions Demo: StringUtilities (changeAliasLowerCase, format, encrypt/decrypt), ValidationUtilities quick-test (isEmail, isUrl, isUuid, isIpv4, isVnPhone, isHexColor), DateUtilities (toFormat, timeDifference), NumberUtilities (toVNCurrency, round)
- ✅ GitHub Actions workflow: push main → build → deploy-pages
- ✅ `base: '/sdcorejs-ultis/'` in vite.config.ts
- ✅ `file:../` avoided — aliases point directly to TypeScript source

**Placeholder scan:** No TBD, no "add error handling" vagueness — all error cases handled inline (Invalid JSON, Invalid date, Invalid number).

**Type consistency:** `ValidationPatternType` used in `validation.ts` matches what `validation.fns.ts` exports. `ValidationUtilities.validate`, `.isEmail`, `.isVnPhone`, etc. match the actual `ValidationUtilities` API from Task 5 of the library.
