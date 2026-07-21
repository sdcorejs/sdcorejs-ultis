import {
  callout,
  codeBlock,
  contentTable,
  createPageContent,
  inlineCode,
  localized,
  paragraph,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Start', vi: 'Bắt đầu' },
  title: { en: 'Package exports', vi: 'Các export của package' },
  summary: {
    en: 'Every supported entry point provides ESM, CommonJS, and TypeScript declarations.',
    vi: 'Mỗi entry point được hỗ trợ đều cung cấp ESM, CommonJS và khai báo TypeScript.',
  },
  sections: [
    {
      anchor: 'supported-entrypoints',
      title: { en: 'Supported entry points', vi: 'Các entry point được hỗ trợ' },
      render: (context) => [
        contentTable(
          localized(context.locale, { en: 'Public package entry points', vi: 'Các entry point public của package' }),
          localized(context.locale, { en: ['Import path', 'Purpose'], vi: ['Đường dẫn import', 'Mục đích'] }),
          [
            [[inlineCode('@sdcorejs/utils')], [localized(context.locale, { en: 'Complete public surface', vi: 'Toàn bộ public surface' })]],
            [[inlineCode('@sdcorejs/utils/models')], [localized(context.locale, { en: 'Models, option types, and dependency-free async contracts', vi: 'Model, kiểu option và contract async không phụ thuộc' })]],
            [[inlineCode('@sdcorejs/utils/constants')], [localized(context.locale, { en: 'Shared constants and operator metadata', vi: 'Hằng số dùng chung và metadata toán tử' })]],
            [[inlineCode('@sdcorejs/utils/fns')], [localized(context.locale, { en: 'Functions and utility namespaces', vi: 'Hàm và utility namespace' })]],
            [[inlineCode('@sdcorejs/utils/errors')], [localized(context.locale, { en: 'Public typed error hierarchy', vi: 'Hệ thống typed error public' })]],
          ],
        ),
        callout(
          'warning',
          localized(context.locale, { en: 'Do not import internal files', vi: 'Không import file nội bộ' }),
          paragraph(localized(context.locale, {
            en: 'Only paths declared in package exports are stable contracts. Paths into dist or src can change without a public migration path.',
            vi: 'Chỉ các đường dẫn được khai báo trong package exports mới là contract ổn định. Đường dẫn trực tiếp vào dist hoặc src có thể thay đổi mà không có lộ trình migration public.',
          })),
        ),
      ],
    },
    {
      anchor: 'import-strategy',
      title: { en: 'Import strategy', vi: 'Chiến lược import' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Prefer named imports. Use type-only imports where a symbol is erased at runtime, and keep all imports on supported paths.',
          vi: 'Ưu tiên named import. Dùng type-only import khi symbol bị loại ở runtime và giữ mọi import trên đường dẫn được hỗ trợ.',
        })),
        codeBlock(
          `import { fetchAllByPaging } from '@sdcorejs/utils/fns';
import type { PagingRes } from '@sdcorejs/utils/models';
import { PagingResponseError } from '@sdcorejs/utils/errors';

async function loadPage(
  pageSize: number,
  pageNumber: number,
): Promise<PagingRes<{ id: string }>> {
  // Call your transport here.
  return { items: [], total: 0 };
}

try {
  await fetchAllByPaging(loadPage);
} catch (error: unknown) {
  if (!(error instanceof PagingResponseError)) throw error;
}`,
          localized(context.locale, { en: 'Focused subpath imports', vi: 'Import từ subpath chuyên biệt' }),
        ),
      ],
    },
    {
      anchor: 'module-formats',
      title: { en: 'Module formats', vi: 'Định dạng module' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Conditional exports select the correct JavaScript and declaration files for import and require consumers. The package is side-effect free so compatible bundlers can remove unused exports.',
          vi: 'Conditional exports chọn đúng file JavaScript và declaration cho consumer dùng import hoặc require. Package không có side effect để bundler tương thích có thể loại bỏ export không dùng.',
        })),
        contentTable(
          localized(context.locale, { en: 'Published formats', vi: 'Các định dạng được phát hành' }),
          localized(context.locale, { en: ['Consumer', 'JavaScript', 'Declarations'], vi: ['Consumer', 'JavaScript', 'Khai báo kiểu'] }),
          [
            [[localized(context.locale, { en: 'ES module import', vi: 'Import ES module' })], [inlineCode('.js')], [inlineCode('.d.ts')]],
            [[localized(context.locale, { en: 'CommonJS require', vi: 'Require CommonJS' })], [inlineCode('.cjs')], [inlineCode('.d.cts')]],
          ],
        ),
      ],
    },
  ],
});
