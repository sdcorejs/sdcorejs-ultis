import { EXAMPLE_ENTRIES } from '../examples';
import { createExamplesPageContent } from './render';

export default createExamplesPageContent({
  pageId: 'example-paging-async',
  title: { en: 'Paging, async, and errors', vi: 'Phân trang, async và lỗi' },
  summary: { en: 'Copyable patterns for bounded page-0 workflows and explicit failures.', vi: 'Mẫu có thể sao chép cho luồng trang 0 có giới hạn và lỗi tường minh.' },
  entries: EXAMPLE_ENTRIES.filter(entry => entry.pageId === 'example-paging-async'),
});
