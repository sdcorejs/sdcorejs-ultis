import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRegistry } from '../content/registry';
import type { DocGroupId, DocPage, DocRegistry, Locale } from '../content/types';
import { mountDocsSite, type DocsSiteHandle } from './docs-shell';

const mounted: DocsSiteHandle[] = [];

function localized<T>(en: T, vi: T) {
  return { en, vi } as const;
}

function page(
  id: string,
  routeId: string,
  group: DocGroupId,
  order: number,
  en: string,
  vi: string,
): DocPage {
  return {
    id,
    routeId,
    group,
    order,
    title: localized(en, vi),
    summary: localized(`${en} summary`, `Tóm tắt ${vi}`),
    keywords: localized([en.toLocaleLowerCase()], [vi.toLocaleLowerCase()]),
    anchors: [{
      anchor: `${id}-details`,
      title: localized('Details', 'Chi tiết'),
      keywords: localized(['details'], ['chi tiết']),
    }],
    load: async () => ({
      render: ({ locale }: { readonly locale: Locale }) => {
        const article = document.createElement('article');
        const heading = document.createElement('h1');
        heading.textContent = locale === 'en' ? en : vi;
        const section = document.createElement('section');
        section.id = `${id}-details`;
        const sectionHeading = document.createElement('h2');
        sectionHeading.textContent = locale === 'en' ? 'Details' : 'Chi tiết';
        section.append(sectionHeading);
        article.append(heading, section);
        return article;
      },
    }),
  };
}

