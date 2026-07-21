import { formatHashRoute } from '../app/router';
import { renderCodeBlock } from '../components/code-block';
import type {
  DocPageContent,
  DocRenderContext,
  DocRouteTarget,
  Locale,
  Localized,
} from './types';

export type Renderable = Node | string | number | null | undefined;

export interface DocSectionDefinition {
  readonly anchor: string;
  readonly title: Localized<string>;
  readonly render: (context: DocRenderContext) => readonly Renderable[];
}

export interface DocArticleDefinition {
  readonly eyebrow?: Localized<string>;
  readonly title: Localized<string>;
  readonly summary: Localized<string>;
  readonly sections: readonly DocSectionDefinition[];
}

export type CalloutKind = 'info' | 'security' | 'warning';

function append(parent: Node, children: readonly Renderable[]): void {
  for (const child of children) {
    if (child === null || child === undefined) continue;
    parent.appendChild(
      child instanceof Node ? child : document.createTextNode(String(child)),
    );
  }
}

export function localized<T>(locale: Locale, value: Localized<T>): T {
  return value[locale];
}

export function paragraph(...children: readonly Renderable[]): HTMLParagraphElement {
  const element = document.createElement('p');
  append(element, children);
  return element;
}

export function inlineCode(value: string): HTMLElement {
  const element = document.createElement('code');
  element.textContent = value;
  return element;
}

export function strong(...children: readonly Renderable[]): HTMLElement {
  const element = document.createElement('strong');
  append(element, children);
  return element;
}

export function subheading(title: string): HTMLHeadingElement {
  const element = document.createElement('h3');
  element.textContent = title;
  return element;
}

export function codeBlock(
  source: string,
  label: string,
  language = 'ts',
): HTMLElement {
  const locale = document.documentElement.lang === 'vi' ? 'vi' : 'en';
  const figure = renderCodeBlock(source, { filename: label, language, locale });
  figure.classList.add('content-code');
  return figure;
}

export function bulletList(
  items: readonly (readonly Renderable[])[],
): HTMLUListElement {
  const list = document.createElement('ul');
  for (const item of items) {
    const listItem = document.createElement('li');
    append(listItem, item);
    list.appendChild(listItem);
  }
  return list;
}

export function orderedList(
  items: readonly (readonly Renderable[])[],
): HTMLOListElement {
  const list = document.createElement('ol');
  for (const item of items) {
    const listItem = document.createElement('li');
    append(listItem, item);
    list.appendChild(listItem);
  }
  return list;
}

export function callout(
  kind: CalloutKind,
  title: string,
  ...children: readonly Renderable[]
): HTMLElement {
  const aside = document.createElement('aside');
  aside.className = `content-callout content-callout--${kind}`;
  aside.setAttribute('role', 'note');

  const heading = document.createElement('p');
  heading.className = 'content-callout__title';
  heading.textContent = title;
  aside.appendChild(heading);
  append(aside, children);
  return aside;
}

export function routeLink(
  context: DocRenderContext,
  label: string,
  target: DocRouteTarget,
): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = formatHashRoute({
    routeId: target.routeId,
    anchor: target.anchor ?? null,
  });
  link.textContent = label;
  link.addEventListener('click', (event) => {
    if (
      event.button !== 0
      || event.altKey
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
    ) return;
    event.preventDefault();
    context.navigate(target);
  });
  return link;
}

export function externalLink(label: string, href: string): HTMLAnchorElement {
  const parsed = new URL(href);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new TypeError('Documentation external links must use HTTP or HTTPS.');
  }

  const link = document.createElement('a');
  link.href = parsed.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = label;
  return link;
}

export function contentTable(
  captionText: string,
  headers: readonly string[],
  rows: readonly (readonly (readonly Renderable[])[])[],
): HTMLElement {
  const region = document.createElement('div');
  region.className = 'content-table-scroll';
  region.tabIndex = 0;
  region.setAttribute('role', 'region');
  region.setAttribute('aria-label', captionText);

  const table = document.createElement('table');
  const caption = document.createElement('caption');
  caption.textContent = captionText;
  table.appendChild(caption);

  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const header of headers) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = header;
    headRow.appendChild(cell);
  }
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement('tbody');
  for (const row of rows) {
    const tableRow = document.createElement('tr');
    for (const values of row) {
      const cell = document.createElement('td');
      append(cell, values);
      tableRow.appendChild(cell);
    }
    body.appendChild(tableRow);
  }
  table.appendChild(body);
  region.appendChild(table);
  return region;
}

export function createPageContent(definition: DocArticleDefinition): DocPageContent {
  return {
    render(context): HTMLElement {
      const article = document.createElement('article');
      article.className = 'doc-article';

      const header = document.createElement('header');
      header.className = 'doc-article__header';
      if (definition.eyebrow) {
        const eyebrow = document.createElement('p');
        eyebrow.className = 'doc-article__eyebrow';
        eyebrow.textContent = localized(context.locale, definition.eyebrow);
        header.appendChild(eyebrow);
      }

      const title = document.createElement('h1');
      title.textContent = localized(context.locale, definition.title);
      const summary = document.createElement('p');
      summary.className = 'doc-article__summary';
      summary.textContent = localized(context.locale, definition.summary);
      header.append(title, summary);
      article.appendChild(header);

      for (const sectionDefinition of definition.sections) {
        const section = document.createElement('section');
        section.className = 'doc-section';
        section.setAttribute('aria-labelledby', sectionDefinition.anchor);

        const heading = document.createElement('h2');
        heading.id = sectionDefinition.anchor;
        heading.tabIndex = -1;
        heading.textContent = localized(context.locale, sectionDefinition.title);
        section.appendChild(heading);
        append(section, sectionDefinition.render(context));
        article.appendChild(section);
      }

      return article;
    },
  };
}
