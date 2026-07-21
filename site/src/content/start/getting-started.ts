import {
  bulletList,
  callout,
  codeBlock,
  createPageContent,
  inlineCode,
  localized,
  orderedList,
  paragraph,
  routeLink,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Start', vi: 'Bắt đầu' },
  title: { en: 'Getting started', vi: 'Bắt đầu' },
  summary: {
    en: 'Install @sdcorejs/utils and verify a typed, zero-based request in a few minutes.',
    vi: 'Cài @sdcorejs/utils và kiểm tra một request zero-based có kiểu chỉ trong vài phút.',
  },
  sections: [
    {
      anchor: 'install',
      title: { en: 'Install', vi: 'Cài đặt' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Use npm in a Node.js 20, 22, or 24 project. The package ships its own TypeScript declarations.',
          vi: 'Dùng npm trong dự án Node.js 20, 22 hoặc 24. Package đã kèm sẵn khai báo TypeScript.',
        })),
        codeBlock('npm install @sdcorejs/utils', localized(context.locale, { en: 'Terminal', vi: 'Dòng lệnh' }), 'bash'),
        callout(
          'info',
          localized(context.locale, { en: 'No RxJS runtime dependency', vi: 'Không phụ thuộc RxJS lúc runtime' }),
          paragraph(localized(context.locale, {
            en: 'Install RxJS only if your application already needs it. MaybeAsync interoperates through a structural subscribe contract.',
            vi: 'Chỉ cài RxJS nếu ứng dụng của bạn thực sự cần. MaybeAsync tương tác qua contract subscribe dạng cấu trúc.',
          })),
        ),
      ],
    },
    {
      anchor: 'first-import',
      title: { en: 'Your first import', vi: 'Import đầu tiên' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'The root entry point exposes the complete public surface. This example creates the first page request and validates an email address.',
          vi: 'Entry point gốc cung cấp toàn bộ public surface. Ví dụ này tạo request trang đầu và xác thực địa chỉ email.',
        })),
        codeBlock(
          `import {
  ValidationUtilities,
  type PagingReq,
} from '@sdcorejs/utils';

const request: PagingReq<{ id: number }> = {
  pageNumber: 0,
  pageSize: 20,
};

const valid = ValidationUtilities.isEmail('dev@example.com');

console.log({ request, valid });`,
          localized(context.locale, { en: 'First typed call', vi: 'Lời gọi có kiểu đầu tiên' }),
        ),
        callout(
          'warning',
          localized(context.locale, { en: 'Page zero is the first page', vi: 'Trang 0 là trang đầu tiên' }),
          paragraph(
            inlineCode('PagingReq.pageNumber'),
            localized(context.locale, {
              en: ' is optional, but when present it is always a zero-based index. Do not pass a service page number directly if that service starts at 1.',
              vi: ' là optional, nhưng khi có giá trị thì luôn là chỉ số zero-based. Không truyền trực tiếp số trang của service nếu service đó bắt đầu từ 1.',
            }),
          ),
        ),
      ],
    },
    {
      anchor: 'choose-entrypoint',
      title: { en: 'Choose an entry point', vi: 'Chọn entry point' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Use the root for convenience or a supported subpath to communicate intent. Both approaches are public and typed.',
          vi: 'Dùng entry point gốc để thuận tiện hoặc subpath được hỗ trợ để thể hiện rõ mục đích. Cả hai cách đều là public API và có kiểu.',
        })),
        codeBlock(
          `import { DateUtilities, type PagingReq } from '@sdcorejs/utils';
import { ValidationUtilities } from '@sdcorejs/utils/fns';
import type { PagingRes } from '@sdcorejs/utils/models';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import { ValidationError } from '@sdcorejs/utils/errors';`,
          localized(context.locale, { en: 'Root and subpath imports', vi: 'Import từ root và subpath' }),
        ),
        paragraph(
          localized(context.locale, { en: 'See ', vi: 'Xem ' }),
          routeLink(context, localized(context.locale, { en: 'Package exports', vi: 'Các export của package' }), { routeId: 'start/package-exports' }),
          localized(context.locale, { en: ' for the supported entry-point matrix.', vi: ' để biết ma trận entry point được hỗ trợ.' }),
        ),
      ],
    },
    {
      anchor: 'integration-checklist',
      title: { en: 'Integration checklist', vi: 'Danh sách kiểm tra tích hợp' },
      render: (context) => [
        orderedList([
          [localized(context.locale, { en: 'Confirm the target runtime and required Web Platform capabilities.', vi: 'Xác nhận runtime đích và các capability Web Platform bắt buộc.' })],
          [localized(context.locale, { en: 'Import from the root or one of the four supported subpaths.', vi: 'Import từ root hoặc một trong bốn subpath được hỗ trợ.' })],
          [localized(context.locale, { en: 'Handle documented typed errors at input, browser, paging, and cryptographic boundaries.', vi: 'Xử lý typed error đã tài liệu hóa tại các biên input, trình duyệt, phân trang và mật mã.' })],
          [localized(context.locale, { en: 'Keep page indexes zero-based inside the library and adapt external protocols at their callback boundary.', vi: 'Giữ chỉ số trang zero-based trong thư viện và chuyển đổi giao thức bên ngoài tại biên callback.' })],
          [localized(context.locale, { en: 'Run your application typecheck and tests after replacing permissive legacy behavior.', vi: 'Chạy typecheck và test của ứng dụng sau khi thay thế hành vi legacy dễ dãi.' })],
        ]),
        bulletList([
          [routeLink(context, localized(context.locale, { en: 'Runtime support', vi: 'Hỗ trợ runtime' }), { routeId: 'start/runtime-support' })],
          [routeLink(context, localized(context.locale, { en: 'Migration to 1.2', vi: 'Nâng cấp lên 1.2' }), { routeId: 'resources/migration-1-2' })],
          [routeLink(context, localized(context.locale, { en: 'Security boundaries', vi: 'Ranh giới bảo mật' }), { routeId: 'resources/security' })],
        ]),
      ],
    },
  ],
});
