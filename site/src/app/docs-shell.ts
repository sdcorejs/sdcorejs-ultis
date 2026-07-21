import { runtimeRegistry as defaultRegistry } from '../content/runtime-catalog';
import type {
  DocNavigationRegistry,
  DocPage,
  DocRegistry,
  DocRouteTarget,
  Locale,
} from '../content/types';
import { createDocsLayout, type DocsLayout } from '../components/docs-layout';
import { createSearchDialog, type SearchDialog } from '../components/search-dialog';
import { createLocaleController, type LocaleController, type LocaleStorage } from './i18n';
import { createHashRouter, formatHashRoute, type HashRouter, type ResolvedHashRoute } from './router';
import {
  createSearchSources,
  isSearchShortcut,
  searchDocumentation,
} from './search';

export interface MountDocsSiteOptions {
  readonly root: HTMLElement;
  readonly registry?: DocNavigationRegistry & Partial<Pick<DocRegistry, 'api' | 'examples'>>;
  readonly version?: string;
  readonly repositoryUrl?: string;
  readonly window?: Window;
  readonly document?: Document;
  readonly storage?: LocaleStorage | null;
}

export interface DocsSiteHandle {
  readonly locale: Locale;
  readonly navigate: (target: DocRouteTarget) => void;
  readonly setLocale: (locale: Locale) => void;
  readonly openSearch: () => void;
  readonly destroy: () => void;
}

const COPY = {
  en: {
    backHome: 'Return to overview',
    emptyBody: 'The typed registry is empty. Content can be added without changing the application shell.',
    emptyTitle: 'Documentation is being prepared',
    errorBody: 'The page module could not be loaded. Check your connection and try again.',
    errorTitle: 'Unable to load this page',
    loading: 'Loading documentation…',
    localeAnnouncement: 'Language changed to English.',
    notFoundBody: 'The route may have moved, or the address may be incomplete.',
    notFoundTitle: 'Page not found',
    retry: 'Try again',
  },
  vi: {
    backHome: 'Về trang tổng quan',
    emptyBody: 'Registry có kiểu hiện đang trống. Có thể thêm nội dung mà không cần thay đổi application shell.',
    emptyTitle: 'Tài liệu đang được chuẩn bị',
    errorBody: 'Không thể tải module của trang. Hãy kiểm tra kết nối và thử lại.',
    errorTitle: 'Không thể tải trang này',
    loading: 'Đang tải tài liệu…',
    localeAnnouncement: 'Ngôn ngữ đã đổi sang Tiếng Việt.',
    notFoundBody: 'Trang có thể đã được chuyển hoặc địa chỉ chưa đầy đủ.',
    notFoundTitle: 'Không tìm thấy trang',
    retry: 'Thử lại',
  },
} as const;

function createMessage(
  document: Document,
  titleText: string,
  bodyText: string,
  className: string,
): { readonly element: HTMLElement; readonly title: HTMLHeadingElement } {
  const element = document.createElement('section');
  element.className = className;
  const eyebrow = document.createElement('span');
  eyebrow.className = 'message-code';
  eyebrow.textContent = className.includes('not-found') ? '404' : '@sdcorejs/utils';
  const title = document.createElement('h1');
  title.textContent = titleText;
  const body = document.createElement('p');
  body.textContent = bodyText;
  element.append(eyebrow, title, body);
  return { element, title };
}

