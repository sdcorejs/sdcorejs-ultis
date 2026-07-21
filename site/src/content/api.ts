import type { DocPage } from './types';
import { definePage, lazyPage } from './registry';
import { EXAMPLE_ENTRIES, EXAMPLE_PAGES } from './examples';
import type { PageId } from './api/shared';

interface ApiPageMetadata {
  readonly id: PageId;
  readonly routeId: string;
  readonly order: number;
  readonly title: { readonly en: string; readonly vi: string };
  readonly summary: { readonly en: string; readonly vi: string };
  readonly keywords: { readonly en: readonly string[]; readonly vi: readonly string[] };
}

function createApiPage(metadata: ApiPageMetadata): DocPage {
  return definePage({
    id: metadata.id,
    routeId: metadata.routeId,
    group: 'api',
    order: metadata.order,
    title: metadata.title,
    summary: metadata.summary,
    keywords: metadata.keywords,
    anchors: [{
      anchor: 'api-overview',
      title: { en: 'API overview', vi: 'Tổng quan API' },
      keywords: { en: ['symbols', 'imports'], vi: ['symbol', 'import'] },
    }],
    load: lazyPage(async () => {
      const [
        { API_ENTRIES },
        { createApiPageContent },
      ] = await Promise.all([
        import('./api-data'),
        import('./api/render'),
      ]);
      return createApiPageContent({
        pageId: metadata.id,
        title: metadata.title,
        summary: metadata.summary,
        entries: API_ENTRIES.filter(entry => entry.pageId === metadata.id),
        examples: EXAMPLE_ENTRIES,
      }, new Map(EXAMPLE_PAGES.map(page => [page.id, page.routeId])));
    }),
  });
}

