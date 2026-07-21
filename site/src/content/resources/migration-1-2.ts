import {
  bulletList,
  callout,
  codeBlock,
  contentTable,
  createPageContent,
  inlineCode,
  localized,
  orderedList,
  paragraph,
  routeLink,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Resources', vi: 'Tài nguyên' },
  title: { en: 'Migration to 1.2', vi: 'Nâng cấp lên 1.2' },
  summary: {
    en: 'Version 1.2 preserves safe public names and paths while making malformed and security-sensitive inputs fail explicitly.',
    vi: 'Phiên bản 1.2 giữ các tên và đường dẫn public an toàn, đồng thời làm input sai hoặc nhạy cảm bảo mật thất bại tường minh.',
  },
  sections: [
    {
      anchor: 'paging-contract',
      title: { en: 'Paging contract', vi: 'Contract phân trang' },
      render: (context) => [
        callout(
          'warning',
          localized(context.locale, { en: 'Page 0 is the only first page', vi: 'Trang 0 là trang đầu duy nhất' }),
          paragraph(localized(context.locale, {
            en: 'Array paging defaults to page 0, and fetchAllByPaging always calls its callback with 0 first. The public options only control maxPages, cancellation, and changing-total policy.',
            vi: 'Phân trang mảng mặc định là trang 0 và fetchAllByPaging luôn gọi callback với 0 đầu tiên. Public options chỉ kiểm soát maxPages, hủy và policy total thay đổi.',
          })),
        ),
        codeBlock(
          `const items = await fetchAllByPaging(
  (pageSize, pageNumber, signal) =>
    client.list({
      pageSize,
      pageNumber: pageNumber + 1,
      signal,
    }),
);`,
          localized(context.locale, { en: 'Adapt a one-based service at transport', vi: 'Chuyển đổi service one-based tại transport' }),
        ),
        orderedList([
          [localized(context.locale, { en: 'Identify every service page-number convention.', vi: 'Xác định convention số trang của từng service.' })],
          [localized(context.locale, { en: 'Keep PagingReq, arrays, application state, and helper callbacks zero-based.', vi: 'Giữ PagingReq, mảng, state ứng dụng và callback helper ở dạng zero-based.' })],
          [localized(context.locale, { en: 'For a one-based service, add 1 only in the transport call.', vi: 'Với service one-based, chỉ cộng 1 trong lời gọi transport.' })],
          [localized(context.locale, { en: 'Test the observed sequence and final item order.', vi: 'Kiểm thử chuỗi trang quan sát được và thứ tự item cuối.' })],
        ]),
        paragraph(
          localized(context.locale, { en: 'See the full ', vi: 'Xem ' }),
          routeLink(context, localized(context.locale, { en: 'zero-based paging guide', vi: 'hướng dẫn phân trang từ 0' }), { routeId: 'guides/paging' }),
          '.',
        ),
      ],
    },
    {
      anchor: 'strict-validation',
      title: { en: 'Strict validation', vi: 'Xác thực nghiêm ngặt' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Inputs that were previously accepted through coercion, permissive parsing, or partial evaluation can now return false or throw a focused typed error. Treat that as a contract correction, not a reason to disable validation.',
          vi: 'Input trước đây được chấp nhận qua coercion, parser dễ dãi hoặc đánh giá một phần giờ có thể trả false hoặc throw typed error chuyên biệt. Hãy xem đây là sửa contract, không phải lý do tắt validation.',
        })),
        contentTable(
          localized(context.locale, { en: 'Migration hotspots', vi: 'Điểm nóng khi migration' }),
          localized(context.locale, { en: ['Area', 'Required review'], vi: ['Khu vực', 'Việc cần review'] }),
          [
            [[localized(context.locale, { en: 'Object keys and paths', vi: 'Khóa và đường dẫn object' })], [localized(context.locale, { en: 'Handle unsafe-key/path errors; copy trusted inherited values first', vi: 'Xử lý lỗi unsafe key/path; copy giá trị kế thừa đã tin cậy trước' })]],
            [[localized(context.locale, { en: 'Filters', vi: 'Filter' })], [localized(context.locale, { en: 'Validate shape and declare numeric timestamp units', vi: 'Xác thực shape và khai báo đơn vị timestamp số' })]],
            [[localized(context.locale, { en: 'Dates', vi: 'Ngày giờ' })], [localized(context.locale, { en: 'Separate local dates, local date-times, and offset instants', vi: 'Tách ngày local, ngày giờ local và instant có offset' })]],
            [[localized(context.locale, { en: 'Numbers', vi: 'Số' })], [localized(context.locale, { en: 'Replace broad coercion with finite/string/parse helpers', vi: 'Thay coercion rộng bằng helper finite/string/parse' })]],
            [[localized(context.locale, { en: 'URLs and UUIDs', vi: 'URL và UUID' })], [localized(context.locale, { en: 'Choose explicit URL policy and UUID version/variant rules', vi: 'Chọn policy URL và rule UUID version/variant tường minh' })]],
          ],
        ),
        callout(
          'security',
          localized(context.locale, { en: 'Do not restore permissive behavior for untrusted input', vi: 'Không khôi phục hành vi dễ dãi cho input không tin cậy' }),
          paragraph(localized(context.locale, {
            en: 'Normalize trusted legacy data at a narrow migration boundary. Do not weaken shared validation or path safety globally.',
            vi: 'Chuẩn hóa dữ liệu legacy đã tin cậy tại một biên migration hẹp. Không làm yếu validation dùng chung hoặc an toàn đường dẫn trên toàn hệ thống.',
          })),
        ),
      ],
    },
    {
      anchor: 'security-changes',
      title: { en: 'Security changes', vi: 'Thay đổi bảo mật' },
      render: (context) => [
        bulletList([
          [inlineCode('encrypt'), localized(context.locale, { en: ' and decrypt remain wire-compatible but are deprecated obfuscation, not security controls.', vi: ' và decrypt vẫn tương thích wire format nhưng là cơ chế làm rối deprecated, không phải kiểm soát bảo mật.' })],
          [inlineCode('encryptAesGcm'), localized(context.locale, { en: ' and decryptAesGcm provide versioned authenticated encryption through Web Crypto.', vi: ' và decryptAesGcm cung cấp mã hóa có xác thực có phiên bản qua Web Crypto.' })],
          [inlineCode('hash32'), localized(context.locale, { en: ' is explicitly non-cryptographic; sha256Canonical hashes the supported canonical value domain.', vi: ' được xác định rõ là không phải mật mã; sha256Canonical băm miền giá trị canonical được hỗ trợ.' })],
          [inlineCode('generateUuid'), localized(context.locale, { en: ' uses secure randomness or throws; randomId remains non-security convenience only.', vi: ' dùng randomness an toàn hoặc throw; randomId chỉ dùng tiện lợi ngoài bảo mật.' })],
          [localized(context.locale, { en: 'Unsafe download protocols reject and data URLs require explicit opt-in.', vi: 'Giao thức tải xuống không an toàn bị từ chối và data URL cần opt-in tường minh.' })],
        ]),
        paragraph(
          localized(context.locale, { en: 'Review the ', vi: 'Xem ' }),
          routeLink(context, localized(context.locale, { en: 'security policy and boundaries', vi: 'chính sách và ranh giới bảo mật' }), { routeId: 'resources/security' }),
          '.',
        ),
      ],
    },
    {
      anchor: 'async-and-browser',
      title: { en: 'Async and browser boundaries', vi: 'Ranh giới async và trình duyệt' },
      render: (context) => [
        bulletList([
          [localized(context.locale, { en: 'RxJS is no longer a runtime, peer, or declaration dependency.', vi: 'RxJS không còn là runtime, peer hoặc declaration dependency.' })],
          [inlineCode('normalizeAsync'), localized(context.locale, { en: ' remains deprecated; migrate to normalizeSubscribable and adapt RxJS-only methods in the application.', vi: ' vẫn deprecated; chuyển sang normalizeSubscribable và adapt method riêng của RxJS trong ứng dụng.' })],
          [inlineCode('copyToClipboard'), localized(context.locale, { en: ' returns Promise<void>; await it and handle permission failure.', vi: ' trả Promise<void>; hãy await và xử lý lỗi quyền.' })],
          [inlineCode('upload'), localized(context.locale, { en: ' rejects cancellation and timeout explicitly.', vi: ' reject thao tác hủy và timeout tường minh.' })],
          [inlineCode('detectIncognito'), localized(context.locale, { en: ' is deprecated, bounded, unreliable, and prohibited as a security signal.', vi: ' đã deprecated, có giới hạn, không đáng tin và bị cấm dùng làm tín hiệu bảo mật.' })],
        ]),
        callout(
          'info',
          localized(context.locale, { en: 'Verify before release', vi: 'Kiểm chứng trước khi phát hành' }),
          paragraph(localized(context.locale, {
            en: 'Run the consumer test suite against a packed 1.2 artifact, including browser capability failures, time zones, package imports, and any RxJS adapter owned by the application.',
            vi: 'Chạy test suite của consumer với artifact 1.2 đã pack, bao gồm lỗi capability trình duyệt, múi giờ, package import và mọi RxJS adapter do ứng dụng sở hữu.',
          })),
        ),
      ],
    },
  ],
});
