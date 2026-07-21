import { API_PAGES } from './api';
import { API_ENTRIES } from './api-data';
import { EXAMPLE_ENTRIES, EXAMPLE_PAGES } from './examples';
import { GUIDE_PAGES } from './guides';
import { buildRegistry } from './registry';
import { RESOURCE_PAGES } from './resources';
import { START_PAGES } from './start';

/** Canonical documentation catalog consumed by routing, navigation, search, and validation. */
export const registry = buildRegistry({
  pages: [
    ...START_PAGES,
    ...GUIDE_PAGES,
    ...API_PAGES,
    ...EXAMPLE_PAGES,
    ...RESOURCE_PAGES,
  ],
  api: API_ENTRIES,
  examples: EXAMPLE_ENTRIES,
});
