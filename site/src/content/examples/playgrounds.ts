import {
  createFilterPlayground,
  createUtilityPlayground,
  createValidationPlayground,
} from '../../components/playground';
import type { DocPageContent } from '../types';

const content: DocPageContent = {
  render(context): HTMLElement {
    const vi = context.locale === 'vi';
    const article = document.createElement('article');
    article.className = 'doc-article playgrounds-page';
    const header = document.createElement('header');
    header.className = 'doc-article__header';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'doc-article__eyebrow';
    eyebrow.textContent = vi ? 'Ví dụ' : 'Examples';
    const title = document.createElement('h1');
    title.textContent = vi ? 'Playground tương tác' : 'Interactive playgrounds';
    const summary = document.createElement('p');
    summary.className = 'doc-article__summary';
    summary.textContent = vi
      ? 'Thử API trên dữ liệu cục bộ. Kết quả playground không phải kiểm soát authorization hoặc xác minh nội dung tin cậy.'
      : 'Try APIs against local data. Playground results are not authorization controls or trusted-content verification.';
    header.append(eyebrow, title, summary);
    article.appendChild(header);

    const definitions = [
      {
        anchor: 'validation-playground',
        title: vi ? 'Playground validation' : 'Validation playground',
        render: () => createValidationPlayground(context.locale),
      },
      {
        anchor: 'filter-playground',
        title: vi ? 'Playground filter' : 'Filter playground',
        render: () => createFilterPlayground(context.locale),
      },
      {
        anchor: 'utility-playground',
        title: vi ? 'Playground tiện ích' : 'Utility playground',
        render: () => createUtilityPlayground(context.locale),
      },
    ] as const;

    for (const definition of definitions) {
      const section = document.createElement('section');
      section.className = 'doc-section playground-section';
      section.setAttribute('aria-labelledby', definition.anchor);
      const sectionTitle = document.createElement('h2');
      sectionTitle.id = definition.anchor;
      sectionTitle.tabIndex = -1;
      sectionTitle.textContent = definition.title;
      section.append(sectionTitle, definition.render());
      article.appendChild(section);
    }

    return article;
  },
};

export default content;