export const API_PAGES = [
  createApiPage({
    id: 'api-models-types', routeId: 'api/models-types', order: 0,
    title: { en: 'Models and types', vi: 'Model và kiểu' },
    summary: { en: 'Typed query, filter, paging, display, and async contracts.', vi: 'Contract có kiểu cho query, filter, phân trang, hiển thị và async.' },
    keywords: { en: ['models', 'types', 'interfaces', 'paging', 'filters'], vi: ['model', 'kiểu', 'interface', 'phân trang', 'filter'] },
  }),
  createApiPage({
    id: 'api-constants', routeId: 'api/constants', order: 1,
    title: { en: 'Constants', vi: 'Hằng số' },
    summary: { en: 'Shared language, operator, validation, and empty-value metadata.', vi: 'Metadata dùng chung cho ngôn ngữ, operator, validation và giá trị rỗng.' },
    keywords: { en: ['constants', 'operators', 'patterns', 'languages'], vi: ['hằng số', 'operator', 'pattern', 'ngôn ngữ'] },
  }),
  createApiPage({
    id: 'api-errors', routeId: 'api/errors', order: 2,
    title: { en: 'Typed errors', vi: 'Lỗi có kiểu' },
    summary: { en: 'Public validation, security, serialization, browser, date, and paging failures.', vi: 'Lỗi public cho validation, bảo mật, tuần tự hóa, trình duyệt, ngày và phân trang.' },
    keywords: { en: ['errors', 'exceptions', 'security', 'validation'], vi: ['lỗi', 'exception', 'bảo mật', 'validation'] },
  }),
  createApiPage({
    id: 'api-string', routeId: 'api/string', order: 3,
    title: { en: 'String and cryptography', vi: 'Chuỗi và mật mã' },
    summary: { en: 'Formatting, aliases, legacy obfuscation, SHA-256, and authenticated AES-GCM.', vi: 'Định dạng, alias, obfuscation cũ, SHA-256 và AES-GCM có xác thực.' },
    keywords: { en: ['StringUtilities', 'AES-GCM', 'format', 'obfuscation'], vi: ['StringUtilities', 'AES-GCM', 'định dạng', 'obfuscation'] },
  }),
  createApiPage({
    id: 'api-array', routeId: 'api/array', order: 4,
    title: { en: 'Arrays', vi: 'Mảng' },
    summary: { en: 'Bounded search, stable union, safe records, distinct values, and zero-based paging.', vi: 'Tìm kiếm có giới hạn, union ổn định, record an toàn, giá trị riêng và phân trang từ 0.' },
    keywords: { en: ['ArrayUtilities', 'search', 'union', 'paging'], vi: ['ArrayUtilities', 'tìm kiếm', 'union', 'phân trang'] },
  }),
  createApiPage({
    id: 'api-number', routeId: 'api/number', order: 5,
    title: { en: 'Numbers', vi: 'Số' },
    summary: { en: 'Explicit finite-number parsing, numeric-string policies, rounding, and formatting.', vi: 'Parse số hữu hạn tường minh, policy chuỗi số, làm tròn và định dạng.' },
    keywords: { en: ['NumberUtilities', 'finite', 'numeric string', 'currency'], vi: ['NumberUtilities', 'hữu hạn', 'chuỗi số', 'tiền tệ'] },
  }),
  createApiPage({
    id: 'api-date', routeId: 'api/date', order: 6,
    title: { en: 'Dates and time', vi: 'Ngày và thời gian' },
    summary: { en: 'Strict calendar, local date-time, instant, DST, and arithmetic APIs.', vi: 'API nghiêm ngặt cho ngày lịch, local date-time, instant, DST và phép toán.' },
    keywords: { en: ['DateUtilities', 'date', 'time zone', 'DST'], vi: ['DateUtilities', 'ngày', 'múi giờ', 'DST'] },
  }),
  createApiPage({
    id: 'api-filter', routeId: 'api/filter', order: 7,
    title: { en: 'Filters', vi: 'Filter' },
    summary: { en: 'Strict filter validation and deterministic in-memory evaluation.', vi: 'Xác thực filter nghiêm ngặt và đánh giá in-memory xác định.' },
    keywords: { en: ['FilterUtilities', 'validateFilter', 'evaluateFilter'], vi: ['FilterUtilities', 'validateFilter', 'evaluateFilter'] },
  }),
  createApiPage({
    id: 'api-browser', routeId: 'api/browser', order: 8,
    title: { en: 'Browser', vi: 'Trình duyệt' },
    summary: { en: 'File selection, downloads, clipboard, capability checks, and deprecated private-mode heuristics.', vi: 'Chọn file, tải xuống, clipboard, kiểm tra capability và heuristic private mode đã deprecated.' },
    keywords: { en: ['BrowserUtilities', 'upload', 'download', 'clipboard'], vi: ['BrowserUtilities', 'upload', 'download', 'clipboard'] },
  }),
  createApiPage({
    id: 'api-color', routeId: 'api/color', order: 9,
    title: { en: 'Color', vi: 'Màu sắc' },
    summary: { en: 'RGB and HSL conversion helpers with explicit numeric behavior.', vi: 'Tiện ích chuyển đổi RGB và HSL với hành vi số tường minh.' },
    keywords: { en: ['ColorUtilities', 'RGB', 'HSL', 'hex'], vi: ['ColorUtilities', 'RGB', 'HSL', 'hex'] },
  }),
  createApiPage({
    id: 'api-object-utility-serialization', routeId: 'api/object-utility-serialization', order: 10,
    title: { en: 'Objects, utilities, and serialization', vi: 'Đối tượng, tiện ích và tuần tự hóa' },
    summary: { en: 'Safe property paths, clone/merge, paging, UUIDs, deterministic serializers, and hashes.', vi: 'Đường dẫn thuộc tính an toàn, clone/merge, phân trang, UUID, serializer xác định và hash.' },
    keywords: { en: ['ObjectUtilities', 'Utilities', 'serialization', 'hash', 'paging'], vi: ['ObjectUtilities', 'Utilities', 'tuần tự hóa', 'hash', 'phân trang'] },
  }),
  createApiPage({
    id: 'api-validation-async', routeId: 'api/validation-async', order: 11,
    title: { en: 'Validation and async', vi: 'Validation và async' },
    summary: { en: 'Explicit URL, UUID, number, pattern, Promise-like, and structural subscribable contracts.', vi: 'Contract tường minh cho URL, UUID, số, pattern, Promise-like và subscribable dạng cấu trúc.' },
    keywords: { en: ['ValidationUtilities', 'MaybeAsync', 'RxJS', 'UUID', 'URL'], vi: ['ValidationUtilities', 'MaybeAsync', 'RxJS', 'UUID', 'URL'] },
  }),
] as const;
