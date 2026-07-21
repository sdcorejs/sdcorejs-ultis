import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  RegistryValidationError,
  buildRegistry,
  defineApiEntry,
  defineExample,
  definePage,
  lazyPage,
  validateRegistry,
} from './registry';
import { registry } from './catalog';
import type {
  ApiEntry,
  ApiMember,
  DocPage,
  DocPageContent,
  ExampleEntry,
  Localized,
} from './types';

const content: DocPageContent = {
  render: () => document.createElement('article'),
};

const page = definePage({
  id: 'paging-guide',
  routeId: 'guides/paging',
  group: 'guides',
  title: { en: 'Paging', vi: 'Phân trang' },
  summary: { en: 'Page from zero.', vi: 'Trang bắt đầu từ không.' },
  keywords: { en: ['paging'], vi: ['phân trang'] },
  load: async () => content,
});

const api = defineApiEntry({
  id: 'fetch-all-by-paging',
  symbol: 'fetchAllByPaging',
  kind: 'function',
  pageId: page.id,
  anchor: 'fetchAllByPaging',
  importPath: '@sdcorejs/utils/fns',
  signature: 'fetchAllByPaging<T>(callback, options?): Promise<T[]>',
  summary: { en: 'Fetch all pages.', vi: 'Lấy tất cả các trang.' },
  parameters: [],
  returns: { en: 'All items.', vi: 'Tất cả phần tử.' },
  throws: [],
  runtimeNotes: { en: ['Starts at zero.'], vi: ['Bắt đầu từ không.'] },
  securityNotes: { en: [], vi: [] },
  exampleIds: ['paging-basic'],
});

const example = defineExample({
  id: 'paging-basic',
  pageId: page.id,
  anchor: 'paging-basic',
  title: { en: 'Page zero', vi: 'Trang không' },
  summary: { en: 'Fetch from zero.', vi: 'Lấy từ trang không.' },
  language: 'ts',
  loadSource: async () => 'fetchAllByPaging(callback)',
  relatedSymbols: ['fetchAllByPaging'],
});

const member: ApiMember = {
  name: 'format',
  anchor: 'StringUtilities.format',
  signature: 'format(template: string, values: unknown[]): string',
  summary: { en: 'Formats a string.', vi: 'Định dạng chuỗi.' },
  parameters: [],
  returns: { en: 'The formatted string.', vi: 'Chuỗi đã định dạng.' },
  throws: [],
  runtimeNotes: { en: [], vi: [] },
  securityNotes: { en: [], vi: [] },
  exampleIds: ['paging-basic'],
};

describe('localized content types', () => {
  it('require both English and Vietnamese at compile time', () => {
    const translated: Localized<string> = { en: 'Paging', vi: 'Phân trang' };
    expectTypeOf(translated.en).toBeString();
    expectTypeOf(translated.vi).toBeString();

    // @ts-expect-error Localized<T> requires Vietnamese as well as English.
    const incomplete: Localized<string> = { en: 'Paging' };
    expect(incomplete.en).toBe('Paging');
  });

  it('exposes typed page, API, and example contracts', () => {
    expectTypeOf(page).toMatchTypeOf<DocPage>();
    expectTypeOf(api).toMatchTypeOf<ApiEntry>();
    expectTypeOf(example).toMatchTypeOf<ExampleEntry>();
    expectTypeOf(member).toMatchTypeOf<ApiMember>();
  });
});

