import {
  bulletList,
  callout,
  contentTable,
  createPageContent,
  inlineCode,
  localized,
  paragraph,
  routeLink,
  strong,
} from '../render';

export default createPageContent({
  eyebrow: { en: '@sdcorejs/utils documentation', vi: 'Tài liệu @sdcorejs/utils' },
  title: { en: 'Small utilities, explicit boundaries', vi: 'Tiện ích gọn nhẹ, ranh giới tường minh' },
  summary: {
    en: 'A dependency-light TypeScript library for validation, dates, filters, browser workflows, serialization, safe object handling, and shared application models.',
    vi: 'Thư viện TypeScript ít phụ thuộc dành cho xác thực, ngày giờ, filter, luồng trình duyệt, tuần tự hóa, xử lý đối tượng an toàn và các model ứng dụng dùng chung.',
  },
  sections: [
    {
      anchor: 'why-this-library',
      title: { en: 'Why this library', vi: 'Vì sao dùng thư viện này' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'The package keeps common application behavior in one typed, testable place. Its public surface is available from the root entry point and focused subpaths, with no UI framework requirement.',
          vi: 'Package tập trung các hành vi ứng dụng phổ biến vào một nơi có kiểu và có thể kiểm thử. Public surface có sẵn từ entry point gốc và các subpath chuyên biệt, không yêu cầu UI framework.',
        })),
        bulletList([
          [strong(localized(context.locale, { en: 'Predictable data contracts. ', vi: 'Contract dữ liệu dễ dự đoán. ' })), localized(context.locale, { en: 'Strict parsers and typed errors make malformed input visible.', vi: 'Parser nghiêm ngặt và typed error giúp dữ liệu sai hiển thị rõ.' })],
          [strong(localized(context.locale, { en: 'Secure defaults. ', vi: 'Mặc định an toàn. ' })), localized(context.locale, { en: 'Unsafe object keys, property paths, URL protocols, and weak cryptographic fallbacks are rejected.', vi: 'Khóa đối tượng, đường dẫn thuộc tính, giao thức URL không an toàn và fallback mật mã yếu đều bị từ chối.' })],
          [strong(localized(context.locale, { en: 'Runtime clarity. ', vi: 'Runtime rõ ràng. ' })), localized(context.locale, { en: 'Browser-only and Web Crypto operations fail explicitly when a required capability is unavailable.', vi: 'Thao tác chỉ dành cho trình duyệt và Web Crypto thất bại tường minh khi thiếu capability bắt buộc.' })],
          [strong(localized(context.locale, { en: 'Migration-friendly names. ', vi: 'Tên API thuận tiện khi nâng cấp. ' })), localized(context.locale, { en: 'Deprecated aliases remain documented with accurate replacements and boundaries.', vi: 'Alias đã deprecated vẫn được mô tả cùng API thay thế và ranh giới chính xác.' })],
        ]),
      ],
    },
    {
      anchor: 'at-a-glance',
      title: { en: 'At a glance', vi: 'Tổng quan nhanh' },
      render: (context) => [
        contentTable(
          localized(context.locale, { en: 'Documentation paths', vi: 'Các lộ trình tài liệu' }),
          localized(context.locale, { en: ['Need', 'Start here'], vi: ['Nhu cầu', 'Bắt đầu tại'] }),
          [
            [
              [localized(context.locale, { en: 'Install and import the package', vi: 'Cài đặt và import package' })],
              [routeLink(context, localized(context.locale, { en: 'Getting started', vi: 'Bắt đầu' }), { routeId: 'start/getting-started' })],
            ],
            [
              [localized(context.locale, { en: 'Integrate a paginated service', vi: 'Tích hợp dịch vụ phân trang' })],
              [routeLink(context, localized(context.locale, { en: 'Zero-based paging', vi: 'Phân trang từ 0' }), { routeId: 'guides/paging' })],
            ],
            [
              [localized(context.locale, { en: 'Protect or serialize data', vi: 'Bảo vệ hoặc tuần tự hóa dữ liệu' })],
              [routeLink(context, localized(context.locale, { en: 'Encryption guide', vi: 'Hướng dẫn mã hóa' }), { routeId: 'guides/encryption' }), ' · ', routeLink(context, localized(context.locale, { en: 'Serialization guide', vi: 'Hướng dẫn tuần tự hóa' }), { routeId: 'guides/serialization-hashing' })],
            ],
            [
              [localized(context.locale, { en: 'Upgrade an existing consumer', vi: 'Nâng cấp consumer hiện có' })],
              [routeLink(context, localized(context.locale, { en: 'Migration to 1.2', vi: 'Nâng cấp lên 1.2' }), { routeId: 'resources/migration-1-2' })],
            ],
          ],
        ),
      ],
    },
    {
      anchor: 'security-boundaries',
      title: { en: 'Security boundaries', vi: 'Ranh giới bảo mật' },
      render: (context) => [
        callout(
          'security',
          localized(context.locale, { en: 'Utilities are not an authorization layer', vi: 'Tiện ích không phải lớp phân quyền' }),
          paragraph(localized(context.locale, {
            en: 'Safe parsing, prototype-pollution defenses, and authenticated encryption reduce specific risks. They do not replace schema validation, access control, key management, rate limiting, or application threat modeling.',
            vi: 'Phân tích an toàn, phòng vệ prototype pollution và mã hóa có xác thực giúp giảm các rủi ro cụ thể. Chúng không thay thế schema validation, kiểm soát truy cập, quản lý khóa, rate limiting hoặc threat modeling của ứng dụng.',
          })),
        ),
        paragraph(
          localized(context.locale, { en: 'Treat ', vi: 'Hãy xem ' }),
          inlineCode('StringUtilities.encrypt'),
          localized(context.locale, { en: ' and ', vi: ' và ' }),
          inlineCode('decrypt'),
          localized(context.locale, {
            en: ' as legacy obfuscation only. They provide no confidentiality, integrity, or authentication. For sensitive data, review the ',
            vi: ' chỉ là cơ chế làm rối tương thích cũ. Chúng không cung cấp tính bí mật, toàn vẹn hoặc xác thực. Với dữ liệu nhạy cảm, hãy đọc ',
          }),
          routeLink(context, localized(context.locale, { en: 'security guidance', vi: 'hướng dẫn bảo mật' }), { routeId: 'resources/security' }),
          '.',
        ),
      ],
    },
    {
      anchor: 'next-steps',
      title: { en: 'Next steps', vi: 'Bước tiếp theo' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Install the package, choose the narrowest supported entry point for your module, and then use the guides or API reference for the contract you are integrating.',
          vi: 'Cài package, chọn entry point được hỗ trợ hẹp nhất cho module của bạn, rồi dùng phần Guides hoặc API Reference cho contract đang tích hợp.',
        })),
        bulletList([
          [routeLink(context, localized(context.locale, { en: 'Install and make a first call', vi: 'Cài đặt và thực hiện lời gọi đầu tiên' }), { routeId: 'start/getting-started' })],
          [routeLink(context, localized(context.locale, { en: 'Review runtime requirements', vi: 'Xem yêu cầu runtime' }), { routeId: 'start/runtime-support' })],
          [routeLink(context, localized(context.locale, { en: 'Plan a 1.2 migration', vi: 'Lập kế hoạch nâng cấp 1.2' }), { routeId: 'resources/migration-1-2' })],
        ]),
      ],
    },
  ],
});
