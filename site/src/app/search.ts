import type { ApiEntry, DocPage, ExampleEntry, Locale, Localized } from '../content/types';

export interface SearchAnchorSource {
  readonly anchor: string;
  readonly title: Localized<string>;
  readonly keywords?: Localized<readonly string[]>;
}

export interface SearchApiSource {
  readonly symbol: string;
  readonly anchor: string;
  readonly summary: Localized<string>;
  readonly keywords?: Localized<readonly string[]>;
}

export interface SearchExampleSource {
  readonly anchor: string;
  readonly title: Localized<string>;
  readonly summary: Localized<string>;
  readonly keywords: readonly string[];
}

export interface SearchPageSource {
  readonly routeId: string;
  readonly title: Localized<string>;
  readonly summary: Localized<string>;
  readonly keywords: Localized<readonly string[]>;
  readonly anchors?: readonly SearchAnchorSource[];
  readonly apiSymbols?: readonly SearchApiSource[];
  readonly examples?: readonly SearchExampleSource[];
}

export type SearchResultKind = 'api' | 'anchor' | 'example' | 'page';

export interface SearchIndexEntry {
  readonly kind: SearchResultKind;
  readonly routeId: string;
  readonly anchor: string | null;
  readonly label: string;
  readonly summary: string;
  readonly keywords: readonly string[];
  readonly normalizedLabel: string;
  readonly normalizedSummary: string;
  readonly normalizedKeywords: readonly string[];
  readonly normalizedAnchor: string;
}

export interface SearchResult extends SearchIndexEntry {
  readonly score: number;
}

export interface KeyboardShortcutLike {
  readonly key: string;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly altKey?: boolean;
  readonly shiftKey?: boolean;
  readonly target?: EventTarget | EditableTargetLike | null;
}

