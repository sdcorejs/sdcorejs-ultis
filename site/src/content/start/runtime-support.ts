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
  eyebrow: { en: 'Start', vi: 'Bắt đầu' },
  title: { en: 'Runtime support', vi: 'Hỗ trợ runtime' },
  summary: {
    en: 'Most helpers are pure ES2022; capability-dependent APIs advertise and enforce their runtime boundary.',
    vi: 'Phần lớn helper là ES2022 thuần; API phụ thuộc capability đều mô tả và thực thi ranh giới runtime.',
  },
  sections: [
    {
      anchor: 'supported-runtimes',
      title: { en: 'Supported runtimes', vi: 'Runtime được hỗ trợ' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'The package supports Node.js 20, 22, and 24 and modern browsers capable of running ES2022 output. Use your application test matrix for embedded webviews, workers, and nonstandard JavaScript runtimes.',
          vi: 'Package hỗ trợ Node.js 20, 22 và 24 cùng các trình duyệt hiện đại chạy được output ES2022. Hãy dùng test matrix của ứng dụng cho webview nhúng, worker và runtime JavaScript không tiêu chuẩn.',
        })),
        contentTable(
          localized(context.locale, { en: 'Runtime capability matrix', vi: 'Ma trận capability runtime' }),
          localized(context.locale, { en: ['Feature family', 'Required capability'], vi: ['Nhóm tính năng', 'Capability bắt buộc'] }),
          [
            [[localized(context.locale, { en: 'Validation, numbers, arrays, filters, dates', vi: 'Xác thực, số, mảng, filter, ngày' })], [localized(context.locale, { en: 'ES2022 JavaScript', vi: 'JavaScript ES2022' })]],
            [[localized(context.locale, { en: 'AES-GCM, secure UUID fallback, SHA-256', vi: 'AES-GCM, fallback UUID an toàn, SHA-256' })], [inlineCode('globalThis.crypto')]],
            [[localized(context.locale, { en: 'File picker and downloads', vi: 'Trình chọn file và tải xuống' })], [localized(context.locale, { en: 'DOM, File, Blob, and URL APIs', vi: 'API DOM, File, Blob và URL' })]],
            [[localized(context.locale, { en: 'Clipboard', vi: 'Clipboard' })], [inlineCode('navigator.clipboard')]],
          ],
        ),
      ],
    },
    {
      anchor: 'web-platform-capabilities',
      title: { en: 'Web-platform capabilities', vi: 'Khả năng Web Platform' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Web Crypto operations are asynchronous and use the runtime implementation. File, download, and clipboard utilities require the corresponding browser APIs and may also be limited by secure-context, permission, or user-gesture policies.',
          vi: 'Thao tác Web Crypto là bất đồng bộ và dùng implementation của runtime. Tiện ích file, tải xuống và clipboard cần API trình duyệt tương ứng, đồng thời có thể bị giới hạn bởi secure context, quyền hoặc chính sách user gesture.',
        })),
        callout(
          'security',
          localized(context.locale, { en: 'No insecure fallback', vi: 'Không có fallback kém an toàn' }),
          paragraph(localized(context.locale, {
            en: 'Security-sensitive functions never replace missing Web Crypto with Math.random, a home-grown cipher, or unauthenticated encryption.',
            vi: 'Hàm nhạy cảm bảo mật không bao giờ thay Web Crypto bị thiếu bằng Math.random, cipher tự chế hoặc mã hóa không xác thực.',
          })),
        ),
      ],
    },
    {
      anchor: 'optional-rxjs',
      title: { en: 'Optional RxJS interop', vi: 'Tương tác RxJS tùy chọn' },
      render: (context) => [
        paragraph(
          inlineCode('MaybeAsync<T>'),
          localized(context.locale, {
            en: ' accepts a value, PromiseLike, or dependency-free ',
            vi: ' nhận giá trị, PromiseLike hoặc ',
          }),
          inlineCode('SubscribableLike<T>'),
          localized(context.locale, {
            en: '. An RxJS Observable is structurally compatible when your application already includes RxJS; this package neither installs nor imports it.',
            vi: ' không phụ thuộc. RxJS Observable tương thích về mặt cấu trúc khi ứng dụng đã dùng RxJS; package này không cài hoặc import RxJS.',
          }),
        ),
        paragraph(
          localized(context.locale, { en: 'Read ', vi: 'Đọc ' }),
          routeLink(context, localized(context.locale, { en: 'MaybeAsync and RxJS', vi: 'MaybeAsync và RxJS' }), { routeId: 'guides/async-rxjs' }),
          localized(context.locale, { en: ' before relying on RxJS-only operators such as pipe.', vi: ' trước khi dùng operator chỉ có ở RxJS như pipe.' }),
        ),
      ],
    },
    {
      anchor: 'explicit-failures',
      title: { en: 'Explicit failures', vi: 'Lỗi tường minh' },
      render: (context) => [
        bulletList([
          [inlineCode('WebCryptoUnavailableError'), localized(context.locale, { en: ' when subtle cryptography is unavailable.', vi: ' khi subtle cryptography không khả dụng.' })],
          [inlineCode('SecureRandomUnavailableError'), localized(context.locale, { en: ' when secure random generation cannot be used.', vi: ' khi không thể dùng bộ sinh số ngẫu nhiên an toàn.' })],
          [inlineCode('FilePickerCancelledError'), localized(context.locale, { en: ' when a file-picker operation is cancelled or times out.', vi: ' khi thao tác chọn file bị hủy hoặc hết thời gian.' })],
          [inlineCode('ValidationError'), localized(context.locale, { en: ' for invalid capability inputs and unsupported execution preconditions.', vi: ' cho input capability không hợp lệ và điều kiện thực thi không được hỗ trợ.' })],
        ]),
        callout(
          'info',
          localized(context.locale, { en: 'Feature-detect at the boundary', vi: 'Kiểm tra capability tại biên' }),
          paragraph(localized(context.locale, {
            en: 'When a feature is optional in your application, detect or handle its typed failure where that feature is invoked instead of hiding a global initialization failure.',
            vi: 'Khi một tính năng là tùy chọn trong ứng dụng, hãy kiểm tra hoặc xử lý typed failure tại nơi gọi tính năng đó thay vì che giấu lỗi khởi tạo toàn cục.',
          })),
        ),
      ],
    },
  ],
});
