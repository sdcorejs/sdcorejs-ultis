# Kế hoạch - Zero-based Paging, Remaining-risk Hardening và Bilingual Docs Portal - 2026-07-20 17:32

## Phạm vi

Thực thi approved spec `4a403a20324916140dbf9e8cfb01b12826e200f4914323cbe2d8e4e771aef2cb`: khóa toàn bộ paging helper về page `0`, xử lý line-ending/compatibility/runtime risks còn lại, và thay docs demo bằng portal Vite + TypeScript thuần song ngữ EN/VI. Kế hoạch bao gồm focused TDD, full validation, commit và push feature branch hiện tại; không merge `main`, tạo PR, publish, tag hoặc release.

Working tree đang chứa 36 tracked modifications và 22 untracked artifacts của đợt v1.2 đã được kiểm tra trước đó. Chúng là baseline dự kiến của cùng feature branch: executor được phép commit chúng sau khi review, nhưng chỉ được sửa những active paths được nêu trong tasks bên dưới.

## Execution context

- Track: `generic` (`node` + `documentation`).
- Target root kind: `target-project`.
- Stack profile: `node-general-with-vanilla-vite-docs`.
- Coverage approach: `TDD` cho paging/router/search/i18n/registry; post-hoc interaction và manual browser checks cho visual/responsive/accessibility.
- Package manager: `npm`, xác nhận bởi `package-lock.json` ở root và `site/package-lock.json`; không có package-manager khác.
- Parallel candidates: có; paging, docs application core và content inventory có write scope tách được sau các shared-schema gates.
- Path check: 52 CREATE paths dự kiến chưa tồn tại; 30 EDIT/MIGRATE paths dự kiến đều tồn tại. Nếu trạng thái này đổi trước execution, dừng và báo conflict.