interface EditableTargetLike {
  readonly tagName?: string;
  readonly isContentEditable?: boolean;
  readonly contentEditable?: string;
  readonly parentElement?: EditableTargetLike | null;
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function createEntry(
  kind: SearchResultKind,
  routeId: string,
  anchor: string | null,
  label: string,
  summary: string,
  keywords: readonly string[],
): SearchIndexEntry {
  return {
    kind,
    routeId,
    anchor,
    label,
    summary,
    keywords,
    normalizedLabel: normalizeSearchText(label),
    normalizedSummary: normalizeSearchText(summary),
    normalizedKeywords: keywords.map(normalizeSearchText),
    normalizedAnchor: normalizeSearchText(anchor ?? ''),
  };
}

export function buildSearchIndex(
  sources: readonly SearchPageSource[],
  locale: Locale,
): readonly SearchIndexEntry[] {
  const entries: SearchIndexEntry[] = [];

  for (const source of sources) {
    entries.push(createEntry(
      'page',
      source.routeId,
      null,
      source.title[locale],
      source.summary[locale],
      source.keywords[locale],
    ));

    for (const anchor of source.anchors ?? []) {
      entries.push(createEntry(
        'anchor',
        source.routeId,
        anchor.anchor,
        anchor.title[locale],
        source.summary[locale],
        anchor.keywords?.[locale] ?? [],
      ));
    }

    for (const api of source.apiSymbols ?? []) {
      entries.push(createEntry(
        'api',
        source.routeId,
        api.anchor,
        api.symbol,
        api.summary[locale],
        api.keywords?.[locale] ?? [],
      ));
    }

    for (const example of source.examples ?? []) {
      entries.push(createEntry(
        'example',
        source.routeId,
        example.anchor,
        example.title[locale],
        example.summary[locale],
        example.keywords,
      ));
    }
  }

  return entries;
}

export function createSearchSources(
  pages: readonly DocPage[],
  apiEntries: readonly ApiEntry[],
  examples: readonly ExampleEntry[] = [],
): readonly SearchPageSource[] {
  const apiByPage = new Map<string, SearchApiSource[]>();
  for (const api of apiEntries) {
    const entries = apiByPage.get(api.pageId) ?? [];
    entries.push({
      symbol: api.symbol,
      anchor: api.anchor,
      summary: api.summary,
      keywords: {
        en: api.aliases ?? [],
        vi: api.aliases ?? [],
      },
    });
    for (const member of api.members ?? []) {
      entries.push({
        symbol: `${api.symbol}.${member.name}`,
        anchor: member.anchor,
        summary: member.summary,
      });
    }
    apiByPage.set(api.pageId, entries);
  }


  const examplesByPage = new Map<string, SearchExampleSource[]>();
  for (const example of examples) {
    const entries = examplesByPage.get(example.pageId) ?? [];
    entries.push({
      anchor: example.anchor,
      title: example.title,
      summary: example.summary,
      keywords: example.relatedSymbols,
    });
    examplesByPage.set(example.pageId, entries);
  }

  return pages.map((page) => ({
    routeId: page.routeId,
    title: page.title,
    summary: page.summary,
    keywords: page.keywords,
    anchors: page.anchors,
    apiSymbols: apiByPage.get(page.id),
    examples: examplesByPage.get(page.id),
  }));
}

function scoreEntry(entry: SearchIndexEntry, query: string): number {
  if (entry.kind === 'api' && entry.normalizedLabel === query) return 1_200;
  if (entry.normalizedAnchor === query) return 1_100;
  if (entry.normalizedLabel === query) return 1_000;
  if (entry.normalizedKeywords.includes(query)) return 900;
  if (entry.normalizedLabel.startsWith(query)) return 800;
  if (entry.normalizedAnchor.startsWith(query)) return 750;
  if (entry.normalizedKeywords.some((keyword) => keyword.startsWith(query))) return 700;
  if (entry.normalizedLabel.includes(query)) return 600;
  if (entry.normalizedSummary.includes(query)) return 500;
  if (entry.normalizedKeywords.some((keyword) => keyword.includes(query))) return 450;

  const tokens = query.split(' ').filter(Boolean);
  const haystack = [
    entry.normalizedLabel,
    entry.normalizedSummary,
    entry.normalizedAnchor,
    ...entry.normalizedKeywords,
  ].join(' ');
  return tokens.length > 1 && tokens.every((token) => haystack.includes(token)) ? 300 : 0;
}

const KIND_ORDER: Readonly<Record<SearchResultKind, number>> = {
  page: 0,
  anchor: 1,
  api: 2,
  example: 3,
};

export function searchIndex(
  index: readonly SearchIndexEntry[],
  query: string,
  limit = 20,
): readonly SearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery || limit <= 0) return [];

  return index
    .map((entry) => ({ ...entry, score: scoreEntry(entry, normalizedQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) =>
      right.score - left.score
      || left.routeId.localeCompare(right.routeId, 'en')
      || KIND_ORDER[left.kind] - KIND_ORDER[right.kind]
      || (left.anchor ?? '').localeCompare(right.anchor ?? '', 'en'))
    .slice(0, limit);
}

export function searchDocumentation(
  sources: readonly SearchPageSource[],
  locale: Locale,
  query: string,
  limit = 20,
): readonly SearchResult[] {
  return searchIndex(buildSearchIndex(sources, locale), query, limit);
}

export function isEditableTarget(target: EventTarget | EditableTargetLike | null | undefined): boolean {
  if (!target || typeof target !== 'object') return false;
  let candidate: EditableTargetLike | null | undefined = target as EditableTargetLike;
  const visited = new Set<EditableTargetLike>();

  while (candidate && !visited.has(candidate)) {
    visited.add(candidate);
    const tagName = candidate.tagName?.toUpperCase();
    const contentEditable = candidate.contentEditable?.toLocaleLowerCase();
    if (
      candidate.isContentEditable === true
      || (contentEditable !== undefined
        && contentEditable !== 'false'
        && contentEditable !== 'inherit')
      || tagName === 'INPUT'
      || tagName === 'TEXTAREA'
      || tagName === 'SELECT'
    ) {
      return true;
    }
    candidate = candidate.parentElement;
  }

  return false;
}

export function isSearchShortcut(event: KeyboardShortcutLike): boolean {
  if (isEditableTarget(event.target)) return false;

  const key = event.key.toLocaleLowerCase();
  if (key === '/') return !event.ctrlKey && !event.metaKey && !event.altKey;
  if (key !== 'k' || event.altKey || event.shiftKey) return false;
  return Boolean(event.ctrlKey || event.metaKey);
}
