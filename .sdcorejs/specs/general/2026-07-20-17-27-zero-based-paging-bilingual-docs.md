---
name: zero-based-paging-bilingual-docs
description: Khóa contract zero-based paging, remaining-risk hardening và docs portal EN/VI đã được duyệt.
contract_id: utils-zero-paging-bilingual-docs-20260720
requirement_id: REQ-2026-07-20-001
approvedAt: 2026-07-20T17:27:42+07:00
approvedBy: nghiatt15@onemount.com
approval_source: explicit-user-choice
track: general
target_root_kind: target-project
stack_profile: node-general-with-vanilla-vite-docs
profile_confidence: high
sourceDraftPath: .sdcorejs/docs/general/2026-07-20-17-19-zero-based-paging-bilingual-docs-spec.md
approved_spec_hash: 4a403a20324916140dbf9e8cfb01b12826e200f4914323cbe2d8e4e771aef2cb
acceptance_criteria_count: 32
manual_criteria_count: 4
redaction_applied: false
supersedes: null
change_control:
  revision: 1
  supersedes: null
  change_reason: null
---

# Zero-based Paging, Remaining-risk Hardening và Bilingual Docs Portal - Approved Spec

> Snapshot của contract đã được người dùng phê duyệt tại cổng `sdcorejs-spec`. Không chỉnh sửa thủ công; mọi thay đổi contract phải được tạo revision mới qua `sdcorejs-spec`.

## Approved contract

# Đặc tả - Zero-based Paging, Remaining-risk Hardening và Bilingual Docs Portal - 2026-07-20 17:19

