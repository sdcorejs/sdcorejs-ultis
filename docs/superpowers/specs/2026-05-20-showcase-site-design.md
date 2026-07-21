# Showcase Site Design

> [!IMPORTANT]
> This is a historical design snapshot, not current API documentation.
> For v1.2.0 behavior, use [README](../../../README.md) and [migration guidance](../../../MIGRATION-1.2.md).

**Goal:** A static interactive playground for `@sdcorejs/utils` — showcases constants, models, and live function demos; auto-deployed to GitHub Pages on every push to `main`.

**Architecture:** Vite 5 + vanilla TypeScript, single-page app with four tab sections. Imports `@sdcorejs/utils` source directly (no npm publish required during development). Build outputs to `docs-site/dist/` and is deployed via GitHub Actions using `actions/deploy-pages`.

**Tech Stack:** Vite 5, TypeScript 5, no framework. Teal/Emerald theme (`#0f766e` header, `#14b8a6` accent, white content area).

---

## File Structure

```
docs-site/                         ← Vite project root
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  src/
    main.ts                        ← mounts tabs, router
    style.css                      ← global theme (teal variables)
    tabs/
      constants.ts                 ← renders VALIDATION_PATTERNS + OPERATORS tables
      models.ts                    ← renders type definitions as code blocks
      validation.ts                ← interactive playground (split view)
      functions.ts                 ← demos for String/Date/Number utilities
    components/
      tab-bar.ts                   ← tab navigation component
      code-block.ts                ← syntax-highlighted <pre> wrapper
      result-badge.ts              ← ✓/✗ result indicator

.github/
  workflows/
    deploy-docs.yml                ← build docs-site + deploy to GitHub Pages
```

---

## Sections

### 1. Constants tab

Renders three tables:

**VALIDATION_PATTERNS** — searchable table with columns: `type`, `pattern` (truncated with expand-on-click), sample valid input. Filter by typing in a search box above the table.

**OPERATORS** — table with columns: `value`, `symbol`, `display`.

**SUPPORTED_LANGUAGES** — simple list of values.

### 2. Models tab

Displays TypeScript interface/type definitions as syntax-highlighted code blocks. Content is static strings (not runtime-generated). Sections: `ValidationPatternType`, `ValidationPattern`, `Filter<T>`, `PagingReq<T>` / `PagingRes<T>`, `MaybeAsync<T>`.

### 3. Validation Playground tab (main feature)

Split-view layout:

**Left panel — input:**
- Text input: value to validate
- Dropdown: select `ValidationPatternType` (22 options, grouped: Vietnamese / Web-Network / Numeric / Identifiers)
- "Validate" button (also runs on Enter / live-on-input after 300ms debounce)

**Right panel — result:**
- Large ✓ (green) or ✗ (red) with `valid` / `invalid` label
- Pattern type name + matched regex string
- Live code snippet: `ValidationUtilities.validate('EMAIL', 'user@example.com')`

### 4. Functions Demo tab

Four sub-tabs:

**StringUtilities:**
- `changeAliasLowerCase(s)` — text input, shows normalized output live
- `format(template, ...args)` — template + args input, shows interpolated result
- `encrypt(obj)` / `decrypt(str)` — JSON input → encrypted, with decrypt round-trip

**ValidationUtilities:**
- `isEmail`, `isUrl`, `isUuid`, `isIpv4` — quick-test inputs, shows true/false badge

**DateUtilities:**
- `toFormat(date, format)` — date picker + format string → formatted output
- `timeDifference(past)` — date picker → "3 days ago"-style result

**NumberUtilities:**
- `toVNCurrency(n)` — number input → Vietnamese formatted output
- `round(n, digits)` — number + digits → rounded result

---

## GitHub Actions Workflow

File: `.github/workflows/deploy-docs.yml`

Trigger: `push` to `main` branch.

Steps:
1. Checkout
2. Setup Node 20 with npm cache
3. Install root deps (`npm ci`) — needed to resolve `@sdcorejs/utils` source
4. Install docs-site deps (`npm ci` in `docs-site/`)
5. Build: `npm run build` in `docs-site/` (outputs to `docs-site/dist/`)
6. Configure Pages + upload artifact (`actions/upload-pages-artifact@v3`)
7. Deploy (`actions/deploy-pages@v5`)

The `docs-site/vite.config.ts` sets `base: '/sdcorejs-ultis/'` to match the GitHub Pages path.

`docs-site/package.json` references `@sdcorejs/utils` via workspace or relative path:
```json
"dependencies": {
  "@sdcorejs/utils": "file:../"
}
```
This means the site always reflects the current library source without needing a separate publish step.

---

## Permissions / Settings

GitHub repo must have:
- Settings → Pages → Source: **GitHub Actions**
- Workflow permissions: `contents: read`, `pages: write`, `id-token: write`

---

## Out of scope

- Dark mode toggle
- i18n / language switching
- Search across all sections globally
- Mobile layout (desktop-first only)
