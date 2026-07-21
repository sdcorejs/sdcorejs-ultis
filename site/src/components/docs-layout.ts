import { formatHashRoute } from '../app/router';
import { DOC_GROUPS, type DocGroupId, type DocPage, type Locale } from '../content/types';

export interface DocsLayoutOptions {
  readonly document: Document;
  readonly locale: Locale;
  readonly pages: readonly DocPage[];
  readonly defaultRouteId: string;
  readonly version: string;
  readonly repositoryUrl: string;
  readonly onNavigate: (routeId: string, anchor?: string | null) => void;
  readonly onLocaleChange: (locale: Locale) => void;
  readonly onOpenSearch: () => void;
  readonly onDrawerChange: (open: boolean) => void;
}

export interface DocsLayout {
  readonly element: HTMLElement;
  readonly main: HTMLElement;
  readonly content: HTMLElement;
  readonly announcement: HTMLElement;
  readonly drawerToggle: HTMLButtonElement;
  readonly isDrawerOpen: boolean;
  readonly setDrawerOpen: (open: boolean) => void;
  readonly update: (locale: Locale, activePage: DocPage | null) => void;
  readonly destroy: () => void;
}

const GROUP_LABELS: Readonly<Record<DocGroupId, Readonly<Record<Locale, string>>>> = {
  start: { en: 'Start', vi: 'Bắt đầu' },
  guides: { en: 'Guides', vi: 'Hướng dẫn' },
  api: { en: 'API Reference', vi: 'Tham chiếu API' },
  examples: { en: 'Examples', vi: 'Ví dụ' },
  resources: { en: 'Resources', vi: 'Tài nguyên' },
};

const LABELS = {
  en: {
    breadcrumb: 'Breadcrumb',
    drawerTitle: 'Documentation navigation',
    closeNavigation: 'Close navigation',
    documentation: 'Documentation',
    github: 'View source on GitHub',
    language: 'Language',
    navigation: 'Open navigation',
    next: 'Next',
    onThisPage: 'On this page',
    previous: 'Previous',
    search: 'Search documentation',
    searchHint: 'Press / or Ctrl K',
    skip: 'Skip to content',
  },
  vi: {
    breadcrumb: 'Đường dẫn trang',
    drawerTitle: 'Điều hướng tài liệu',
    closeNavigation: 'Đóng điều hướng',
    documentation: 'Tài liệu',
    github: 'Xem mã nguồn trên GitHub',
    language: 'Ngôn ngữ',
    navigation: 'Mở điều hướng',
    next: 'Tiếp theo',
    onThisPage: 'Trong trang này',
    previous: 'Trước',
    search: 'Tìm trong tài liệu',
    searchHint: 'Nhấn / hoặc Ctrl K',
    skip: 'Bỏ qua đến nội dung',
  },
} as const;

function sortPages(pages: readonly DocPage[]): readonly DocPage[] {
  return [...pages].sort((left, right) =>
    DOC_GROUPS.indexOf(left.group) - DOC_GROUPS.indexOf(right.group)
    || (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER)
    || left.routeId.localeCompare(right.routeId, 'en'));
}

function link(
  document: Document,
  label: string,
  routeId: string,
  onNavigate: DocsLayoutOptions['onNavigate'],
  anchor: string | null = null,
): HTMLAnchorElement {
  const result = document.createElement('a');
  result.href = formatHashRoute({ routeId, anchor });
  result.textContent = label;
  result.addEventListener('click', (event) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(routeId, anchor);
  });
  return result;
}