```yaml
spec_context:
  source: sdcorejs-spec
  contract_id: utils-zero-paging-bilingual-docs-20260720
  requirement_id: REQ-2026-07-20-001
  approved_spec_path: .sdcorejs/specs/general/2026-07-20-17-27-zero-based-paging-bilingual-docs.md
  approved_spec_hash: 4a403a20324916140dbf9e8cfb01b12826e200f4914323cbe2d8e4e771aef2cb
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-ultis
  target_root_kind: target-project
  track: general
  stack_profile: node-general-with-vanilla-vite-docs
  profile_confidence: high
  source_requirement_context: các quyết định đã xác nhận trong hội thoại và kết quả audit chỉ đọc trên working tree v1.2 hiện tại
  acceptance_criteria_count: 32
  manual_criteria_count: 4
  non_goals:
    - Thay Vite và TypeScript thuần bằng React, VitePress hoặc UI framework khác.
    - Merge vào main, publish npm, tạo tag hoặc phát hành release.
    - Khôi phục phân trang one-based hoặc bắt đầu từ trang tùy ý.
    - Nới lỏng strict validation, security boundary hoặc typed-error contract của v1.2.
  risks:
    - Consumer dùng endpoint one-based phải chuyển đổi tại transport boundary vì helper chỉ phát page number zero-based.
    - Kho API song ngữ có thể lệch hoặc thiếu bản dịch nếu không có structural validation.
    - Nội dung tĩnh lớn có thể làm tăng initial bundle nếu không tách theo route.
    - Unit test không thể tự chứng minh toàn bộ chất lượng trình duyệt và accessibility.
    - Hosted CI phụ thuộc trạng thái remote branch và GitHub Actions sau khi push.
  assumptions:
    - PagingReq.pageNumber tiếp tục optional nhưng chỉ có nghĩa là zero-based index, với trang đầu tiên là 0.
    - pageBase và initialPage là bổ sung chưa phát hành trong working tree v1.2; loại bỏ chúng là khôi phục contract đã phát hành, không xóa feature công khai đã release.
    - Site tiếp tục là static GitHub Pages tại /sdcorejs-utils/ và dùng hash routes.
    - Mọi trang tài liệu do dự án sở hữu đều có tiếng Anh và tiếng Việt; lần truy cập đầu mặc định tiếng Anh.
    - Locale được lưu cục bộ; không thêm analytics, tài khoản, backend hoặc remote content service.
    - Paging, router, search và i18n dùng RED-first; responsive và accessibility có kiểm tra sau triển khai phù hợp với trình duyệt.
    - Công việc giữ trên codex/utils-v1.2.0-security, được commit và push lên origin nhưng không merge hoặc release.
  redaction_applied: false
  approval:
    approved: true
    approved_at: 2026-07-20T17:27:42+07:00
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Vấn đề và mục tiêu

Working tree v1.2 hiện đã mặc định phân trang từ `0`, nhưng hai option mới `pageBase` và `initialPage` vẫn cho phép helper chạy từ `1` hoặc bỏ qua các trang đầu. Điều này tạo hai contract cho cùng một API và khiến `fetchAllByPaging` có thể không còn thực sự lấy toàn bộ dữ liệu. Đồng thời, docs site hiện chỉ là năm tab lưu state trong bộ nhớ, chưa có route bền vững, sidebar trái, search, API reference đầy đủ, nội dung song ngữ, responsive và accessibility chuyên nghiệp.

Thay đổi này thiết lập một invariant duy nhất xuyên suốt runtime, type, test, example và migration docs: trang đầu tiên luôn là `0`. Các remaining risks có thể xử lý trong repository cũng được khắc phục. Docs demo được thay bằng static portal EN/VI để developer có thể cài package, hiểu runtime/security boundary, tìm mọi public API, mở deep link ổn định, sao chép/chạy example đúng và đổi ngôn ngữ mà không mất ngữ cảnh.

Người dùng chính là TypeScript developer đang đánh giá hoặc tích hợp `@sdcorejs/utils`, cùng maintainer kiểm tra hành vi và migration của v1.2.

## Ngoài phạm vi

- Không chuyển sang React, VitePress, Next.js hoặc runtime UI framework khác.
- Không thêm SSR, backend, authentication, analytics, comments hoặc remote CMS.
- Không hỗ trợ `pageBase` one-based, `initialPage` kiểu resume hoặc tự suy đoán page base của endpoint.
- Không làm yếu malformed-response detection, abort, page limit, safe-integer guard, strict parsing, Web Crypto requirement hoặc prototype-pollution defense.
- Không merge `main`, tạo PR, publish npm, tạo tag hay GitHub Release trong phạm vi này.
- Không cam kết incognito detection là đáng tin cậy hoặc phù hợp cho security decision.

## Kiến trúc

### Paging contract

`fetchAllByPaging` giữ các option an toàn của v1.2 gồm `maxPages`, `signal` và `totalChangePolicy`, nhưng bỏ `pageBase` và `initialPage`. Mọi lần gọi đều bắt đầu callback với `pageNumber === 0`, sau đó tăng tuần tự qua các safe integer. Response validation, repeated-page/no-progress detection, total-change policy, abort behavior và page limit phải được giữ nguyên.

`ArrayUtilities.paging` chỉ còn một zero-based signature. Bỏ qua `page` nghĩa là trang `0`; page hoặc page size âm, thập phân, vô hạn hay vượt safe integer phải ném `ValidationError`. Offset luôn là `page * pageSize`. `PagingReq.pageNumber` vẫn optional để tương thích server default, nhưng semantic công khai chỉ là zero-based.

### Documentation application shell

Site vẫn là Vite + TypeScript DOM APIs, không thêm UI framework. Một typed page registry là nguồn sự thật chung cho route, navigation group, localized title/summary/keywords, symbol anchor và page renderer. Shell gồm sticky header, package identity, global search, language switcher, mobile navigation, sidebar trái theo nhóm, content column có breadcrumb và previous/next, cùng right-side TOC khi trang và viewport phù hợp.

Dưới desktop breakpoint, sidebar trở thành drawer và content về một cột. Router dùng stable English hash identifiers độc lập locale, hỗ trợ direct entry, refresh, back/forward, symbol anchor, focus restoration, route-specific title và localized not-found page. Search index sinh từ cùng registry, tìm theo localized title/keyword/API symbol/anchor và mở bằng `/` hoặc `Ctrl/Cmd+K` mà không chặn thao tác trong input.

### Information architecture và nội dung

- **Start:** overview, installation/quick start, package exports, runtime support, upgrade v1.2 và security boundaries.
- **Guides:** encryption so với obfuscation, safe objects/property paths, serialization/hashing, dates/time zones/DST, filters, browser workflows, strict zero-based paging, validation/numbers và `MaybeAsync`/optional RxJS.
- **API Reference:** mọi public model, constant, function, utility namespace, option type và typed error từ root cùng các supported subpath exports.
- **Examples:** page-0 pagination, AES-GCM, safe clone/merge/path, canonical hashing, dates/DST, filters, upload/download/clipboard, Promise/subscribable/RxJS, validation, arrays và typed errors.
- **Resources:** migration 1.2, security policy, release notes và repository links.

Mỗi API entry phải có mục đích, exact import path, signature, parameters/defaults, return behavior, thrown errors, runtime/security note, example và deprecation replacement nếu có. Validation/filter playground hiện tại được giữ lại trong Examples nhưng dùng shared components. API inventory, examples và locale pairs phải được structural validation để thiếu export hoặc translation sẽ làm local/CI check thất bại.

### Localization

Route và symbol ID không đổi theo locale. Lần đầu hiển thị English. Chọn Vietnamese hoặc English phải đổi toàn bộ shell/page/search, cập nhật root `lang`, giữ nguyên route/anchor, phát accessible announcement và chỉ lưu locale trong local storage. Giá trị lưu không hợp lệ phải fallback English. Type/build validation yêu cầu đủ cả hai locale cho mọi page và navigation/search field đã đăng ký.

### Accessibility, responsive và visual system

Portal hướng tới WCAG 2.2 AA cho interface được triển khai: semantic landmarks, heading order, skip link, visible high-contrast focus, `aria-current`, label đúng, keyboard-operable drawer/search/language controls, live regions phù hợp và reduced-motion. Touch target chính tối thiểu 44 CSS pixels khi khả thi. Code/table có thể tự scroll ngang, nhưng page không được overflow ở viewport 320 CSS pixels.

Visual direction là developer docs gọn và hiện đại: neutral surfaces, blue accent rõ ràng, typography hierarchy mạnh, API table dễ đọc, callout/badge nhất quán, spacing/radius tokens dùng chung. Ưu tiên khả năng đọc lâu và đối chiếu code hơn hình trang trí. Page content được lazy-load để bilingual corpus không làm phình initial chunk.

### Remaining-risk hardening và delivery boundary

Repository khai báo rõ UTF-8/LF bằng editor rules và Git attributes, gồm binary exclusions, nhằm chặn CRLF churn và encoding regression. Security/migration content phải làm nổi bật strict-validation compatibility, Web Crypto availability, `MaybeAsync` runtime boundary và việc incognito detection đã deprecated, không đáng tin, không được dùng cho security decision.

Local validation là quality gate bắt buộc. CI đại diện cả library và docs validation. Khi mọi check đạt, toàn bộ intended working tree được commit trên `codex/utils-v1.2.0-security` và push lên `origin`. Workflow dừng lại, không merge, publish, tag, release hoặc tạo PR.

## Stack profile và technology assumptions

- Track: `general`, có concern `node` và `documentation`.
- Stack profile: `node-general-with-vanilla-vite-docs`.
- Bằng chứng: root package là TypeScript library dùng tsup/Vitest; site package dùng Vite/TypeScript không framework; Vite base là `/sdcorejs-utils/`; workflow hiện deploy `site/dist` lên GitHub Pages.
- Giữ Node.js 20/22/24, ESM/CJS/type entry points và static hosting hiện tại.
- Chỉ được thêm development-only test tooling cho site khi cần; không thêm production framework/dependency.
- Dùng hash routing, typed localized content, registry-derived search/navigation và route-level dynamic imports.

## Cấu trúc file

### Tạo mới

- `.gitattributes` - normalize text LF và khai báo binary patterns.
- `.editorconfig` - UTF-8, LF, final newline, indentation và whitespace defaults.
- `site/src/app/docs-shell.ts` - persistent docs shell và navigation state.
- `site/src/app/router.ts` - hash route, anchor, navigation và not-found handling.
- `site/src/app/i18n.ts` - locale selection, persistence, fallback và document language.
- `site/src/app/search.ts` - localized page/symbol search và ranking.
- `site/src/content/types.ts` và `site/src/content/registry.ts` - typed contracts cùng canonical registry.
- `site/src/content/start.ts`, `guides.ts`, `api.ts`, `examples.ts`, `resources.ts` - bilingual content modules.
- `site/src/components/docs-layout.ts`, `search-dialog.ts`, `playground.ts` - shared accessible components.
- `site/src/app/router.spec.ts`, `i18n.spec.ts`, `search.spec.ts` - RED-first behavior tests.
- `site/vitest.config.ts` - isolated site test configuration.

### Chỉnh sửa hoặc migrate

- `src/fns/utility.fns.ts` và `src/fns/array.fns.ts` - enforce zero-only paging.
- `src/models/paging.model.ts` - ghi rõ request contract zero-based.
- `src/fns/utility*.spec.ts` và `src/fns/array*.spec.ts` - page-0, invalid-value và preserved-safety tests.
- `README.md`, `MIGRATION-1.2.md`, `SECURITY.md`, `RELEASE_NOTES-1.2.0.md` và `.changeset/secure-foundation-1-2.md` - đồng bộ public guidance.
- `site/index.html`, `site/src/main.ts` và `site/src/style.css` - metadata, bootstrap và responsive design system mới.
- `site/package.json`, `site/package-lock.json` - typecheck/test/validate scripts cùng dev-only test tooling cần thiết.
- `site/src/components/code-block.ts`, `result-badge.ts`, `tab-bar.ts` và `site/src/tabs/*` - tái sử dụng playground hợp lệ, thay legacy tabs sau khi chứng minh parity.
- `package.json` - root docs-validation command và release-readiness integration phù hợp.
- `.github/workflows/ci.yml` và `.github/workflows/deploy-docs.yml` - validate library/site trước CI/Pages artifact.
- `scripts/validate-package.mjs` hoặc validator chuyên biệt tương đương - kiểm tra docs example/API coverage mà không làm yếu packed-consumer checks.

## Tiêu chí chấp nhận

- **AC-001:** `fetchAllByPaging` luôn gọi callback đầu tiên với `pageNumber === 0`, rồi tăng tuần tự cho tới khi hoàn tất.
- **AC-002:** `FetchAllByPagingOptions` không còn `pageBase` hoặc `initialPage`; public type và runtime không chấp nhận/đọc hai property này.
- **AC-003:** `ArrayUtilities.paging(items, pageSize)` trả trang `0`; truyền `n` dùng offset `n * pageSize`; mọi giá trị paging không hợp lệ ném `ValidationError`.
- **AC-004:** `PagingReq.pageNumber` vẫn optional và mọi active source comment, guide, API entry, example xác định `0` là trang đầu.
- **AC-005:** Response validation, repeat/no-progress detection, total-change policy, abort, `maxPages`, accumulation order và safe-integer guards của paging vẫn hoạt động.
- **AC-006:** README, migration, release notes, changeset và site mô tả zero-only; one-based mapping chỉ xuất hiện tại transport boundary, không phải helper option.
- **AC-007:** Site có sticky header, sidebar trái, main content, breadcrumb và optional on-page TOC chuyên nghiệp.
- **AC-008:** Navigation có đúng các nhóm Start, Guides, API Reference, Examples, Resources và đánh dấu current page.
- **AC-009:** Hash routes hỗ trợ direct entry, refresh, back/forward, title riêng, symbol anchor, focus restoration và localized 404 dưới GitHub Pages base.
- **AC-010:** Coverage validator chứng minh mọi public runtime export và public type/model/option family có API entry discoverable hoặc intentional documented alias.
- **AC-011:** Mỗi API entry có exact import path, signature, parameter/default, return, typed errors, runtime/security note, example và deprecation replacement khi cần.
- **AC-012:** Mọi public typed error đều được index, search, link từ throwing APIs và có ví dụ xử lý an toàn.
- **AC-013:** Examples bao phủ paging, AES-GCM, safe objects/paths, canonical serialization/hash, dates/DST, filters, browser, async/RxJS, validation/numbers, arrays và typed errors.
- **AC-014:** Validation và filter playground giữ behavior hữu ích hiện tại, có label, result, reset/error state accessible.
- **AC-015:** Lần đầu hiển thị English; EN/VI switch đổi toàn bộ shell/content/search mà không đổi current route.
- **AC-016:** Locale hợp lệ được nhớ sau reload và cập nhật `<html lang>`; giá trị thiếu/hỏng/không hỗ trợ fallback English.
- **AC-017:** Validation thất bại nếu page, navigation, search field, API entry hoặc example đã đăng ký thiếu English hay Vietnamese.
- **AC-018:** Search mở bằng `/` và `Ctrl/Cmd+K`, tìm localized title/keyword/API symbol/anchor, hỗ trợ keyboard và đi tới deep link.
- **AC-019 [Manual]:** Ở 320 CSS pixels không có page-level horizontal overflow; navigation thành drawer, grid/panel về một cột, chỉ code/table container được scroll ngang.
- **AC-020 [Manual]:** Ở desktop, sidebar dùng được khi scroll, reading column có chiều rộng hợp lý và right TOC chỉ hiện khi đủ không gian/nội dung.
- **AC-021:** Automated/static checks và interaction tests xác nhận landmarks, heading order, skip link, labels, `aria-current`, focus management, keyboard và live regions.
- **AC-022 [Manual]:** Text, focus indicator, badge, control và interactive states đạt WCAG 2.2 AA contrast.
- **AC-023 [Manual]:** Interactive targets chính tối thiểu 44 CSS pixels khi khả thi, focus không bị che và reduced-motion loại bỏ motion không cần thiết.
- **AC-024:** Code block có copy control dùng được bằng keyboard, announcement EN/VI, không làm hỏng URL, escaped string hoặc template literal.
- **AC-025:** Playground input và route/search text không được render bằng unsafe HTML; external links dùng target/rel an toàn khi cần.
- **AC-026:** Production build tách content theo route và initial JavaScript cộng CSS không quá 100 KiB gzip; kết quả đo được báo cáo.
- **AC-027:** `npm run build` trong `site` tạo static artifact hoạt động tại `/sdcorejs-utils/`, deep links đã biết chạy qua hash routing mà không cần server rewrite.
- **AC-028:** `.gitattributes` và `.editorconfig` thiết lập UTF-8/LF, bảo toàn binary files và `git diff --check` không báo lỗi whitespace/line ending.
- **AC-029:** Security/runtime docs nêu rõ strict-validation migration, Web Crypto failures, optional RxJS boundary và incognito detection deprecated/unreliable/không dùng cho security.
- **AC-030:** Paging, router, search, i18n được làm RED-first; layout/content có focused regression tests và manual responsive/accessibility checks, không skip hoặc làm yếu test.
- **AC-031:** Root validation, focused paging tests, site typecheck/test/build/content check, packed consumers/examples, timezone matrix, dependency audits, workflow syntax và relevant CI đều đạt trước delivery.
- **AC-032:** Intended diff được commit trên `codex/utils-v1.2.0-security` và push `origin`; báo branch/commit/hosted-CI status, trong khi `main` chưa merge và không publish/tag/release/PR.

## Rủi ro và biện pháp giảm thiểu

- **One-based service:** không thể truyền native index trực tiếp. -> Dùng transport adapter chuyển `pageNumber + 1` đúng tại service boundary.
- **Resume fetching:** bỏ `initialPage` thay đổi behavior chưa phát hành. -> Giữ đúng nghĩa fetch all; resume loop phải là abstraction riêng, minh bạch.
- **Translation/API drift:** content có thể thiếu hoặc lệch. -> Typed locale pairs cùng registry/public-export validation trong local và CI.
- **Copied example/signature drift:** code docs có thể lỗi thời. -> Structured API data, exact import paths, executable/compiled examples và coverage checks.
- **Bundle tăng:** bilingual corpus lớn. -> Lazy page modules, không runtime framework/highlighter nặng, enforce gzip budget.
- **Browser regressions:** router/focus/drawer/search có thể hỏng. -> Behavior tests, deep-link probes và keyboard/responsive checklist.
- **Runtime APIs thiếu:** Web Crypto/browser APIs không luôn có. -> Giữ typed failures và support matrix, không tạo insecure fallback.
- **Incognito misuse:** dễ bị hiểu thành security signal. -> Giữ deprecated và cảnh báo cấm dùng trong API, guide, SECURITY.
- **Dirty-tree collision:** có thể ghi đè thay đổi trước đó. -> Coi current v1.2 diff là baseline, chỉ sửa scoped files, inspect final diff, không reset/discard.
- **Hosted CI uncertainty:** push có thể không chạy hoặc Actions lỗi ngoài source. -> Local checks là blocking, cấu hình CI phù hợp, kiểm tra remote result khi có và báo rõ mà không merge/release.

## Ngoài phạm vi được hoãn

- Merge `main`, npm publish, release tag và GitHub Release - hoãn tới khi người dùng bắt đầu release workflow.
- Pull request - hoãn tới khi được yêu cầu rõ ràng.
- SSR/framework migration - hoãn tới khi static hash routing không còn đáp ứng hosting/product need.
- Locale ngoài English/Vietnamese - hoãn tới khi có nhu cầu và translation ownership.
- Cloud visual-regression hoặc analytics - hoãn tới khi external service và data policy được duyệt.

## Decisions captured during review

- Phê duyệt nguyên trạng bản nháp revision 1.

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)
