import { describe, expect, it, vi } from 'vitest';
import {
  callout,
  codeBlock,
  contentTable,
  createPageContent,
  externalLink,
  paragraph,
  routeLink,
} from './render';
import { GUIDE_PAGES } from './guides';
import { validateRegistry } from './registry';
import { RESOURCE_PAGES } from './resources';
import { START_PAGES } from './start';
import type { DocRenderContext } from './types';

function context(locale: 'en' | 'vi' = 'en'): DocRenderContext {
  return { locale, navigate: vi.fn() };
}

describe('safe documentation rendering', () => {
  it('renders untrusted-looking text literally instead of interpreting markup', () => {
    const text = '<img src=x onerror="alert(1)">';
    const result = paragraph(text);

    expect(result.textContent).toBe(text);
    expect(result.querySelector('img')).toBeNull();

    const block = codeBlock(text, 'Example');
    expect(block.querySelector('code')?.textContent).toBe(text);
    expect(block.querySelector('img')).toBeNull();
  });

  it('hardens external links and rejects executable protocols', () => {
    const link = externalLink('Repository', 'https://github.com/sdcorejs/sdcorejs-utils');

    expect(link.target).toBe('_blank');
    expect(link.rel.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    expect(() => externalLink('Unsafe', 'javascript:alert(1)')).toThrow(TypeError);
  });

  it('keeps normal modified-click behavior and delegates plain route clicks', () => {
    const renderContext = context();
    const link = routeLink(renderContext, 'Paging', {
      routeId: 'guides/paging',
      anchor: 'zero-based-contract',
    });

    expect(link.getAttribute('href')).toBe('#/guides/paging#zero-based-contract');
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(renderContext.navigate).toHaveBeenCalledWith({
      routeId: 'guides/paging',
      anchor: 'zero-based-contract',
    });

    link.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    }));
    expect(renderContext.navigate).toHaveBeenCalledTimes(1);
  });

  it('creates semantic localized articles, callouts, and accessible tables', () => {
    const page = createPageContent({
      eyebrow: { en: 'Guide', vi: 'Hướng dẫn' },
      title: { en: 'Safe objects', vi: 'Đối tượng an toàn' },
      summary: { en: 'Protect data boundaries.', vi: 'Bảo vệ biên dữ liệu.' },
      sections: [{
        anchor: 'boundary',
        title: { en: 'Boundary', vi: 'Biên dữ liệu' },
        render: ({ locale }) => [
          callout('security', locale === 'vi' ? 'Cảnh báo' : 'Warning', paragraph('Safe text')),
          contentTable(
            locale === 'vi' ? 'Hành vi' : 'Behavior',
            locale === 'vi' ? ['Đầu vào', 'Kết quả'] : ['Input', 'Result'],
            [[["constructor"], [locale === 'vi' ? 'Bị từ chối' : 'Rejected']]],
          ),
        ],
      }],
    });

    const article = page.render(context('vi')) as HTMLElement;
    expect(article.querySelector('h1')?.textContent).toBe('Đối tượng an toàn');
    expect(article.querySelector('h2')?.id).toBe('boundary');
    expect(article.querySelector('aside[role="note"]')).not.toBeNull();
    expect(article.querySelector('th')?.scope).toBe('col');
    expect(article.querySelector('[role="region"]')?.getAttribute('aria-label')).toBe('Hành vi');
  });
});

describe('Start, Guides, and Resources content', () => {
  const pages = [...START_PAGES, ...GUIDE_PAGES, ...RESOURCE_PAGES];

  it('defines unique, locale-complete page and route metadata', () => {
    expect(pages).toHaveLength(18);
    expect(new Set(pages.map((page) => page.id)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.routeId)).size).toBe(pages.length);

    for (const page of pages) {
      for (const locale of ['en', 'vi'] as const) {
        expect(page.title[locale].trim()).not.toBe('');
        expect(page.summary[locale].trim()).not.toBe('');
        expect(page.keywords[locale].length).toBeGreaterThan(0);
        for (const anchor of page.anchors ?? []) {
          expect(anchor.title[locale].trim()).not.toBe('');
        }
      }
    }

    expect(validateRegistry({ pages, api: [], examples: [] })).toEqual([]);
  });

  it('lazy-loads every page in both locales with matching stable section anchors', async () => {
    for (const page of pages) {
      const content = await page.load();
      for (const locale of ['en', 'vi'] as const) {
        const article = content.render(context(locale)) as HTMLElement;
        const expectedAnchors = (page.anchors ?? []).map((anchor) => anchor.anchor);
        const renderedAnchors = Array.from(article.querySelectorAll<HTMLHeadingElement>('h2[id]'))
          .map((heading) => heading.id);

        expect(article.tagName).toBe('ARTICLE');
        expect(article.querySelector('h1')?.textContent?.trim()).not.toBe('');
        expect(renderedAnchors).toEqual(expectedAnchors);
        expect(article.querySelectorAll('h1')).toHaveLength(1);
        expect(article.querySelectorAll('h2')).toHaveLength(expectedAnchors.length);

        for (const link of Array.from(article.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'))) {
          expect(link.rel.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
        }
      }
    }
  });
});