export function createDocsLayout(options: DocsLayoutOptions): DocsLayout {
  const doc = options.document;
  const pages = sortPages(options.pages);
  let locale = options.locale;
  let activePage: DocPage | null = null;
  let drawerOpen = false;
  let drawerFocusTimer: number | null = null;
  let drawerTransitionHandler: ((event: TransitionEvent) => void) | null = null;

  const wrapper = doc.createElement('div');
  wrapper.className = 'docs-site';

  const skip = doc.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#main-content';

  const header = doc.createElement('header');
  header.className = 'site-header';
  const headerInner = doc.createElement('div');
  headerInner.className = 'header-inner';

  const drawerToggle = doc.createElement('button');
  drawerToggle.type = 'button';
  drawerToggle.className = 'icon-button navigation-toggle';
  drawerToggle.dataset.action = 'toggle-navigation';
  drawerToggle.setAttribute('aria-controls', 'docs-navigation-panel');
  drawerToggle.setAttribute('aria-expanded', 'false');
  const drawerGlyph = doc.createElement('span');
  drawerGlyph.setAttribute('aria-hidden', 'true');
  drawerGlyph.textContent = '☰';
  drawerToggle.append(drawerGlyph);

  const brand = link(doc, '@sdcorejs/utils', options.defaultRouteId, options.onNavigate);
  brand.className = 'brand';
  const brandMark = doc.createElement('span');
  brandMark.className = 'brand-mark';
  brandMark.setAttribute('aria-hidden', 'true');
  brandMark.textContent = 'SD';
  const brandName = doc.createElement('span');
  brandName.className = 'brand-name';
  brandName.textContent = '@sdcorejs/utils';
  const version = doc.createElement('span');
  version.className = 'version-label';
  version.textContent = `v${options.version}`;
  brand.replaceChildren(brandMark, brandName, version);

  const headerActions = doc.createElement('div');
  headerActions.className = 'header-actions';
  const search = doc.createElement('button');
  search.type = 'button';
  search.className = 'search-trigger';
  search.dataset.action = 'open-search';
  search.addEventListener('click', options.onOpenSearch);
  const searchLabel = doc.createElement('span');
  searchLabel.className = 'search-trigger-label';
  const searchKeys = doc.createElement('kbd');
  searchKeys.textContent = '/';
  search.append(searchLabel, searchKeys);

  const language = doc.createElement('div');
  language.className = 'language-switch';
  const localeButtons = (['en', 'vi'] as const).map((candidate) => {
    const button = doc.createElement('button');
    button.type = 'button';
    button.dataset.locale = candidate;
    button.textContent = candidate === 'en' ? 'EN' : 'VI';
    button.addEventListener('click', () => options.onLocaleChange(candidate));
    language.append(button);
    return button;
  });

  const repository = doc.createElement('a');
  repository.className = 'repository-link';
  repository.href = options.repositoryUrl;
  repository.target = '_blank';
  repository.rel = 'noopener noreferrer';
  repository.textContent = 'GitHub ↗';

  headerActions.append(search, language, repository);
  headerInner.append(drawerToggle, brand, headerActions);
  header.append(headerInner);

  const frame = doc.createElement('div');
  frame.className = 'docs-frame';
  const scrim = doc.createElement('button');
  scrim.type = 'button';
  scrim.className = 'drawer-scrim';
  scrim.addEventListener('click', () => setDrawerOpen(false));

  const sidebar = doc.createElement('aside');
  sidebar.className = 'docs-sidebar';
  sidebar.id = 'docs-navigation-panel';
  sidebar.tabIndex = -1;
  const drawerToolbar = doc.createElement('div');
  drawerToolbar.className = 'drawer-toolbar';
  const drawerTitle = doc.createElement('strong');
  drawerTitle.id = 'docs-navigation-title';
  const drawerClose = doc.createElement('button');
  drawerClose.type = 'button';
  drawerClose.className = 'drawer-close';
  const drawerCloseGlyph = doc.createElement('span');
  drawerCloseGlyph.setAttribute('aria-hidden', 'true');
  drawerCloseGlyph.textContent = '×';
  drawerClose.append(drawerCloseGlyph);
  drawerToolbar.append(drawerTitle, drawerClose);
  const navigation = doc.createElement('nav');
  navigation.setAttribute('aria-label', 'Documentation');
  const navigationContent = doc.createElement('div');
  navigationContent.className = 'navigation-content';
  navigation.append(navigationContent);
  sidebar.append(drawerToolbar, navigation);

  const main = doc.createElement('main');
  main.className = 'docs-main';
  main.id = 'main-content';
  main.tabIndex = -1;
  skip.addEventListener('click', (event) => {
    event.preventDefault();
    main.focus({ preventScroll: true });
    if (typeof main.scrollIntoView === 'function') main.scrollIntoView({ block: 'start' });
  });
  const breadcrumbs = doc.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';
  const content = doc.createElement('div');
  content.className = 'docs-content';
  const pagination = doc.createElement('nav');
  pagination.className = 'page-pagination';
  main.append(breadcrumbs, content, pagination);

  const toc = doc.createElement('aside');
  toc.className = 'docs-toc';
  const tocContent = doc.createElement('nav');
  toc.append(tocContent);

  frame.append(scrim, sidebar, main, toc);
  const announcement = doc.createElement('div');
  announcement.className = 'sr-only';
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  wrapper.append(skip, header, frame, announcement);

  function setBackgroundInert(inert: boolean): void {
    header.inert = inert;
    main.inert = inert;
    toc.inert = inert;
  }

  function drawerFocusableElements(): readonly HTMLElement[] {
    return [
      drawerClose,
      ...Array.from(navigationContent.querySelectorAll<HTMLAnchorElement>('a[href]')),
    ].filter((element) => !element.hasAttribute('disabled'));
  }

  function scheduleDrawerFocus(): void {
    const view = doc.defaultView;
    if (!view) {
      queueMicrotask(() => { if (drawerOpen) drawerClose.focus(); });
      return;
    }
    const focusClose = (): void => {
      cancelDrawerFocus();
      if (drawerOpen) drawerClose.focus({ preventScroll: true });
    };
    drawerTransitionHandler = (event): void => {
      if (event.target === sidebar && event.propertyName === 'transform') focusClose();
    };
    sidebar.addEventListener('transitionend', drawerTransitionHandler);
    const reducedMotion = typeof view.matchMedia !== 'function'
      || view.matchMedia('(prefers-reduced-motion: reduce)').matches;
    drawerFocusTimer = view.setTimeout(focusClose, reducedMotion ? 0 : 220);
  }

  function cancelDrawerFocus(): void {
    if (drawerFocusTimer !== null) {
      doc.defaultView?.clearTimeout(drawerFocusTimer);
      drawerFocusTimer = null;
    }
    if (drawerTransitionHandler) {
      sidebar.removeEventListener('transitionend', drawerTransitionHandler);
      drawerTransitionHandler = null;
    }
  }

  function setDrawerOpen(open: boolean): void {
    if (drawerOpen === open) return;
    drawerOpen = open;
    wrapper.classList.toggle('is-navigation-open', open);
    drawerToggle.setAttribute('aria-expanded', String(open));
    drawerToggle.setAttribute(
      'aria-label',
      open ? LABELS[locale].closeNavigation : LABELS[locale].navigation,
    );
    if (open) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      sidebar.setAttribute('aria-labelledby', drawerTitle.id);
    } else {
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
      sidebar.removeAttribute('aria-labelledby');
    }
    setBackgroundInert(open);
    options.onDrawerChange(open);
    if (open) {
      scheduleDrawerFocus();
    } else {
      cancelDrawerFocus();
      drawerToggle.focus({ preventScroll: true });
    }
  }

  function onDrawerKeyDown(event: KeyboardEvent): void {
    if (!drawerOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setDrawerOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = drawerFocusableElements();
    const first = focusable[0] ?? sidebar;
    const last = focusable.at(-1) ?? sidebar;
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!sidebar.contains(doc.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  function renderNavigation(): void {
    navigationContent.replaceChildren();
    for (const group of DOC_GROUPS) {
      const section = doc.createElement('section');
      section.className = 'navigation-group';
      const heading = doc.createElement('h2');
      heading.textContent = GROUP_LABELS[group][locale];
      const list = doc.createElement('ul');
      for (const page of pages.filter((candidate) => candidate.group === group)) {
        const item = doc.createElement('li');
        const itemLink = link(doc, page.title[locale], page.routeId, (routeId, anchor) => {
          setDrawerOpen(false);
          options.onNavigate(routeId, anchor);
        });
        if (page.id === activePage?.id) itemLink.setAttribute('aria-current', 'page');
        item.append(itemLink);
        list.append(item);
      }
      section.append(heading, list);
      navigationContent.append(section);
    }
  }

  function renderBreadcrumbs(): void {
    breadcrumbs.replaceChildren();
    breadcrumbs.setAttribute('aria-label', LABELS[locale].breadcrumb);
    if (!activePage) return;
    const list = doc.createElement('ol');
    const homeItem = doc.createElement('li');
    homeItem.append(link(doc, LABELS[locale].documentation, options.defaultRouteId, options.onNavigate));
    const groupItem = doc.createElement('li');
    groupItem.textContent = GROUP_LABELS[activePage.group][locale];
    const pageItem = doc.createElement('li');
    pageItem.textContent = activePage.title[locale];
    pageItem.setAttribute('aria-current', 'page');
    list.append(homeItem, groupItem, pageItem);
    breadcrumbs.append(list);
  }

  function renderToc(): void {
    tocContent.replaceChildren();
    const anchors = activePage?.anchors ?? [];
    toc.hidden = anchors.length === 0;
    if (anchors.length === 0 || !activePage) return;
    tocContent.setAttribute('aria-label', LABELS[locale].onThisPage);
    const heading = doc.createElement('h2');
    heading.textContent = LABELS[locale].onThisPage;
    const list = doc.createElement('ul');
    for (const anchor of anchors) {
      const item = doc.createElement('li');
      item.append(link(doc, anchor.title[locale], activePage.routeId, options.onNavigate, anchor.anchor));
      list.append(item);
    }
    tocContent.append(heading, list);
  }

  function renderPagination(): void {
    pagination.replaceChildren();
    if (!activePage) return;
    pagination.setAttribute('aria-label', locale === 'en' ? 'Page navigation' : 'Điều hướng trang');
    const index = pages.findIndex((page) => page.id === activePage?.id);
    const previous = pages[index - 1];
    const next = pages[index + 1];
    if (previous) {
      const previousLink = link(doc, previous.title[locale], previous.routeId, options.onNavigate);
      previousLink.className = 'pagination-link pagination-previous';
      const eyebrow = doc.createElement('span');
      eyebrow.textContent = `← ${LABELS[locale].previous}`;
      const title = doc.createElement('strong');
      title.textContent = previous.title[locale];
      previousLink.replaceChildren(eyebrow, title);
      pagination.append(previousLink);
    }
    if (next) {
      const nextLink = link(doc, next.title[locale], next.routeId, options.onNavigate);
      nextLink.className = 'pagination-link pagination-next';
      const eyebrow = doc.createElement('span');
      eyebrow.textContent = `${LABELS[locale].next} →`;
      const title = doc.createElement('strong');
      title.textContent = next.title[locale];
      nextLink.replaceChildren(eyebrow, title);
      pagination.append(nextLink);
    }
  }

  function update(nextLocale: Locale, nextActivePage: DocPage | null): void {
    locale = nextLocale;
    activePage = nextActivePage;
    const labels = LABELS[locale];
    skip.textContent = labels.skip;
    drawerToggle.setAttribute('aria-label', drawerOpen ? labels.closeNavigation : labels.navigation);
    search.setAttribute('aria-label', labels.search);
    searchLabel.textContent = labels.search;
    search.title = labels.searchHint;
    language.setAttribute('role', 'group');
    language.setAttribute('aria-label', labels.language);
    localeButtons.forEach((button) => {
      const selected = button.dataset.locale === locale;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    repository.setAttribute('aria-label', labels.github);
    navigation.setAttribute('aria-label', labels.documentation);
    scrim.setAttribute('aria-label', labels.closeNavigation);
    drawerTitle.textContent = labels.drawerTitle;
    drawerClose.setAttribute('aria-label', labels.closeNavigation);
    renderNavigation();
    renderBreadcrumbs();
    renderToc();
    renderPagination();
  }

  drawerToggle.addEventListener('click', () => setDrawerOpen(!drawerOpen));
  drawerClose.addEventListener('click', () => setDrawerOpen(false));
  doc.addEventListener('keydown', onDrawerKeyDown);
  update(locale, activePage);

  return {
    element: wrapper,
    main,
    content,
    announcement,
    drawerToggle,
    get isDrawerOpen() { return drawerOpen; },
    setDrawerOpen,
    update,
    destroy(): void {
      cancelDrawerFocus();
      doc.removeEventListener('keydown', onDrawerKeyDown);
      if (drawerOpen) setDrawerOpen(false);
      setBackgroundInert(false);
    },
  };
}