function fixtureRegistry() {
  return buildRegistry({
    pages: [
      page('overview', 'start/overview', 'start', 0, 'Overview', 'Tổng quan'),
      page('paging', 'guides/paging', 'guides', 0, 'Zero-based paging', 'Phân trang từ 0'),
      page('api', 'api/functions', 'api', 0, 'Functions', 'Hàm'),
      page('examples', 'examples/validation', 'examples', 0, 'Validation examples', 'Ví dụ kiểm tra'),
      page('resources', 'resources/security', 'resources', 0, 'Security', 'Bảo mật'),
    ],
    api: [{
      id: 'fetch-all',
      symbol: 'fetchAllByPaging',
      kind: 'function',
      pageId: 'api',
      anchor: 'fetch-all-by-paging',
      importPath: '@sdcorejs/utils',
      signature: 'fetchAllByPaging(fetchPage, options?)',
      summary: localized('Fetch every zero-based page.', 'Lấy mọi trang đánh số từ 0.'),
      parameters: [],
      returns: localized('All items.', 'Toàn bộ phần tử.'),
      throws: [],
      runtimeNotes: localized([], []),
      securityNotes: localized([], []),
      exampleIds: ['paging-basic'],
    }],
    examples: [{
      id: 'paging-basic',
      pageId: 'examples',
      anchor: 'paging-basic',
      title: localized('Fetch from page zero', 'Lấy từ trang số không'),
      summary: localized('A bounded paging example.', 'Ví dụ phân trang có giới hạn.'),
      language: 'ts',
      loadSource: async () => 'import { fetchAllByPaging } from "@sdcorejs/utils";',
      relatedSymbols: ['fetchAllByPaging'],
    }],
  });
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function mount(hash = '', registry: DocRegistry = fixtureRegistry()): DocsSiteHandle {
  document.documentElement.lang = '';
  document.title = '';
  document.body.replaceChildren();
  localStorage.clear();
  window.location.hash = hash;
  const root = document.createElement('div');
  root.id = 'app';
  document.body.append(root);
  const handle = mountDocsSite({ root, registry, version: '1.2.0' });
  mounted.push(handle);
  return handle;
}

afterEach(() => {
  while (mounted.length > 0) mounted.pop()?.destroy();
  document.body.className = '';
  document.body.style.overflow = '';
  document.body.replaceChildren();
  localStorage.clear();
  window.location.hash = '';
});

describe('documentation site shell', () => {
  it('starts in English and renders all semantic navigation groups', async () => {
    mount('#/start/overview');
    await settle();

    expect(document.documentElement.lang).toBe('en');
    expect(document.querySelector('header')).not.toBeNull();
    expect(document.querySelector('nav[aria-label="Documentation"]')).not.toBeNull();
    expect(document.querySelector('main')?.textContent).toContain('Overview');
    expect(document.body.textContent).toContain('Start');
    expect(document.body.textContent).toContain('Guides');
    expect(document.body.textContent).toContain('API Reference');
    expect(document.body.textContent).toContain('Examples');
    expect(document.body.textContent).toContain('Resources');
    expect(document.title).toBe('Overview — @sdcorejs/utils');
    expect(document.querySelector('[aria-current="page"]')?.textContent).toContain('Overview');
    expect(document.querySelector<HTMLAnchorElement>('.repository-link')?.rel.split(' '))
      .toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
  });

  it('moves focus with the skip link without corrupting the hash route', async () => {
    mount('#/guides/paging');
    await settle();
    const before = window.location.hash;
    const skip = document.querySelector('.skip-link') as HTMLAnchorElement;

    skip.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(window.location.hash).toBe(before);
    expect(document.activeElement).toBe(document.querySelector('main'));
  });

  it('persists Vietnamese, rerenders the page, and preserves the route and anchor', async () => {
    const handle = mount('#/guides/paging#paging-details');
    await settle();
    const before = window.location.hash;

    (document.querySelector('[data-locale="vi"]') as HTMLButtonElement).click();
    await settle();

    expect(handle.locale).toBe('vi');
    expect(document.documentElement.lang).toBe('vi');
    expect(localStorage.getItem('sdcorejs-utils.locale')).toBe('vi');
    expect(window.location.hash).toBe(before);
    expect(document.querySelector('main')?.textContent).toContain('Phân trang từ 0');
    expect(document.title).toBe('Phân trang từ 0 — @sdcorejs/utils');
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Tiếng Việt');
  });

  it('renders a localized not-found state without losing the requested route', async () => {
    mount('#/missing/reference');
    await settle();

    expect(document.querySelector('main')?.textContent).toContain('Page not found');
    expect(document.querySelector('main a')?.getAttribute('href')).toBe('#/start/overview');

    (document.querySelector('[data-locale="vi"]') as HTMLButtonElement).click();
    await settle();
    expect(window.location.hash).toBe('#/missing/reference');
    expect(document.querySelector('main')?.textContent).toContain('Không tìm thấy trang');
  });

  it('opens localized search from the slash shortcut and navigates to a deep result', async () => {
    mount('#/start/overview');
    await settle();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('.docs-site')?.inert).toBe(true);

    const input = dialog.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'fetchAllByPaging';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    const result = dialog.querySelector('[data-search-result]') as HTMLButtonElement;
    expect(result.textContent).toContain('fetchAllByPaging');
    result.click();

    expect(window.location.hash).toBe('#/api/functions#fetch-all-by-paging');
    expect(dialog.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.docs-site')?.inert).toBe(false);
  });

  it('hydrates API search on demand for the production navigation-only catalog', async () => {
    document.documentElement.lang = '';
    document.body.replaceChildren();
    localStorage.clear();
    window.location.hash = '#/start/overview';
    const root = document.createElement('div');
    root.id = 'app';
    document.body.append(root);
    mounted.push(mountDocsSite({ root, version: '1.2.0' }));
    await settle();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const input = dialog.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'StringUtilities';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));

    await vi.waitFor(() => {
      expect(dialog.querySelector('[data-search-result]')?.textContent)
        .toContain('StringUtilities');
    });
  });

  it('uses one combobox focus model and only opens a result when Enter comes from the input', async () => {
    mount('#/start/overview');
    await settle();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    await Promise.resolve();
    const dialog = document.querySelector('.search-overlay') as HTMLElement;
    const input = dialog.querySelector('input[type="search"]') as HTMLInputElement;
    const close = dialog.querySelector('.search-close') as HTMLButtonElement;
    input.value = 'fetchAllByPaging';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    const result = dialog.querySelector('[data-search-result]') as HTMLButtonElement;

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-activedescendant')).toBe(result.id);
    expect(result.tabIndex).toBe(-1);
    close.focus();
    close.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, cancelable: true,
    }));
    expect(window.location.hash).toBe('#/start/overview');
    expect(dialog.hidden).toBe(false);

    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, cancelable: true,
    }));
    expect(window.location.hash).toBe('#/api/functions#fetch-all-by-paging');
    expect(dialog.hidden).toBe(true);
  });

  it('searches localized example metadata and navigates to its stable anchor', async () => {
    mount('#/start/overview');
    await settle();
    const localeButton = document.querySelector('[data-locale="vi"]') as HTMLButtonElement;
    localeButton.click();
    await settle();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const input = dialog.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'Lấy từ trang số không';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    const result = dialog.querySelector('[data-search-result]') as HTMLButtonElement;

    expect(result.textContent).toContain('Lấy từ trang số không');
    result.click();
    expect(window.location.hash).toBe('#/examples/validation#paging-basic');
  });

  it('keeps keyboard focus inside the open search dialog', async () => {
    mount('#/start/overview');
    await settle();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    await Promise.resolve();
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const input = dialog.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'page';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    input.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: true, bubbles: true, cancelable: true,
    }));
    expect(dialog.contains(document.activeElement)).toBe(true);
    const close = dialog.querySelector('.search-close') as HTMLButtonElement;
    expect(document.activeElement).toBe(close);

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab', bubbles: true, cancelable: true,
    }));
    expect(document.activeElement).toBe(input);
  });

  it('closes the mobile drawer with Escape and releases scroll lock on destroy', async () => {
    const handle = mount('#/start/overview');
    await settle();
    const toggle = document.querySelector('[data-action="toggle-navigation"]') as HTMLButtonElement;

    toggle.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    const drawer = document.querySelector('.docs-sidebar') as HTMLElement;
    const drawerClose = drawer.querySelector('.drawer-close') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(drawer.getAttribute('role')).toBe('dialog');
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector<HTMLElement>('header')?.inert).toBe(true);
    expect(document.querySelector<HTMLElement>('main')?.inert).toBe(true);
    expect(document.activeElement).toBe(drawerClose);
    expect(document.body.classList.contains('is-scroll-locked')).toBe(true);

    const drawerLinks = drawer.querySelectorAll<HTMLAnchorElement>('a[href]');
    drawerLinks.item(drawerLinks.length - 1).focus();
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab', bubbles: true, cancelable: true,
    }));
    expect(document.activeElement).toBe(drawerClose);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.hasAttribute('role')).toBe(false);
    expect(document.querySelector<HTMLElement>('header')?.inert).toBe(false);
    expect(document.querySelector<HTMLElement>('main')?.inert).toBe(false);
    expect(document.activeElement).toBe(toggle);
    expect(document.body.classList.contains('is-scroll-locked')).toBe(false);

    toggle.click();
    handle.destroy();
    expect(document.body.classList.contains('is-scroll-locked')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('clears a stale loading state when a pending route becomes not found', async () => {
    let resolvePage!: (content: Awaited<ReturnType<DocPage['load']>>) => void;
    const pendingContent = new Promise<Awaited<ReturnType<DocPage['load']>>>((resolve) => {
      resolvePage = resolve;
    });
    const slowPage: DocPage = {
      ...page('slow', 'start/slow', 'start', 0, 'Slow page', 'Trang chậm'),
      load: () => pendingContent,
    };
    const registry = buildRegistry({ pages: [slowPage], api: [], examples: [] });
    const handle = mount('#/start/slow', registry);

    expect(document.querySelector('.docs-content')?.getAttribute('aria-busy')).toBe('true');
    handle.navigate({ routeId: 'missing/route' });
    await settle();
    expect(document.querySelector('main')?.textContent).toContain('Page not found');
    expect(document.querySelector('.docs-content')?.getAttribute('aria-busy')).toBe('false');

    resolvePage({
      render: () => {
        const article = document.createElement('article');
        article.textContent = 'Late content';
        return article;
      },
    });
    await settle();
    expect(document.querySelector('main')?.textContent).not.toContain('Late content');
    expect(document.querySelector('.docs-content')?.getAttribute('aria-busy')).toBe('false');
  });

  it('marks an empty registry as not busy', async () => {
    mount('', buildRegistry({ pages: [], api: [], examples: [] }));
    await settle();

    expect(document.querySelector('main')?.textContent).toContain('Documentation is being prepared');
    expect(document.querySelector('.docs-content')?.getAttribute('aria-busy')).toBe('false');
  });
});
