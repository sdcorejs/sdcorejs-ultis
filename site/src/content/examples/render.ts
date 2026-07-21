import { renderCodeBlock } from '../../components/code-block';
import type { DocPageContent, ExampleEntry, Localized } from '../types';

export interface ExamplePageDefinition {
  readonly pageId: string;
  readonly title: Localized<string>;
  readonly summary: Localized<string>;
  readonly entries: readonly ExampleEntry[];
}

const COPY = {
  en: {
    eyebrow: 'Examples',
    heading: 'Runnable examples',
    loading: 'Loading source…',
    failed: 'Source could not be loaded.',
    related: 'Related API',
  },
  vi: {
    eyebrow: 'Ví dụ',
    heading: 'Ví dụ có thể chạy',
    loading: 'Đang tải mã nguồn…',
    failed: 'Không thể tải mã nguồn.',
    related: 'API liên quan',
  },
} as const;

export function createExamplesPageContent(definition: ExamplePageDefinition): DocPageContent {
  return {
    render(context): HTMLElement {
      const copy = COPY[context.locale];
      const article = document.createElement('article');
      article.className = 'doc-article examples-page';

      const header = document.createElement('header');
      header.className = 'doc-article__header';
      const eyebrow = document.createElement('p');
      eyebrow.className = 'doc-article__eyebrow';
      eyebrow.textContent = copy.eyebrow;
      const title = document.createElement('h1');
      title.textContent = definition.title[context.locale];
      const summary = document.createElement('p');
      summary.className = 'doc-article__summary';
      summary.textContent = definition.summary[context.locale];
      header.append(eyebrow, title, summary);
      article.appendChild(header);

      const group = document.createElement('section');
      group.className = 'doc-section example-set';
      group.setAttribute('aria-labelledby', 'example-set');
      const groupTitle = document.createElement('h2');
      groupTitle.id = 'example-set';
      groupTitle.tabIndex = -1;
      groupTitle.textContent = copy.heading;
      group.appendChild(groupTitle);

      for (const entry of definition.entries) {
        const section = document.createElement('section');
        section.className = 'example-entry';
        section.setAttribute('aria-labelledby', entry.anchor);
        const entryTitle = document.createElement('h3');
        entryTitle.id = entry.anchor;
        entryTitle.tabIndex = -1;
        entryTitle.textContent = entry.title[context.locale];
        const entrySummary = document.createElement('p');
        entrySummary.textContent = entry.summary[context.locale];
        const related = document.createElement('p');
        related.className = 'example-related';
        related.textContent = `${copy.related}: ${entry.relatedSymbols.join(', ')}`;
        const source = document.createElement('div');
        source.className = 'example-source';
        source.setAttribute('aria-live', 'polite');
        const loading = document.createElement('p');
        loading.className = 'loading-state';
        loading.textContent = copy.loading;
        source.appendChild(loading);
        section.append(entryTitle, entrySummary, related, source);
        group.appendChild(section);

        void entry.loadSource().then((code) => {
          source.replaceChildren(renderCodeBlock(code, {
            filename: `${entry.id}.example.ts`,
            language: entry.language,
            locale: context.locale,
          }));
          source.removeAttribute('aria-live');
        }).catch(() => {
          const failure = document.createElement('p');
          failure.className = 'content-callout content-callout--warning';
          failure.textContent = copy.failed;
          source.replaceChildren(failure);
        });
      }

      article.appendChild(group);
      return article;
    },
  };
}