describe('content registry validation', () => {
  it('builds indexed registries and validates cross-references', () => {
    const built = buildRegistry({ pages: [page], api: [api], examples: [example] });

    expect(built.pagesByRoute.get('guides/paging')).toBe(page);
    expect(built.apiBySymbol.get('fetchAllByPaging')).toBe(api);
    expect(built.examplesById.get('paging-basic')).toBe(example);
    expect(validateRegistry(built)).toEqual([]);
  });

  it('rejects duplicate route IDs and API symbols with actionable issues', () => {
    expect(() => buildRegistry({
      pages: [page, { ...page, id: 'other-page' }],
      api: [api, { ...api, id: 'other-api' }],
      examples: [example],
    })).toThrowError(RegistryValidationError);

    try {
      buildRegistry({
        pages: [page, { ...page, id: 'other-page' }],
        api: [api, { ...api, id: 'other-api' }],
        examples: [example],
      });
    } catch (error) {
      expect((error as RegistryValidationError).issues.map((issue) => issue.code))
        .toEqual(expect.arrayContaining(['duplicate-route', 'duplicate-symbol']));
    }
  });

  it('rejects duplicate API entry IDs independently of symbol uniqueness', () => {
    const issues = validateRegistry({
      pages: [page],
      api: [api, {
        ...api,
        symbol: 'fetchAllByPagingAlias',
        anchor: 'fetchAllByPagingAlias',
      }],
      examples: [example],
    });

    expect(issues).toContainEqual(expect.objectContaining({
      code: 'duplicate-api-id',
      path: 'api[1].id',
    }));
  });

  it('rejects anchor collisions across page, API, and example entries on one page', () => {
    const sharedAnchor = 'shared-deep-link';
    const issues = validateRegistry({
      pages: [{
        ...page,
        anchors: [{
          anchor: sharedAnchor,
          title: { en: 'Shared', vi: 'Dùng chung' },
        }],
      }],
      api: [{ ...api, anchor: sharedAnchor }],
      examples: [{ ...example, anchor: sharedAnchor }],
    });

    expect(issues.filter((issue) => issue.code === 'duplicate-anchor')).toEqual([
      expect.objectContaining({ path: 'api[0].anchor' }),
      expect.objectContaining({ path: 'examples[0].anchor' }),
    ]);
  });

  it('allows the same anchor text on different pages', () => {
    const secondPage = {
      ...page,
      id: 'second-page',
      routeId: 'guides/second',
      anchors: [{ anchor: 'shared', title: { en: 'Shared', vi: 'Dùng chung' } }],
    };
    const issues = validateRegistry({
      pages: [
        { ...page, anchors: [{ anchor: 'shared', title: { en: 'Shared', vi: 'Dùng chung' } }] },
        secondPage,
      ],
      api: [],
      examples: [],
    });

    expect(issues).toEqual([]);
  });

  it('validates API member locales, references, names, and deep-link anchors', () => {
    const issues = validateRegistry({
      pages: [page],
      api: [{
        ...api,
        members: [
          member,
          {
            ...member,
            summary: { en: 'English only' },
            exampleIds: ['missing-example'],
          } as unknown as ApiMember,
        ],
      }],
      examples: [example],
    });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'duplicate-member-name',
        path: 'api[0].members[1].name',
      }),
      expect.objectContaining({
        code: 'duplicate-anchor',
        path: 'api[0].members[1].anchor',
      }),
      expect.objectContaining({
        code: 'missing-locale',
        path: 'api[0].members[1].summary.vi',
      }),
      expect.objectContaining({
        code: 'unknown-example',
        path: 'api[0].members[1].exampleIds[0]',
      }),
    ]));
  });

  it('requires at least one valid example for every API entry and member', () => {
    const issues = validateRegistry({
      pages: [page],
      api: [{ ...api, exampleIds: [], members: [{ ...member, exampleIds: [] }] }],
      examples: [example],
    });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'missing-example',
        path: 'api[0].exampleIds',
      }),
      expect.objectContaining({
        code: 'missing-example',
        path: 'api[0].members[0].exampleIds',
      }),
    ]));
  });

  it('reports missing locale fields and broken references at runtime', () => {
    const invalidPage = {
      ...page,
      summary: { en: 'English only' },
    } as unknown as DocPage;
    const issues = validateRegistry({
      pages: [invalidPage],
      api: [{ ...api, pageId: 'missing-page', exampleIds: ['missing-example'] }],
      examples: [{ ...example, relatedSymbols: ['missingSymbol'] }],
    });

    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'missing-locale',
      'unknown-page',
      'unknown-example',
      'unknown-symbol',
    ]));
  });

  it('supports lazy page modules with either named content or a default export', async () => {
    const namedLoader = lazyPage(async () => ({ content }));
    const defaultLoader = lazyPage(async () => ({ default: content }));

    await expect(namedLoader()).resolves.toBe(content);
    await expect(defaultLoader()).resolves.toBe(content);
  });

  it('exports the complete, cross-referenced documentation registry', () => {
    expect(registry.pages).toHaveLength(35);
    expect(registry.api).toHaveLength(157);
    expect(registry.examples).toHaveLength(12);
    expect(registry.pagesByRoute.get('start/overview')?.group).toBe('start');
    expect(registry.pagesByRoute.get('api/errors')?.group).toBe('api');
    expect(registry.pagesByRoute.get('examples/playgrounds')?.group).toBe('examples');
    expect(registry.apiBySymbol.get('fetchAllByPaging')?.pageId)
      .toBe('api-object-utility-serialization');
    expect(validateRegistry(registry)).toEqual([]);
  });
});
