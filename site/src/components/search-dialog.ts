import type { SearchResult } from '../app/search';
import type { Locale } from '../content/types';

export interface SearchDialogOptions {
  readonly document: Document;
  readonly locale: Locale;
  readonly search: (query: string, locale: Locale) => readonly SearchResult[];
  readonly onNavigate: (result: SearchResult) => void;
  readonly onOpenChange?: (open: boolean) => void;
}

export interface SearchDialog {
  readonly element: HTMLElement;
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly refresh: () => void;
  readonly setLocale: (locale: Locale) => void;
  readonly destroy: () => void;
}

const LABELS = {
  en: {
    close: 'Close search',
    empty: 'No results. Try a symbol, topic, or keyword.',
    hint: 'Use ↑ ↓ to move, Enter to open, Esc to close',
    idle: 'Search pages, API symbols, and examples.',
    label: 'Search documentation',
    placeholder: 'Search documentation…',
    results: 'Search results',
    kinds: { api: 'API', anchor: 'Section', example: 'Example', page: 'Page' },
  },
  vi: {
    close: 'Đóng tìm kiếm',
    empty: 'Không có kết quả. Hãy thử tên API, chủ đề hoặc từ khóa.',
    hint: 'Dùng ↑ ↓ để di chuyển, Enter để mở, Esc để đóng',
    idle: 'Tìm trang, ký hiệu API và ví dụ.',
    label: 'Tìm trong tài liệu',
    placeholder: 'Tìm trong tài liệu…',
    results: 'Kết quả tìm kiếm',
    kinds: { api: 'API', anchor: 'Mục', example: 'Ví dụ', page: 'Trang' },
  },
} as const;

export function createSearchDialog(options: SearchDialogOptions): SearchDialog {
  const doc = options.document;
  let locale = options.locale;
  let open = false;
  let selectedIndex = 0;
  let previousFocus: HTMLElement | null = null;
  let results: readonly SearchResult[] = [];

  const overlay = doc.createElement('div');
  overlay.className = 'search-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'docs-search-heading');
  const panel = doc.createElement('section');
  panel.className = 'search-dialog';
  const heading = doc.createElement('h2');
  heading.id = 'docs-search-heading';
  heading.className = 'sr-only';
  const form = doc.createElement('div');
  form.className = 'search-field';
  const input = doc.createElement('input');
  input.type = 'search';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-haspopup', 'listbox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', 'docs-search-results');
  input.setAttribute('aria-describedby', 'docs-search-hint');
  const closeButton = doc.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'search-close';
  closeButton.textContent = 'Esc';
  closeButton.addEventListener('click', () => closeDialog());
  form.append(input, closeButton);
  const resultsList = doc.createElement('div');
  resultsList.className = 'search-results';
  resultsList.id = 'docs-search-results';
  resultsList.setAttribute('role', 'listbox');
  const footer = doc.createElement('p');
  footer.className = 'search-footer';
  footer.id = 'docs-search-hint';
  panel.append(heading, form, resultsList, footer);
  overlay.append(panel);

  function labels() { return LABELS[locale]; }

  function selectResult(index: number): void {
    const buttons = Array.from(resultsList.querySelectorAll<HTMLButtonElement>('[data-search-result]'));
    if (buttons.length === 0) return;
    selectedIndex = (index + buttons.length) % buttons.length;
    buttons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === selectedIndex;
      button.setAttribute('aria-selected', String(selected));
      button.classList.toggle('is-selected', selected);
    });
    input.setAttribute('aria-activedescendant', buttons[selectedIndex].id);
  }

  function renderResults(): void {
    resultsList.replaceChildren();
    results = options.search(input.value, locale);
    selectedIndex = 0;
    if (!input.value.trim()) {
      const idle = doc.createElement('p');
      idle.className = 'search-empty';
      idle.textContent = labels().idle;
      resultsList.append(idle);
      input.removeAttribute('aria-activedescendant');
      return;
    }
    if (results.length === 0) {
      const empty = doc.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = labels().empty;
      resultsList.append(empty);
      input.removeAttribute('aria-activedescendant');
      return;
    }
    results.forEach((result, index) => {
      const button = doc.createElement('button');
      button.type = 'button';
      button.id = `docs-search-result-${index}`;
      button.dataset.searchResult = result.kind;
      button.setAttribute('role', 'option');
      button.tabIndex = -1;
      const top = doc.createElement('span');
      top.className = 'search-result-heading';
      const label = doc.createElement('strong');
      label.textContent = result.label;
      const kind = doc.createElement('span');
      kind.className = 'search-result-kind';
      kind.textContent = labels().kinds[result.kind];
      top.append(label, kind);
      const summary = doc.createElement('span');
      summary.className = 'search-result-summary';
      summary.textContent = result.summary;
      button.append(top, summary);
      button.addEventListener('mouseenter', () => selectResult(index));
      button.addEventListener('click', () => {
        options.onNavigate(result);
        closeDialog();
      });
      resultsList.append(button);
    });
    selectResult(0);
  }

  function applyLocale(): void {
    heading.textContent = labels().label;
    input.setAttribute('aria-label', labels().label);
    input.placeholder = labels().placeholder;
    closeButton.setAttribute('aria-label', labels().close);
    resultsList.setAttribute('aria-label', labels().results);
    footer.textContent = labels().hint;
    renderResults();
  }

  function openDialog(): void {
    if (open) return;
    open = true;
    previousFocus = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    overlay.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    options.onOpenChange?.(true);
    queueMicrotask(() => input.focus());
  }

  function closeDialog(restoreFocus = true): void {
    if (!open) return;
    open = false;
    overlay.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.value = '';
    renderResults();
    options.onOpenChange?.(false);
    if (restoreFocus) previousFocus?.focus();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
    } else if (event.key === 'ArrowDown' && doc.activeElement === input) {
      event.preventDefault();
      selectResult(selectedIndex + 1);
    } else if (event.key === 'ArrowUp' && doc.activeElement === input) {
      event.preventDefault();
      selectResult(selectedIndex - 1);
    } else if (event.key === 'Enter' && doc.activeElement === input && results[selectedIndex]) {
      event.preventDefault();
      options.onNavigate(results[selectedIndex]);
      closeDialog();
    } else if (event.key === 'Tab') {
      const focusable = [input, closeButton];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && doc.activeElement === first && last) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last && first) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  input.addEventListener('input', renderResults);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) closeDialog(); });
  doc.addEventListener('keydown', onKeyDown);
  applyLocale();

  return {
    element: overlay,
    get isOpen() { return open; },
    open: openDialog,
    close: closeDialog,
    refresh: renderResults,
    setLocale(nextLocale): void {
      locale = nextLocale;
      applyLocale();
    },
    destroy(): void {
      closeDialog(false);
      doc.removeEventListener('keydown', onKeyDown);
      overlay.remove();
    },
  };
}