```yaml
plan_context:
  source: sdcorejs-plan
  contract_id: utils-zero-paging-bilingual-docs-20260720
  requirement_id: REQ-2026-07-20-001
  approved_spec_path: .sdcorejs/specs/general/2026-07-20-17-27-zero-based-paging-bilingual-docs.md
  approved_spec_hash: 4a403a20324916140dbf9e8cfb01b12826e200f4914323cbe2d8e4e771aef2cb
  approved_plan_path: .sdcorejs/plans/general/2026-07-20-18-06-zero-based-paging-bilingual-docs.md
  approved_plan_hash: b6250373fd79f74b33c935c9427b9ed2fd6023662499150f9cfd7737907c46a2
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-ultis
  target_root_kind: target-project
  track: general
  stack_profile: node-general-with-vanilla-vite-docs
  task_count: 31
  phase_count: 8
  allowed_paths:
    - .gitattributes
    - .editorconfig
    - .changeset/**
    - .github/workflows/**
    - .sdcorejs/docs/general/**
    - .sdcorejs/specs/general/**
    - .sdcorejs/plans/general/**
    - README.md
    - MIGRATION-1.2.md
    - SECURITY.md
    - RELEASE_NOTES-1.2.0.md
    - docs/superpowers/**
    - examples/**
    - scripts/**
    - src/**
    - site/**
    - package.json
    - package-lock.json
    - tsconfig.json
    - tsup.config.ts
    - vitest.config.ts
  active_edit_paths:
    - .gitattributes
    - .editorconfig
    - .changeset/secure-foundation-1-2.md
    - .github/workflows/ci.yml
    - .github/workflows/deploy-docs.yml
    - README.md
    - MIGRATION-1.2.md
    - SECURITY.md
    - RELEASE_NOTES-1.2.0.md
    - src/fns/utility.fns.ts
    - src/fns/array.fns.ts
    - src/models/paging.model.ts
    - src/fns/utility.fns.spec.ts
    - src/fns/utility.security.spec.ts
    - src/fns/array.fns.spec.ts
    - src/fns/array-validation.security.spec.ts
    - site/**
    - package.json
  baseline_commit_only_paths:
    - .github/workflows/publish.yml
    - docs/superpowers/plans/2026-05-20-sdcorejs-utils.md
    - docs/superpowers/plans/2026-05-20-showcase-site.md
    - docs/superpowers/specs/2026-05-20-sdcorejs-utils-design.md
    - docs/superpowers/specs/2026-05-20-showcase-site-design.md
    - examples/package-usage.ts
    - scripts/validate-package.mjs
    - src/errors.ts
    - src/fns/browser.fns.spec.ts
    - src/fns/browser.fns.ts
    - src/fns/date.fns.spec.ts
    - src/fns/date.fns.ts
    - src/fns/detect-incognito.fns.ts
    - src/fns/filter.fns.spec.ts
    - src/fns/filter.fns.ts
    - src/fns/filter.strict.spec.ts
    - src/fns/index.ts
    - src/fns/number.fns.ts
    - src/fns/object.security.spec.ts
    - src/fns/serialization.fns.spec.ts
    - src/fns/serialization.fns.ts
    - src/fns/string.fns.spec.ts
    - src/fns/string.fns.ts
    - src/fns/string.security.spec.ts
    - src/fns/validation.fns.spec.ts
    - src/fns/validation.fns.ts
    - src/index.ts
    - src/internal/encoding.ts
    - src/internal/property-path.ts
    - src/internal/security.spec.ts
    - src/internal/security.ts
    - src/models/filter.model.ts
    - src/models/maybe-async.model.spec.ts
    - src/models/maybe-async.model.ts
    - package-lock.json
    - tsconfig.json
    - tsup.config.ts
    - vitest.config.ts
  prohibited_paths:
    - .env
    - .env.*
    - node_modules/**
    - site/node_modules/**
    - dist/**
    - site/dist/**
    - coverage/**
    - .superpowers/**
    - any path outside target_root
    - direct manual edits under .git/**
  generated_artifacts:
    - dist/**
    - site/dist/**
    - coverage/**
    - node_modules/**
    - site/node_modules/**
    - '*.tgz'
    - temporary headless-browser screenshots and profiles
    - .sdcorejs/tasks/current-session.md
  docs_artifacts:
    - README.md
    - MIGRATION-1.2.md
    - SECURITY.md
    - RELEASE_NOTES-1.2.0.md
    - .changeset/secure-foundation-1-2.md
    - site/src/content/**
    - site/src/examples/**
    - .sdcorejs/docs/general/**
    - .sdcorejs/specs/general/**
    - .sdcorejs/plans/general/**
  dependency_changes:
    required: true
    packages:
      - site devDependency vitest matching root major/version policy
      - site devDependency jsdom matching root major/version policy
    approval_required: true
  env_changes:
    required: false
    files: []
    approval_required: false
  migration_changes:
    required: true
    description: Bỏ hai option chưa phát hành pageBase/initialPage, giữ PagingReq.pageNumber optional nhưng chỉ zero-based, và cập nhật migration guidance cho one-based transport adapter.
    approval_required: true
  verification_strategy:
    package_manager: npm
    scripts_detected:
      - name: typecheck
      - name: test
      - name: test:coverage
      - name: test:date
      - name: test:package
      - name: test:examples
      - name: validate
      - name: changeset
      - name: site:dev
      - name: site:build
      - name: site:preview
    scripts_planned:
      - name: validate:site
      - name: validate:all
      - name: site:typecheck
      - name: site:test
      - name: site:validate:content
      - name: site:validate:build
      - name: site:validate
    commands_planned:
      - command_or_script: npm test -- src/fns/utility.fns.spec.ts src/fns/utility.security.spec.ts src/fns/array.fns.spec.ts src/fns/array-validation.security.spec.ts
        reason: Chứng minh zero-based contract và preserved paging safety.
      - command_or_script: npm run typecheck
        reason: Chứng minh public TypeScript contract không còn pageBase/initialPage.
      - command_or_script: npm --prefix site run test
        reason: Chứng minh router, i18n, search, registry và shell behavior.
      - command_or_script: npm --prefix site run validate
        reason: Chứng minh site typecheck, tests, bilingual/API coverage, build và bundle budget.
      - command_or_script: npm run validate:all
        reason: Chạy combined local release-readiness path sau khi script được thêm.
      - command_or_script: npm run test:date under UTC, Asia/Bangkok, America/New_York and Europe/Berlin
        reason: Giữ timezone guarantees của v1.2.
      - command_or_script: npm audit and npm audit --omit=dev at root; npm --prefix site audit
        reason: Không đưa vulnerability mới vào dependency graphs.
      - command_or_script: npm run changeset -- status
        reason: Xác nhận đúng một pending minor changeset và không publish.
      - command_or_script: git diff --check
        reason: Chứng minh line-ending/whitespace normalization.
      - command_or_script: headless Chrome or Edge against local preview at desktop, tablet and 320px viewport
        reason: Kiểm tra route rendering, overflow, mobile drawer, landmarks và screenshots tạm.
      - command_or_script: git push -u origin codex/utils-v1.2.0-security
        reason: Delivery đúng feature branch đã được người dùng cho phép.
      - command_or_script: gh run list/watch for codex/utils-v1.2.0-security
        reason: Theo dõi hosted CI sau push mà không tạo PR/merge/release.
    commands_skipped:
      - command_or_probe: actionlint
        reason: Không được cài; không tải probe mới. Dùng local YAML parse với js-yaml đã khóa trong install graph và hosted GitHub Actions.
      - command_or_probe: Playwright/Lighthouse installation
        reason: Không có trong project và không cần thêm browser framework; dùng jsdom interaction tests, browser headless đã phát hiện và manual checklist.
      - command_or_probe: GitHub Pages deployment
        reason: Deploy chỉ chạy khi merge main; main/release nằm ngoài phạm vi.
    focused_checks:
      - Callback page sequence luôn bắt đầu 0; invalid page options bị type/runtime loại bỏ.
      - Bilingual locale completeness, fallback, persistence và html lang.
      - Stable hash routing, anchors, back/forward, 404, focus restoration và search keyboard flow.
      - Public export/member inventory khớp API registry và exact package subpath imports.
      - Code snippets được typecheck từ real example modules; playground input không dùng unsafe HTML.
      - Initial JS plus CSS không quá 100 KiB gzip; 320px không page overflow.
    broad_checks:
      - Full root coverage/build/publint/ATTW/packed consumers/examples.
      - Full site validate/build and headless smoke.
      - Four-timezone date matrix.
      - Root full/production audits and site audit.
      - Workflow YAML parse and hosted CI status.
      - Final staged diff, changeset count, branch/ref and clean-worktree checks.
  parallel_candidates:
    allowed: true
    units:
      - id: P1
        title: Zero-based paging contract and focused tests
        allowed_paths:
          - src/fns/utility.fns.ts
          - src/fns/array.fns.ts
          - src/models/paging.model.ts
          - src/fns/utility*.spec.ts
          - src/fns/array*.spec.ts
        dependencies: []
      - id: P2
        title: Docs router, i18n, search and registry foundation
        allowed_paths:
          - site/src/app/**
          - site/src/content/types.ts
          - site/src/content/registry.ts
          - site/src/content/registry.spec.ts
        dependencies: []
      - id: P3
        title: Bilingual API and executable example corpus
        allowed_paths:
          - site/src/content/api.ts
          - site/src/content/api/**
          - site/src/content/examples.ts
          - site/src/examples/**
        dependencies:
          - P2
      - id: P4
        title: Bilingual guides/resources and public migration/security docs
        allowed_paths:
          - site/src/content/start.ts
          - site/src/content/guides.ts
          - site/src/content/resources.ts
          - README.md
          - MIGRATION-1.2.md
          - SECURITY.md
          - RELEASE_NOTES-1.2.0.md
          - .changeset/secure-foundation-1-2.md
        dependencies:
          - P1
          - P2
    shared_files:
      - path: site/package.json, site/package-lock.json, site/tsconfig.json, site/vite.config.ts
        coordination_strategy: parent-owned and sequential before content/UI fan-out
      - path: site/src/content/types.ts and site/src/content/registry.ts
        coordination_strategy: P2 owns schema; P3/P4 consume without concurrent edits
      - path: site/src/main.ts and site/src/style.css
        coordination_strategy: parent-owned during integration
      - path: package.json and .github/workflows/**
        coordination_strategy: parent-owned final integration
    conflict_risks:
      - Existing v1.2 dirty baseline overlaps active paging/docs files.
      - Registry schema changes can invalidate parallel content modules.
      - Locale keys, route IDs and symbol anchors must remain globally unique.
      - Package/lockfile and root workflow edits must never be concurrent.
  finish_tail:
    docs_before_final_branch_ready: true
    branch_ready_final_gate: true
  approval:
    approved: true
    approved_at: 2026-07-20T18:06:34+07:00
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Tasks

### Phase 1 - Working-tree preflight và repository normalization

1. **RUN** `git status --short`, staged/unstaged diffstats, untracked inventory, current branch/HEAD và authoring-repo guard - so sánh với baseline `codex/utils-v1.2.0-security` tại `0b887d076bacc5924547481aca2aeaf53d04080e`; nếu xuất hiện unrelated dirty file mới thì dừng và xin quyết định trước khi edit.
2. **CREATE** `.gitattributes` và `.editorconfig` - khóa UTF-8/LF/final-newline/indentation, giữ binary patterns và Windows-native script exceptions cần thiết; kiểm tra bằng `git diff --check` mà không renormalize ngoài approved scope.

### Phase 2 - Strict zero-based paging bằng TDD

3. **EDIT** `src/fns/utility.fns.spec.ts`, `src/fns/utility.security.spec.ts`, `src/fns/array.fns.spec.ts`, `src/fns/array-validation.security.spec.ts` - thêm RED tests cho first callback page `0`, sequential pages, omitted page, rejected negative/unsafe values và compile-time removal của `pageBase`/`initialPage`, đồng thời giữ abort/limit/no-progress/total-change coverage.
4. **RUN** focused paging Vitest command - xác nhận test mới thất bại đúng vì contract cũ còn cho one-based/arbitrary start, không vì harness lỗi.
5. **EDIT** `src/fns/utility.fns.ts`, `src/fns/array.fns.ts`, `src/models/paging.model.ts` - bỏ `pageBase`/`initialPage`, bắt đầu `fetchAllByPaging` tại `0`, dùng offset `page * pageSize` và cập nhật TSDoc mà không làm yếu safety checks.
6. **RUN** focused paging tests và root `typecheck` - chuyển RED thành GREEN và chứng minh public declaration đúng zero-only.

### Phase 3 - Docs test harness, router, i18n, search và registry

7. **EDIT/CREATE** `site/package.json`, `site/package-lock.json`, `site/tsconfig.json`, `site/vite.config.ts`, `site/vitest.config.ts`, `site/scripts/validate-content.mjs`, `site/scripts/validate-build.mjs` - thêm Vitest/jsdom dev tooling, scripts typecheck/test/content/build-budget, Vite client/raw-module types, manifest output và aliases cho mọi supported package subpath.
8. **CREATE** `site/src/app/router.spec.ts`, `site/src/app/i18n.spec.ts`, `site/src/app/search.spec.ts` - viết RED-first contracts cho hash parsing/navigation/anchors/404, EN default + persisted VI/fallback, localized symbol search và keyboard shortcuts.
9. **CREATE** `site/src/app/router.ts`, `site/src/app/i18n.ts`, `site/src/app/search.ts` - triển khai pure/testable core, focus-safe navigation, stable locale-independent route IDs và deterministic search ranking để các test Phase 3 đạt.
10. **CREATE** `site/src/content/types.ts`, `site/src/content/registry.ts`, `site/src/content/registry.spec.ts` - định nghĩa typed EN/VI page/API/example schema, unique route/symbol invariants, lazy loaders và TypeScript-checker-based public export/member coverage contract.
11. **RUN** site core tests và typecheck tập trung - xác nhận router/i18n/search GREEN; giữ registry completeness test RED có chủ đích cho tới khi content ở Phase 4 được thêm.

### Phase 4 - Bilingual content, complete API và executable examples

12. **CREATE** `site/src/content/start.ts`, `site/src/content/guides.ts`, `site/src/content/resources.ts` - viết đầy đủ EN/VI cho Start/Guides/Resources, gồm security boundary, runtime support, v1.2 migration, zero-based adapter và các warning bắt buộc.
13. **CREATE** `site/src/content/api.ts` và `site/src/content/api/*.ts` theo nhóm constants/models/errors/string/array/number/date/filter/browser/color/object-utility/serialization/validation - lập inventory mọi public root/subpath export và utility member với exact import/signature/default/return/throws/security/example/deprecation data ở cả hai locale.
14. **CREATE** `site/src/content/examples.ts` và `site/src/examples/*.example.ts` - dùng real TypeScript modules làm source hiển thị/typecheck cho paging, AES-GCM, safe objects, canonical hash, dates/DST, filters, browser, MaybeAsync/RxJS, validation, arrays và typed errors.
15. **EDIT** `README.md`, `MIGRATION-1.2.md`, `SECURITY.md`, `RELEASE_NOTES-1.2.0.md`, `.changeset/secure-foundation-1-2.md` - đồng bộ zero-only contract, one-based transport mapping, Web Crypto/RxJS/incognito limits và portal scope; không mô tả `pageBase`/`initialPage` như public compatibility options.
16. **RUN** site registry/content tests, `typecheck` và validators - chuyển completeness contract GREEN, phát hiện thiếu locale/export/member/import hoặc example không compile trước UI integration.

### Phase 5 - Professional responsive UI và playground migration

17. **CREATE/EDIT** `site/src/styles/*.css`, `site/src/style.css`, `site/index.html` - xây tokenized blue/neutral visual system, sticky/sidebar/content/TOC layout, 1024/768/320px breakpoints, focus/contrast/touch/reduced-motion rules và metadata chuẩn UTF-8.
18. **CREATE/EDIT** `site/src/components/docs-layout.ts`, `search-dialog.ts`, `playground.ts`, `code-block.ts`, `result-badge.ts` - reusable semantic components cho breadcrumb, nav, TOC, API tables, callouts, search dialog, copy/live status và safe text rendering.
19. **CREATE/EDIT** `site/src/app/docs-shell.ts`, `site/src/app/docs-shell.spec.ts`, `site/src/main.ts` - kết nối registry/router/i18n/search với shell, mobile drawer, route titles, previous/next, focus restoration và localized 404.
20. **MIGRATE THEN DELETE** `site/src/tabs/*` và `site/src/components/tab-bar.ts` - chuyển validation/filter playground behavior sang shared Examples components, chứng minh parity bằng tests rồi xóa legacy in-memory tab architecture.
21. **RUN** site tests/typecheck/content validation/build/bundle validation và local headless-browser smoke - kiểm tra desktop/mobile routes, drawer, search, language persistence, overflow, semantic DOM và gzip budget trước integration.

### Phase 6 - Root validation path và CI integration

22. **EDIT** `package.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy-docs.yml` - thêm `validate:site`/`validate:all`, CI push coverage cho feature branch, isolated site install/validate job và Pages validation trước artifact; không đổi publish trigger hoặc tạo release path.
23. **RUN** local workflow YAML parse bằng installed `js-yaml`, root/site script discovery và `npm run validate:all` - chứng minh manifests, workflow syntax và combined validation path hoạt động từ package-manager evidence.

### Phase 7 - Full verification, review và scoped repair

24. **RUN** root `npm run validate`, packed consumers/examples, publint/ATTW và Changesets status - giữ toàn bộ packaging/release guarantees đã đạt ở v1.2.
25. **RUN** `test:date` trong UTC/Asia-Bangkok/America-New-York/Europe-Berlin cùng root full/production audits và site audit - kiểm tra timezone và dependency-risk regressions.
26. **RUN** site full validation, manifest-based gzip measurement và headless Chrome/Edge tại desktop/tablet/320px - hoàn tất automated + manual AC checklist cho routing, responsive, accessibility, content và bundle.
27. **REVIEW/EDIT** approved active paths only - audit code/security/accessibility/performance/content; sửa mọi finding xác nhận được, rồi chạy lại focused và broad checks bị ảnh hưởng cho tới khi sạch hoặc báo blocker rõ ràng.
28. **RUN** final `git diff --check`, UTF-8/replacement-character scan, `pageBase|initialPage` contract scan, generated-artifact scan, full `validate:all`, timezone/audit subset và final diff review - tạo bằng chứng branch-ready cuối trước khi stage.

### Phase 8 - Commit, push và hosted-CI confirmation

29. **RUN** `git add -A` sau approved-path review, rồi kiểm tra `git status --short`, `git diff --cached --stat`, `git diff --cached --check`, staged file manifest và đúng một minor changeset - stage toàn bộ intended v1.2 baseline + công việc mới, loại trừ checkpoint/generated/secrets.
30. **RUN** `git commit` với message mô tả v1.2 security/paging/bilingual docs, sau đó `git push -u origin codex/utils-v1.2.0-security` - lưu và đẩy feature branch đã được cấp quyền, không merge/PR/tag/release/publish.
31. **RUN** post-push final branch-ready checks: local worktree, local/remote commit equality, `main` unchanged, `gh run list/watch` cho pushed SHA và hosted CI conclusion - báo chính xác commit/branch/CI status; không thực hiện source write nào sau bước này.

## Acceptance mapping

- AC-001 đến AC-005 -> tasks 3-6.
- AC-006 -> tasks 5, 12, 15-16.
- AC-007 đến AC-009 -> tasks 8-10, 17-21.
- AC-010 đến AC-012 -> tasks 10, 13, 16.
- AC-013 đến AC-014 -> tasks 14, 18-21.
- AC-015 đến AC-018 -> tasks 8-10, 12-14, 19, 21.
- AC-019 đến AC-023 -> tasks 17-21, 26-27.
- AC-024 đến AC-025 -> tasks 14, 18-21, 27.
- AC-026 đến AC-027 -> tasks 7, 17, 21, 26.
- AC-028 -> tasks 2, 28-29.
- AC-029 -> tasks 12-15, 27.
- AC-030 -> tasks 3-4, 8, 10-11, 20-21.
- AC-031 -> tasks 21, 23-28, 31.
- AC-032 -> tasks 29-31.

## Verification

- Focused paging Vitest suite + root `typecheck`.
- Site `test`, `typecheck`, public API/translation/example validator, production build và 100 KiB gzip budget.
- Root `validate:all`, package consumers/examples, publint, ATTW và Changesets status.
- Date matrix: UTC, Asia/Bangkok, America/New_York, Europe/Berlin.
- Root `npm audit`, `npm audit --omit=dev` và site audit.
- Local workflow YAML parse; hosted GitHub Actions sau push.
- Manual/headless: desktop, tablet và 320px responsive; drawer/search/EN-VI/deep-link/keyboard/focus/contrast/reduced-motion checklist.
- Final staged diff, exact changeset count, clean worktree, local/remote SHA và unchanged `main`.
