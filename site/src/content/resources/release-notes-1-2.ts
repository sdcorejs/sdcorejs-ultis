import {
  bulletList,
  callout,
  contentTable,
  createPageContent,
  inlineCode,
  localized,
  paragraph,
  routeLink,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Resources', vi: 'Tài nguyên' },
  title: { en: 'Release notes 1.2', vi: 'Ghi chú phát hành 1.2' },
  summary: {
    en: 'A security and correctness release prepared around strict contracts, typed failures, dependable packaging, and complete documentation.',
    vi: 'Bản phát hành về bảo mật và tính đúng đắn được chuẩn bị quanh contract nghiêm ngặt, typed failure, đóng gói đáng tin cậy và tài liệu đầy đủ.',
  },
  sections: [
    {
      anchor: 'highlights',
      title: { en: 'Highlights', vi: 'Điểm nổi bật' },
      render: (context) => [
        bulletList([
          [localized(context.locale, { en: 'Prototype-sensitive object keys and unsafe property paths are rejected throughout public data helpers.', vi: 'Khóa object nhạy cảm với prototype và đường dẫn thuộc tính không an toàn bị từ chối trong toàn bộ helper dữ liệu public.' })],
          [localized(context.locale, { en: 'Versioned AES-GCM authenticated encryption and SHA-256 APIs use Web Crypto with typed failures.', vi: 'API mã hóa AES-GCM có xác thực có phiên bản và SHA-256 dùng Web Crypto với typed failure.' })],
          [localized(context.locale, { en: 'Serialization, filters, dates, numbers, URLs, UUIDs, arrays, and paging gain stricter deterministic contracts.', vi: 'Tuần tự hóa, filter, ngày, số, URL, UUID, mảng và phân trang có contract xác định nghiêm ngặt hơn.' })],
          [localized(context.locale, { en: 'Browser helpers settle predictably, reject unsafe protocols, expose clipboard errors, and bound unreliable heuristics.', vi: 'Helper trình duyệt settle có thể dự đoán, từ chối giao thức không an toàn, để lộ lỗi clipboard và giới hạn heuristic không đáng tin.' })],
          [localized(context.locale, { en: 'Package exports cover ESM, CommonJS, declarations, models, constants, functions, and errors without an RxJS dependency.', vi: 'Package exports bao phủ ESM, CommonJS, declaration, model, constant, function và error mà không phụ thuộc RxJS.' })],
        ]),
      ],
    },
    {
      anchor: 'breaking-changes',
      title: { en: 'Breaking changes', vi: 'Thay đổi không tương thích' },
      render: (context) => [
        contentTable(
          localized(context.locale, { en: 'Migration-required behavior', vi: 'Hành vi cần migration' }),
          localized(context.locale, { en: ['Area', '1.2 contract'], vi: ['Khu vực', 'Contract 1.2'] }),
          [
            [[localized(context.locale, { en: 'Paging', vi: 'Phân trang' })], [localized(context.locale, { en: 'Strictly zero-based; fetch-all starts at 0', vi: 'Zero-based nghiêm ngặt; fetch-all bắt đầu từ 0' })]],
            [[localized(context.locale, { en: 'Unsafe data', vi: 'Dữ liệu không an toàn' })], [localized(context.locale, { en: 'Typed errors replace partial or inherited behavior', vi: 'Typed error thay cho hành vi một phần hoặc kế thừa' })]],
            [[localized(context.locale, { en: 'Filters and parsing', vi: 'Filter và parsing' })], [localized(context.locale, { en: 'Malformed definitions and ambiguous inputs fail explicitly', vi: 'Definition sai và input mơ hồ thất bại tường minh' })]],
            [[localized(context.locale, { en: 'MaybeAsync', vi: 'MaybeAsync' })], [localized(context.locale, { en: 'Structural subscribable return; no RxJS-only methods promised', vi: 'Trả structural subscribable; không đảm bảo method riêng RxJS' })]],
            [[localized(context.locale, { en: 'Browser APIs', vi: 'API trình duyệt' })], [localized(context.locale, { en: 'Cancellation, permission, protocol, and capability failures are observable', vi: 'Lỗi hủy, quyền, giao thức và capability có thể quan sát' })]],
          ],
        ),
        paragraph(
          localized(context.locale, { en: 'Complete preparation steps are in ', vi: 'Các bước chuẩn bị đầy đủ nằm trong ' }),
          routeLink(context, localized(context.locale, { en: 'Migration to 1.2', vi: 'Nâng cấp lên 1.2' }), { routeId: 'resources/migration-1-2' }),
          '.',
        ),
      ],
    },
    {
      anchor: 'compatibility',
      title: { en: 'Compatibility', vi: 'Khả năng tương thích' },
      render: (context) => [
        bulletList([
          [localized(context.locale, { en: 'Root and supported subpath import names remain available where preserving them is safe.', vi: 'Tên import từ root và subpath được hỗ trợ vẫn có sẵn khi việc giữ lại là an toàn.' })],
          [inlineCode('encrypt'), localized(context.locale, { en: '/decrypt preserve legacy bytes but are accurately deprecated as obfuscation.', vi: '/decrypt bảo toàn byte legacy nhưng được deprecated chính xác là cơ chế làm rối.' })],
          [localized(context.locale, { en: 'Deprecated date, hash, number, image, and async aliases document explicit replacements.', vi: 'Alias date, hash, number, image và async đã deprecated có API thay thế tường minh.' })],
          [localized(context.locale, { en: 'Node.js 20, 22, and 24 plus modern ES2022 browsers are the supported runtime baseline.', vi: 'Node.js 20, 22 và 24 cùng trình duyệt ES2022 hiện đại là baseline runtime được hỗ trợ.' })],
          [localized(context.locale, { en: 'RxJS Observables remain structurally compatible when RxJS is owned by the application.', vi: 'RxJS Observable vẫn tương thích về cấu trúc khi RxJS do ứng dụng sở hữu.' })],
        ]),
        callout(
          'info',
          localized(context.locale, { en: 'Prepared does not mean published', vi: 'Đã chuẩn bị không có nghĩa là đã phát hành' }),
          paragraph(localized(context.locale, {
            en: 'Use the package registry and repository release history to confirm which version is currently published before changing production dependencies.',
            vi: 'Hãy kiểm tra package registry và lịch sử release của repository để xác nhận phiên bản đang được phát hành trước khi thay đổi dependency production.',
          })),
        ),
      ],
    },
    {
      anchor: 'verification',
      title: { en: 'Verification', vi: 'Kiểm chứng' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'The 1.2 release workflow is designed to validate type safety, tests and coverage, ESM/CommonJS builds, declaration conditions, packed consumers, browser bundling, examples, documentation, dependency audits, and date behavior in multiple time zones.',
          vi: 'Quy trình release 1.2 được thiết kế để xác thực type safety, test và coverage, build ESM/CommonJS, declaration condition, packed consumer, browser bundling, example, tài liệu, audit dependency và hành vi ngày ở nhiều múi giờ.',
        })),
        bulletList([
          [localized(context.locale, { en: 'No merge, tag, or publish is implied by these release notes.', vi: 'Ghi chú này không ngụ ý đã merge, tag hoặc publish.' })],
          [localized(context.locale, { en: 'Consumers should still run their own packed-artifact integration suite before deployment.', vi: 'Consumer vẫn nên chạy integration suite riêng với packed artifact trước khi deploy.' })],
          [localized(context.locale, { en: 'Security-sensitive migrations require application-specific key, authorization, and data-handling review.', vi: 'Migration nhạy cảm bảo mật cần review riêng của ứng dụng về khóa, phân quyền và xử lý dữ liệu.' })],
        ]),
      ],
    },
  ],
});
