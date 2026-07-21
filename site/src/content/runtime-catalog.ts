import { API_PAGES } from './api';
import { EXAMPLE_PAGES } from './examples';
import { GUIDE_PAGES } from './guides';
import { RESOURCE_PAGES } from './resources';
import { START_PAGES } from './start';
import type { DocNavigationRegistry } from './types';

const pages = Object.freeze([
  ...START_PAGES,
  ...GUIDE_PAGES,
  ...API_PAGES,
  ...EXAMPLE_PAGES,
  ...RESOURCE_PAGES,
]);

/** Navigation-only catalog; API/example search data is loaded on demand. */
export const runtimeRegistry: DocNavigationRegistry = Object.freeze({
  pages,
  pagesById: new Map(pages.map(page => [page.id, page])),
  pagesByRoute: new Map(pages.map(page => [page.routeId, page])),
});