function safeExternalUrl(candidate: string, fallback: string): string {
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function focusContent(document: Document, layout: DocsLayout, anchor: string | null): void {
  const anchorTarget = anchor
    ? Array.from(layout.content.querySelectorAll<HTMLElement>('[id]'))
      .find((candidate) => candidate.id === anchor) ?? null
    : null;
  const target = anchorTarget ?? layout.content.querySelector<HTMLElement>('h1') ?? layout.main;
  if (!anchorTarget) {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
  target.focus({ preventScroll: true });
  if (anchorTarget && typeof anchorTarget.scrollIntoView === 'function') {
    anchorTarget.scrollIntoView({ block: 'start' });
  }
}

export function mountDocsSite(options: MountDocsSiteOptions): DocsSiteHandle {
  const root = options.root;
  const document = options.document ?? root.ownerDocument;
  const candidateWindow = options.window ?? document.defaultView;
  if (!candidateWindow) throw new Error('The documentation site requires a Window.');
  const browserWindow: Window = candidateWindow;

  const registry: DocNavigationRegistry & Partial<Pick<DocRegistry, 'api' | 'examples'>> =
    options.registry ?? defaultRegistry;
  const pages = [...registry.pages];
  const defaultRouteId = pages[0]?.routeId ?? 'start/overview';
  const fallbackRepositoryUrl = 'https://github.com/sdcorejs/sdcorejs-utils';
  const repositoryUrl = safeExternalUrl(
    options.repositoryUrl ?? fallbackRepositoryUrl,
    fallbackRepositoryUrl,
  );
  let searchSources = createSearchSources(pages, registry.api ?? [], registry.examples ?? []);
  let searchCatalogPromise: Promise<void> | null = null;
  let destroyed = false;
  let renderSequence = 0;
  let currentRoute: ResolvedHashRoute | null = null;
  let currentPage: DocPage | null = null;
  let router: HashRouter;
  let searchDialog: SearchDialog | null = null;
  let searchOpen = false;

  let storage = options.storage;
  if (storage === undefined) {
    try {
      storage = browserWindow.localStorage;
    } catch {
      storage = null;
    }
  }
  const previousBodyOverflow = document.body.style.overflow;
  const localeController: LocaleController = createLocaleController({
    storage,
    languageTarget: document.documentElement,
  });

  function navigate(target: DocRouteTarget): void {
    const location = { routeId: target.routeId, anchor: target.anchor ?? null };
    const nextHash = formatHashRoute(location);
    const isCurrent = browserWindow.location.hash === nextHash;
    router.navigate(location);
    if (isCurrent) router.sync();
  }

  function updateScrollLock(): void {
    const locked = layout.isDrawerOpen || searchOpen;
    document.body.classList.toggle('is-scroll-locked', locked);
    document.body.style.overflow = locked ? 'hidden' : previousBodyOverflow;
  }

  function openSearchDialog(): void {
    layout.setDrawerOpen(false);
    searchDialog?.open();
    if (options.registry === undefined && searchCatalogPromise === null) {
      searchCatalogPromise = import('../content/catalog')
        .then(({ registry: fullRegistry }) => {
          if (destroyed) return;
          searchSources = createSearchSources(
            pages,
            fullRegistry.api,
            fullRegistry.examples,
          );
          searchDialog?.refresh();
        })
        .catch(() => {
          // Keep page/anchor search available and allow a later open to retry the chunk.
          searchCatalogPromise = null;
        });
    }
  }

  const layout = createDocsLayout({
    document,
    locale: localeController.locale,
    pages,
    defaultRouteId,
    version: options.version ?? '1.2.0',
    repositoryUrl,
    onNavigate: (routeId, anchor) => navigate({ routeId, anchor }),
    onLocaleChange: setLocale,
    onOpenSearch: openSearchDialog,
    onDrawerChange: updateScrollLock,
  });

  searchDialog = createSearchDialog({
    document,
    locale: localeController.locale,
    search: (query, locale) => searchDocumentation(searchSources, locale, query),
    onNavigate: (result) => navigate({ routeId: result.routeId, anchor: result.anchor }),
    onOpenChange: (open) => {
      searchOpen = open;
      layout.element.inert = open;
      updateScrollLock();
    },
  });

  root.replaceChildren(layout.element, searchDialog.element);

  function setDocumentTitle(title: string): void {
    document.title = `${title} — @sdcorejs/utils`;
  }

  function renderEmptyState(): void {
    currentPage = null;
    layout.update(localeController.locale, null);
    const copy = COPY[localeController.locale];
    const message = createMessage(document, copy.emptyTitle, copy.emptyBody, 'content-message empty-registry');
    layout.content.setAttribute('aria-busy', 'false');
    layout.content.replaceChildren(message.element);
    setDocumentTitle(copy.emptyTitle);
    focusContent(document, layout, null);
  }

  function renderNotFound(route: ResolvedHashRoute): void {
    currentPage = null;
    layout.update(localeController.locale, null);
    const copy = COPY[localeController.locale];
    const message = createMessage(document, copy.notFoundTitle, copy.notFoundBody, 'content-message not-found');
    const home = document.createElement('a');
    home.className = 'button-link';
    home.href = formatHashRoute({ routeId: defaultRouteId, anchor: null });
    home.textContent = copy.backHome;
    home.addEventListener('click', (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate({ routeId: defaultRouteId });
    });
    message.element.append(home);
    layout.content.setAttribute('aria-busy', 'false');
    layout.content.replaceChildren(message.element);
    setDocumentTitle(copy.notFoundTitle);
    focusContent(document, layout, route.anchor);
  }

  async function renderPage(page: DocPage, route: ResolvedHashRoute): Promise<void> {
    const sequence = ++renderSequence;
    currentPage = page;
    layout.update(localeController.locale, page);
    setDocumentTitle(page.title[localeController.locale]);
    const loading = document.createElement('div');
    loading.className = 'loading-state';
    loading.setAttribute('role', 'status');
    loading.setAttribute('aria-live', 'polite');
    const indicator = document.createElement('span');
    indicator.className = 'loading-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = COPY[localeController.locale].loading;
    loading.append(indicator, label);
    layout.content.setAttribute('aria-busy', 'true');
    layout.content.replaceChildren(loading);

    try {
      const content = await page.load();
      if (destroyed || sequence !== renderSequence) return;
      const rendered = content.render({
        locale: localeController.locale,
        navigate,
      });
      layout.content.replaceChildren(rendered);
      layout.content.setAttribute('aria-busy', 'false');
      focusContent(document, layout, route.anchor);
    } catch {
      if (destroyed || sequence !== renderSequence) return;
      const copy = COPY[localeController.locale];
      const message = createMessage(document, copy.errorTitle, copy.errorBody, 'content-message load-error');
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'button-primary';
      retry.textContent = copy.retry;
      retry.addEventListener('click', () => { void renderPage(page, route); });
      message.element.append(retry);
      layout.content.replaceChildren(message.element);
      layout.content.setAttribute('aria-busy', 'false');
      setDocumentTitle(copy.errorTitle);
      focusContent(document, layout, null);
    }
  }

  function renderRoute(route: ResolvedHashRoute): void {
    currentRoute = route;
    layout.setDrawerOpen(false);
    if (pages.length === 0) {
      renderSequence += 1;
      renderEmptyState();
      return;
    }
    if (route.kind === 'not-found') {
      renderSequence += 1;
      renderNotFound(route);
      return;
    }
    const page = registry.pagesByRoute.get(route.routeId);
    if (!page) {
      renderSequence += 1;
      renderNotFound({ ...route, kind: 'not-found' });
      return;
    }
    void renderPage(page, route);
  }

  router = createHashRouter({
    location: browserWindow.location,
    changes: browserWindow,
    routeIds: pages.map((page) => page.routeId),
    defaultRouteId,
    onRouteChange: renderRoute,
  });

  function setLocale(locale: Locale): void {
    const previous = localeController.locale;
    localeController.setLocale(locale);
    if (localeController.locale === previous) return;
    searchDialog?.setLocale(localeController.locale);
    layout.announcement.textContent = COPY[localeController.locale].localeAnnouncement;
    if (currentRoute) renderRoute(currentRoute);
    else layout.update(localeController.locale, currentPage);
  }

  function onGlobalKeyDown(event: KeyboardEvent): void {
    if (isSearchShortcut(event)) {
      event.preventDefault();
      openSearchDialog();
      return;
    }
    if (event.key === 'Escape' && layout.isDrawerOpen) {
      event.preventDefault();
      layout.setDrawerOpen(false);
      layout.drawerToggle.focus();
    }
  }

  document.addEventListener('keydown', onGlobalKeyDown);
  const stopRouter = router.start();

  return {
    get locale() { return localeController.locale; },
    navigate,
    setLocale,
    openSearch: openSearchDialog,
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      renderSequence += 1;
      stopRouter();
      document.removeEventListener('keydown', onGlobalKeyDown);
      layout.setDrawerOpen(false);
      searchDialog?.destroy();
      searchDialog = null;
      searchOpen = false;
      layout.element.inert = false;
      layout.destroy();
      updateScrollLock();
      root.replaceChildren();
    },
  };
}
