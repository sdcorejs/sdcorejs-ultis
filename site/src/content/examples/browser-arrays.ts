import { EXAMPLE_ENTRIES } from '../examples';
import { createExamplesPageContent } from './render';

export default createExamplesPageContent({
  pageId: 'example-browser-arrays',
  title: { en: 'Browser and array workflows', vi: 'Luồng trình duyệt và mảng' },
  summary: { en: 'Keep browser capability failures and collection semantics visible.', vi: 'Giữ lỗi capability trình duyệt và semantic collection rõ ràng.' },
  entries: EXAMPLE_ENTRIES.filter(entry => entry.pageId === 'example-browser-arrays'),
});
