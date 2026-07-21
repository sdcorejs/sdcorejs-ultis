import { describe, expect, it } from 'vitest';
import {
  buildSearchIndex,
  createSearchSources,
  isSearchShortcut,
  searchDocumentation,
  type SearchPageSource,
} from './search';
import type { ApiEntry, DocPage, ExampleEntry } from '../content/types';

const sources: readonly SearchPageSource[] = [
  {
    routeId: 'guides/paging',
    title: { en: 'Strict paging', vi: 'Phân trang nghiêm ngặt' },
    summary: {
      en: 'Use zero-based page numbers safely.',
      vi: 'Dùng chỉ số trang bắt đầu từ không an toàn.',
    },
    keywords: { en: ['pagination', 'zero based', 'lookup'], vi: ['phân trang', 'trang 0', 'tra cứu'] },
    anchors: [
      {
        anchor: 'transport-adapter',
        title: { en: 'Transport adapter', vi: 'Bộ chuyển đổi giao vận' },
      },
    ],
    apiSymbols: [
      {
        symbol: 'fetchAllByPaging',
        anchor: 'fetchAllByPaging',
        summary: {
          en: 'Fetch every page from page zero.',
          vi: 'Lấy mọi trang từ trang không.',
        },
      },
    ],
  },
  {
    routeId: 'api/paging',
    title: { en: 'Paging API', vi: 'API phân trang' },
    summary: {
      en: 'Paging models and options.',
      vi: 'Model và tùy chọn phân trang.',
    },
    keywords: { en: ['paging', 'lookup'], vi: ['phân trang', 'tra cứu'] },
  },
];

