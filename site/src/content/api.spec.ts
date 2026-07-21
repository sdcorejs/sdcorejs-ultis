import { describe, expect, it, vi } from 'vitest';
import { createSearchSources, searchDocumentation } from '../app/search';
import { API_PAGES } from './api';
import {
  API_ENTRIES,
  DOCUMENTED_DEPRECATED_TYPES,
  DOCUMENTED_IMPORT_PATHS,
  DOCUMENTED_NAMESPACE_MEMBERS,
  DOCUMENTED_PUBLIC_SYMBOLS,
  DOCUMENTED_STRUCTURED_PROPERTIES,
} from './api-data';
import { EXAMPLE_ENTRIES } from './examples';
import type { DocRenderContext } from './types';

const context = (locale: 'en' | 'vi'): DocRenderContext => ({ locale, navigate: vi.fn() });

describe('complete bilingual API reference', () => {
  it('aligns runtime entries with the machine-readable public inventories', () => {
    const entrySymbols = API_ENTRIES.map(entry => entry.symbol);
    const documentedImports: Readonly<Record<string, string>> = DOCUMENTED_IMPORT_PATHS;
    expect(API_ENTRIES).toHaveLength(157);
    expect(new Set(entrySymbols).size).toBe(157);
    expect([...entrySymbols].sort()).toEqual([...DOCUMENTED_PUBLIC_SYMBOLS].sort());
    expect(Object.keys(DOCUMENTED_IMPORT_PATHS).sort()).toEqual([...DOCUMENTED_PUBLIC_SYMBOLS].sort());

    for (const entry of API_ENTRIES) {
      expect(entry.importPath, entry.symbol).toBe(documentedImports[entry.symbol]);
      expect(entry.signature.trim(), entry.symbol).not.toBe('');
      expect(entry.summary.en.trim(), entry.symbol).not.toBe('');
      expect(entry.summary.vi.trim(), entry.symbol).not.toBe('');
      expect(entry.returns.en.trim(), entry.symbol).not.toBe('');
      expect(entry.returns.vi.trim(), entry.symbol).not.toBe('');
      expect(entry.summary.en, entry.symbol).not.toMatch(/^Public .+ member\.$/);
      expect(entry.returns.en, entry.symbol)
        .not.toBe('The value or type described by the signature.');
      for (const parameter of entry.parameters) {
        expect(parameter.description.en.trim(), `${entry.symbol}.${parameter.name}`).not.toBe('');
        expect(parameter.description.vi.trim(), `${entry.symbol}.${parameter.name}`).not.toBe('');
      }
      for (const property of entry.properties ?? []) {
        expect(property.description.en.trim(), `${entry.symbol}.${property.name}`).not.toBe('');
        expect(property.description.vi.trim(), `${entry.symbol}.${property.name}`).not.toBe('');
      }
    }
  });

  it('matches compiler-checked structured property metadata including inherited fields', () => {
    for (const [symbol, expectedProperties] of Object.entries(DOCUMENTED_STRUCTURED_PROPERTIES)) {
      const entry = API_ENTRIES.find(candidate => candidate.symbol === symbol);
      const actualProperties = (entry?.properties ?? []).map(property =>
        `${property.name}${property.optional ? '?' : ''}`);
      expect(actualProperties.sort(), symbol).toEqual([...expectedProperties].sort());
    }
  });

  it('keeps incognito type deprecations aligned with the source declaration contract', () => {
    for (const symbol of DOCUMENTED_DEPRECATED_TYPES) {
      const entry = API_ENTRIES.find(candidate => candidate.symbol === symbol);
      expect(entry?.deprecation?.note.en.trim(), symbol).not.toBe('');
      expect(entry?.deprecation?.note.vi.trim(), symbol).not.toBe('');
      expect(entry?.deprecation?.replacement, symbol).toBeUndefined();
    }
  });

  it('covers every namespace member with localized structured documentation', () => {
    const namespaceEntries = new Map(
      API_ENTRIES.filter(entry => entry.members).map(entry => [entry.symbol, entry]),
    );
    const expectedCount = Object.values(DOCUMENTED_NAMESPACE_MEMBERS)
      .reduce((total, members) => total + members.length, 0);
    let actualCount = 0;

    for (const [namespace, expectedMembers] of Object.entries(DOCUMENTED_NAMESPACE_MEMBERS)) {
      const entry = namespaceEntries.get(namespace);
      expect(entry, namespace).toBeDefined();
      const members = entry?.members ?? [];
      actualCount += members.length;
      expect(members.map(member => member.name).sort(), namespace)
        .toEqual([...expectedMembers].sort());
      for (const member of members) {
        expect(member.signature.trim(), `${namespace}.${member.name}`).not.toBe('');
        expect(member.summary.en.trim(), `${namespace}.${member.name}`).not.toBe('');
        expect(member.summary.vi.trim(), `${namespace}.${member.name}`).not.toBe('');
        expect(member.returns.en, `${namespace}.${member.name}`)
          .not.toBe('The value described by the signature.');
      }
    }
    expect(actualCount).toBe(152);
    expect(expectedCount).toBe(152);
  });

  it('keeps example and typed-error references resolvable', () => {
    const examples = new Set<string>(EXAMPLE_ENTRIES.map(example => example.id));
    const symbols = new Map(API_ENTRIES.map(entry => [entry.symbol, entry]));
    const missingExamples: string[] = [];

    for (const entry of API_ENTRIES) {
      if (entry.exampleIds.length === 0) missingExamples.push(entry.symbol);
      for (const exampleId of entry.exampleIds) expect(examples.has(exampleId), entry.symbol).toBe(true);
      for (const error of entry.throws) {
        expect(symbols.get(error.symbol)?.pageId, `${entry.symbol} -> ${error.symbol}`).toBe('api-errors');
      }
      for (const member of entry.members ?? []) {
        if (member.exampleIds.length === 0) missingExamples.push(`${entry.symbol}.${member.name}`);
        for (const exampleId of member.exampleIds) {
          expect(examples.has(exampleId), `${entry.symbol}.${member.name}`).toBe(true);
        }
        for (const error of member.throws) {
          expect(symbols.get(error.symbol)?.pageId, `${entry.symbol}.${member.name} -> ${error.symbol}`)
            .toBe('api-errors');
        }
      }
    }
    expect(missingExamples).toEqual([]);
    expect(API_ENTRIES.filter(entry => entry.pageId === 'api-errors')).toHaveLength(20);
  });

  it('indexes every symbol, typed error, and qualified member as a deep link', () => {
    const sources = createSearchSources(API_PAGES, API_ENTRIES);
    for (const symbol of DOCUMENTED_PUBLIC_SYMBOLS) {
      const result = searchDocumentation(sources, 'en', symbol, 1)[0];
      expect(result?.kind, symbol).toBe('api');
      expect(result?.label, symbol).toBe(symbol);
      expect(result?.anchor, symbol).toBe(API_ENTRIES.find(entry => entry.symbol === symbol)?.anchor);
    }
    const member = searchDocumentation(sources, 'vi', 'StringUtilities.format', 1)[0];
    expect(member).toMatchObject({
      kind: 'api',
      label: 'StringUtilities.format',
      anchor: 'string-utilities-format',
    });
  });

  it('lazy-renders all API pages with stable symbol/member anchors in both locales', async () => {
    expect(API_PAGES).toHaveLength(12);
    for (const page of API_PAGES) {
      const entries = API_ENTRIES.filter(entry => entry.pageId === page.id);
      expect(entries.length, page.id).toBeGreaterThan(0);
      const content = await page.load();
      for (const locale of ['en', 'vi'] as const) {
        document.documentElement.lang = locale;
        const article = content.render(context(locale)) as HTMLElement;
        expect(article.querySelector('h1')?.textContent).toBe(page.title[locale]);
        expect(article.querySelectorAll(':scope > .api-entry')).toHaveLength(entries.length);
        for (const entry of entries) {
          const entryHeading = article.querySelector(`[id="${entry.anchor}"]`);
          expect(entryHeading, entry.symbol).not.toBeNull();
          expect(entryHeading?.tagName, entry.symbol).toBe('H2');
          const entrySection = entryHeading?.closest('.api-entry');
          expect(entrySection?.querySelector(':scope > .api-detail > h4'), entry.symbol).toBeNull();
          expect(entrySection?.querySelector(':scope > .api-detail > h3'), entry.symbol).not.toBeNull();
          for (const member of entry.members ?? []) {
            const memberHeading = article.querySelector(`[id="${member.anchor}"]`);
            expect(memberHeading, `${entry.symbol}.${member.name}`).not.toBeNull();
            expect(memberHeading?.tagName, `${entry.symbol}.${member.name}`).toBe('H3');
            const memberSection = memberHeading?.closest('.api-member');
            expect(memberSection?.querySelector(':scope > .api-detail > h4'), `${entry.symbol}.${member.name}`)
              .not.toBeNull();
          }
        }
      }
    }
  }, 15_000);
});
