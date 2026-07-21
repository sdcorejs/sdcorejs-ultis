import { describe, expect, it, vi } from 'vitest';
import { EXAMPLE_ENTRIES, EXAMPLE_PAGES } from './examples';
import type { DocRenderContext } from './types';

const context = (locale: 'en' | 'vi'): DocRenderContext => ({ locale, navigate: vi.fn() });

describe('bilingual compiled examples', () => {
  it('defines unique complete metadata and real TypeScript sources', async () => {
    expect(EXAMPLE_PAGES).toHaveLength(5);
    expect(EXAMPLE_ENTRIES).toHaveLength(12);
    expect(new Set(EXAMPLE_ENTRIES.map(entry => entry.id)).size).toBe(EXAMPLE_ENTRIES.length);

    for (const entry of EXAMPLE_ENTRIES) {
      expect(entry.title.en.trim()).not.toBe('');
      expect(entry.title.vi.trim()).not.toBe('');
      expect(entry.summary.en.trim()).not.toBe('');
      expect(entry.summary.vi.trim()).not.toBe('');
      expect(entry.relatedSymbols.length).toBeGreaterThan(0);
      const source = await entry.loadSource();
      expect(source).toContain('import');
      expect(source).not.toContain('pageBase');
      expect(source).not.toContain('initialPage');
    }
  });

  it('keeps typed-error metadata aligned with the compiled handler source', async () => {
    const example = EXAMPLE_ENTRIES.find(entry => entry.id === 'typed-errors');
    expect(example).toBeDefined();
    const source = await example?.loadSource() ?? '';

    for (const symbol of example?.relatedSymbols ?? []) {
      expect(source, symbol).toContain(symbol);
    }
    expect(source).toContain('Utilities.generateUuid()');
    expect(source).toMatch(/error instanceof SecureRandomUnavailableError/);
    expect(source).not.toMatch(/WebCryptoUnavailableError\s*\|\|\s*error instanceof SecureRandomUnavailableError/);
  });

  it('lazy-loads semantic pages and resolves copyable source blocks', async () => {
    for (const page of EXAMPLE_PAGES) {
      const content = await page.load();
      for (const locale of ['en', 'vi'] as const) {
        document.documentElement.lang = locale;
        const article = content.render(context(locale)) as HTMLElement;
        expect(article.querySelectorAll('h1')).toHaveLength(1);
        if (page.id === 'example-playgrounds') {
          expect(article.querySelectorAll('.playground')).toHaveLength(3);
          continue;
        }
        expect(article.querySelector('h2#example-set')).not.toBeNull();
        expect(article.querySelectorAll('.example-entry').length).toBeGreaterThan(0);
        await vi.waitFor(() => {
          expect(article.querySelectorAll('button.code-copy').length)
            .toBe(article.querySelectorAll('.example-entry').length);
        });
      }
    }
  });
});