describe('localized documentation search', () => {
  it('searches only the active-locale title, summary, and keywords', () => {
    const viResults = searchDocumentation(sources, 'vi', 'nghiêm ngặt');
    const enResults = searchDocumentation(sources, 'en', 'nghiêm ngặt');

    expect(viResults[0]?.routeId).toBe('guides/paging');
    expect(enResults).toEqual([]);
  });

  it('ranks an exact API symbol first and returns its deep-link anchor', () => {
    const results = searchDocumentation(sources, 'en', 'fetchAllByPaging');

    expect(results[0]).toMatchObject({
      kind: 'api',
      routeId: 'guides/paging',
      anchor: 'fetchAllByPaging',
      label: 'fetchAllByPaging',
    });
  });

  it('indexes localized anchors and uses deterministic route ordering for ties', () => {
    const anchorResults = searchDocumentation(sources, 'vi', 'bộ chuyển đổi');
    expect(anchorResults[0]).toMatchObject({
      kind: 'anchor',
      routeId: 'guides/paging',
      anchor: 'transport-adapter',
    });

    const index = buildSearchIndex(sources, 'vi');
    const ties = index
      .filter((entry) => entry.kind === 'page')
      .sort((left, right) => left.routeId.localeCompare(right.routeId));
    expect(ties.map((entry) => entry.routeId)).toEqual(['api/paging', 'guides/paging']);
    expect(searchDocumentation(sources, 'vi', 'tra cứu').map((entry) => entry.routeId))
      .toEqual(['api/paging', 'guides/paging']);
  });

  it('indexes qualified utility member names from registry API metadata', () => {
    const registryPage = {
      id: 'string-api',
      routeId: 'api/string',
      group: 'api',
      title: { en: 'String API', vi: 'API chuỗi' },
      summary: { en: 'String utilities.', vi: 'Tiện ích chuỗi.' },
      keywords: { en: ['string'], vi: ['chuỗi'] },
      load: async () => ({ render: () => document.createElement('article') }),
    } satisfies DocPage;
    const registryApi = {
      id: 'string-utilities',
      symbol: 'StringUtilities',
      kind: 'namespace',
      pageId: registryPage.id,
      anchor: 'StringUtilities',
      importPath: '@sdcorejs/utils/fns',
      signature: 'StringUtilities',
      summary: { en: 'String helpers.', vi: 'Hàm hỗ trợ chuỗi.' },
      parameters: [],
      returns: { en: 'Utility namespace.', vi: 'Namespace tiện ích.' },
      throws: [],
      runtimeNotes: { en: [], vi: [] },
      securityNotes: { en: [], vi: [] },
      exampleIds: [],
      members: [{
        name: 'format',
        anchor: 'StringUtilities.format',
        signature: 'format(template: string): string',
        summary: { en: 'Formats text.', vi: 'Định dạng văn bản.' },
        parameters: [],
        returns: { en: 'Formatted text.', vi: 'Văn bản đã định dạng.' },
        throws: [],
        runtimeNotes: { en: [], vi: [] },
        securityNotes: { en: [], vi: [] },
        exampleIds: [],
      }],
    } satisfies ApiEntry;

    const results = searchDocumentation(
      createSearchSources([registryPage], [registryApi]),
      'en',
      'StringUtilities.format',
    );

    expect(results[0]).toMatchObject({
      kind: 'api',
      label: 'StringUtilities.format',
      routeId: 'api/string',
      anchor: 'StringUtilities.format',
    });
  });

  it('indexes localized compiled examples and their related symbols', () => {
    const examplePage = {
      id: 'example-page',
      routeId: 'examples/security',
      group: 'examples',
      title: { en: 'Security examples', vi: 'Ví dụ bảo mật' },
      summary: { en: 'Runnable security patterns.', vi: 'Mẫu bảo mật có thể chạy.' },
      keywords: { en: ['security'], vi: ['bảo mật'] },
      load: async () => ({ render: () => document.createElement('article') }),
    } satisfies DocPage;
    const example = {
      id: 'secure-random',
      pageId: examplePage.id,
      anchor: 'secure-random',
      title: { en: 'Handle secure randomness', vi: 'Xử lý ngẫu nhiên an toàn' },
      summary: {
        en: 'Catch secure-random capability failures.',
        vi: 'Bắt lỗi thiếu capability ngẫu nhiên an toàn.',
      },
      language: 'ts',
      loadSource: async () => 'import { Utilities } from "@sdcorejs/utils";',
      relatedSymbols: ['SecureRandomUnavailableError'],
    } satisfies ExampleEntry;
    const exampleSources = createSearchSources([examplePage], [], [example]);

    expect(searchDocumentation(exampleSources, 'en', 'Handle secure randomness', 1)[0])
      .toMatchObject({ kind: 'example', routeId: examplePage.routeId, anchor: example.anchor });
    expect(searchDocumentation(exampleSources, 'vi', 'ngẫu nhiên an toàn', 1)[0])
      .toMatchObject({ kind: 'example', label: example.title.vi });
    expect(searchDocumentation(exampleSources, 'en', 'SecureRandomUnavailableError', 1)[0])
      .toMatchObject({ kind: 'example', anchor: example.anchor });
  });
});

describe('global search keyboard shortcuts', () => {
  it('recognizes slash and Ctrl/Cmd+K', () => {
    expect(isSearchShortcut({ key: '/', target: null })).toBe(true);
    expect(isSearchShortcut({ key: 'k', ctrlKey: true, target: null })).toBe(true);
    expect(isSearchShortcut({ key: 'K', metaKey: true, target: null })).toBe(true);
  });

  it('does not fire from editable controls or with unrelated modifiers', () => {
    expect(isSearchShortcut({ key: '/', target: { tagName: 'INPUT' } })).toBe(false);
    expect(isSearchShortcut({ key: 'k', ctrlKey: true, target: { tagName: 'TEXTAREA' } }))
      .toBe(false);
    expect(isSearchShortcut({ key: '/', target: { isContentEditable: true } })).toBe(false);
    expect(isSearchShortcut({ key: '/', altKey: true, target: null })).toBe(false);
  });

  it('does not fire from descendants of a contenteditable region', () => {
    const editor = document.createElement('div');
    editor.contentEditable = 'true';
    const child = document.createElement('span');
    editor.appendChild(child);

    expect(isSearchShortcut({ key: '/', target: child })).toBe(false);
  });
});
