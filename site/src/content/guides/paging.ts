import {
  bulletList,
  callout,
  codeBlock,
  contentTable,
  createPageContent,
  inlineCode,
  localized,
  paragraph,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Guide', vi: 'Hướng dẫn' },
  title: { en: 'Zero-based paging', vi: 'Phân trang từ 0' },
  summary: {
    en: 'Inside @sdcorejs/utils, page 0 is always the first page. Convert external numbering only where your transport is called.',
    vi: 'Trong @sdcorejs/utils, trang 0 luôn là trang đầu. Chỉ chuyển đổi cách đánh số bên ngoài tại nơi gọi transport.',
  },
  sections: [
    {
      anchor: 'zero-based-contract',
      title: { en: 'The zero-based contract', vi: 'Contract zero-based' },
      render: (context) => [
        paragraph(
          inlineCode('PagingReq.pageNumber'),
          localized(context.locale, {
            en: ' is an optional zero-based index. ',
            vi: ' là chỉ số zero-based optional. ',
          }),
          inlineCode('ArrayUtilities.paging(items, pageSize, page)'),
          localized(context.locale, {
            en: ' uses offset ',
            vi: ' dùng offset ',
          }),
          inlineCode('page * pageSize'),
          localized(context.locale, {
            en: ' and defaults to page 0.',
            vi: ' và mặc định là trang 0.',
          }),
        ),
        contentTable(
          localized(context.locale, { en: 'Zero-based examples', vi: 'Ví dụ zero-based' }),
          localized(context.locale, { en: ['Call', 'Selected items'], vi: ['Lời gọi', 'Phần tử được chọn'] }),
          [
            [[inlineCode('paging(items, 20)')], [localized(context.locale, { en: 'Indexes 0–19', vi: 'Chỉ số 0–19' })]],
            [[inlineCode('paging(items, 20, 0)')], [localized(context.locale, { en: 'Indexes 0–19', vi: 'Chỉ số 0–19' })]],
            [[inlineCode('paging(items, 20, 1)')], [localized(context.locale, { en: 'Indexes 20–39', vi: 'Chỉ số 20–39' })]],
          ],
        ),
        callout(
          'warning',
          localized(context.locale, { en: 'No alternate page origin', vi: 'Không có gốc trang thay thế' }),
          paragraph(localized(context.locale, {
            en: 'The helper contract cannot be configured to start at 1 or skip initial pages. A resume workflow is a different abstraction and must state its own completeness guarantees.',
            vi: 'Không thể cấu hình helper bắt đầu từ 1 hoặc bỏ qua các trang đầu. Luồng resume là abstraction khác và phải tự nêu rõ cam kết về tính đầy đủ.',
          })),
        ),
      ],
    },
    {
      anchor: 'fetch-every-page',
      title: { en: 'Fetch every page', vi: 'Lấy mọi trang' },
      render: (context) => [
        paragraph(
          inlineCode('fetchAllByPaging'),
          localized(context.locale, {
            en: ' calls the callback first with page 0, then 1, 2, and so on. It preserves item order and stops when the validated total has been collected.',
            vi: ' gọi callback lần đầu với trang 0, sau đó là 1, 2 và tiếp tục tuần tự. Hàm giữ nguyên thứ tự phần tử và dừng khi đã thu thập đủ total hợp lệ.',
          }),
        ),
        codeBlock(
          `import { fetchAllByPaging } from '@sdcorejs/utils/fns';
import type { PagingRes } from '@sdcorejs/utils/models';

type User = { id: string; name: string };

async function fetchPage(
  pageSize: number,
  pageNumber: number,
  signal?: AbortSignal,
): Promise<PagingRes<User>> {
  const response = await fetch(
    \`/api/users?page=\${pageNumber}&size=\${pageSize}\`,
    { signal },
  );
  return response.json() as Promise<PagingRes<User>>;
}

const controller = new AbortController();
const users = await fetchAllByPaging(fetchPage, 100, {
  maxPages: 500,
  signal: controller.signal,
});`,
          localized(context.locale, { en: 'Fetch a zero-based endpoint', vi: 'Lấy dữ liệu từ endpoint zero-based' }),
        ),
      ],
    },
    {
      anchor: 'one-based-transport',
      title: { en: 'Adapt a one-based transport', vi: 'Chuyển đổi transport one-based' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Keep the library callback zero-based. Add 1 only when constructing the external request, then normalize the response into the expected { items, total } shape.',
          vi: 'Giữ callback của thư viện ở dạng zero-based. Chỉ cộng 1 khi tạo request bên ngoài, rồi chuẩn hóa response về dạng { items, total } mà helper mong đợi.',
        })),
        codeBlock(
          `import { fetchAllByPaging } from '@sdcorejs/utils/fns';

const records = await fetchAllByPaging(
  async (pageSize, pageNumber, signal) => {
    const servicePage = pageNumber + 1;
    const response = await client.list({
      page: servicePage,
      limit: pageSize,
      signal,
    });

    return {
      items: response.records,
      total: response.totalCount,
    };
  },
  100,
);`,
          localized(context.locale, { en: 'One-based service adapter', vi: 'Adapter cho service one-based' }),
        ),
        callout(
          'info',
          localized(context.locale, { en: 'One conversion point', vi: 'Một điểm chuyển đổi duy nhất' }),
          paragraph(localized(context.locale, {
            en: 'Keeping the mapping beside the transport prevents mixed conventions from leaking into models, arrays, tests, or application state.',
            vi: 'Đặt phép chuyển đổi cạnh transport giúp ngăn convention lẫn lộn lan vào model, mảng, test hoặc state ứng dụng.',
          })),
        ),
      ],
    },
    {
      anchor: 'failure-controls',
      title: { en: 'Failure controls', vi: 'Cơ chế kiểm soát lỗi' },
      render: (context) => [
        bulletList([
          [inlineCode('ValidationError'), localized(context.locale, { en: ' rejects an invalid callback, page size, page index, or page limit.', vi: ' từ chối callback, kích thước trang, chỉ số trang hoặc giới hạn trang không hợp lệ.' })],
          [inlineCode('PagingResponseError'), localized(context.locale, { en: ' rejects malformed totals, oversized pages, empty-page no progress, and inconsistent totals while preserving legitimate duplicate values.', vi: ' từ chối total sai, trang quá lớn, trang rỗng không có tiến triển và total không nhất quán, đồng thời giữ lại giá trị trùng hợp lệ.' })],
          [inlineCode('PagingLimitError'), localized(context.locale, { en: ' stops a request that reaches maxPages or the safe page-number range.', vi: ' dừng request chạm maxPages hoặc giới hạn số trang an toàn.' })],
          [inlineCode('AbortSignal'), localized(context.locale, { en: ' is checked before and after each request and raced against the active page promise.', vi: ' được kiểm tra trước và sau mỗi request, đồng thời race với promise trang đang chạy.' })],
        ]),
        paragraph(
          localized(context.locale, {
            en: 'The default page size is 1,000 and the default hard cap is 10,000 pages. A changing total throws by default; use ',
            vi: 'Kích thước trang mặc định là 1.000 và hard cap mặc định là 10.000 trang. Total thay đổi sẽ throw theo mặc định; chỉ dùng ',
          }),
          inlineCode("totalChangePolicy: 'latest'"),
          localized(context.locale, {
            en: ' only when the endpoint contract explicitly permits a moving total.',
            vi: ' khi contract endpoint cho phép total biến động một cách tường minh.',
          }),
        ),
      ],
    },
  ],
});
