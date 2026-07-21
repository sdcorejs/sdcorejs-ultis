import { EXAMPLE_ENTRIES } from '../examples';
import { createExamplesPageContent } from './render';

export default createExamplesPageContent({
  pageId: 'example-security-data',
  title: { en: 'Security and deterministic data', vi: 'Bảo mật và dữ liệu xác định' },
  summary: { en: 'Use authenticated encryption and explicit data-domain boundaries.', vi: 'Dùng mã hóa xác thực và ranh giới miền dữ liệu tường minh.' },
  entries: EXAMPLE_ENTRIES.filter(entry => entry.pageId === 'example-security-data'),
});
