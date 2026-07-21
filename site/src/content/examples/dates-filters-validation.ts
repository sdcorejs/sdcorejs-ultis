import { EXAMPLE_ENTRIES } from '../examples';
import { createExamplesPageContent } from './render';

export default createExamplesPageContent({
  pageId: 'example-dates-filters',
  title: { en: 'Dates, filters, and validation', vi: 'Ngày, filter và xác thực' },
  summary: { en: 'Make temporal, filter, number, URL, and UUID semantics explicit.', vi: 'Làm rõ semantic thời gian, filter, số, URL và UUID.' },
  entries: EXAMPLE_ENTRIES.filter(entry => entry.pageId === 'example-dates-filters'),
});
