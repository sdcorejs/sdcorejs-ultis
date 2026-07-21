import { formatHashRoute } from '../../app/router';
import { renderCodeBlock } from '../../components/code-block';
import type {
  ApiEntry,
  ApiMember,
  ApiParameter,
  ApiProperty,
  DocPageContent,
  ExampleEntry,
  Locale,
  Localized,
} from '../types';
import { slug } from './shared';

export interface ApiPageDefinition {
  readonly pageId: string;
  readonly title: Localized<string>;
  readonly summary: Localized<string>;
  readonly entries: readonly ApiEntry[];
  readonly examples: readonly ExampleEntry[];
}

const COPY = {
  en: {
    aliases: 'Aliases',
    defaultValue: 'Default',
    deprecation: 'Deprecated',
    examples: 'Examples',
    import: 'Import',
    member: 'Member',
    name: 'Name',
    noParameters: 'No parameters.',
    overview: 'API overview',
    reference: 'API Reference',
    parameters: 'Parameters',
    properties: 'Properties',
    returns: 'Returns',
    runtime: 'Runtime behavior',
    security: 'Security boundary',
    signature: 'Signature',
    throws: 'Throws',
    type: 'Type',
  },
  vi: {
    aliases: 'Alias',
    defaultValue: 'Mặc định',
    deprecation: 'Đã deprecated',
    examples: 'Ví dụ',
    import: 'Import',
    member: 'Thành viên',
    name: 'Tên',
    noParameters: 'Không có tham số.',
    overview: 'Tổng quan API',
    reference: 'Tham chiếu API',
    parameters: 'Tham số',
    properties: 'Thuộc tính',
    returns: 'Giá trị trả về',
    runtime: 'Hành vi runtime',
    security: 'Ranh giới bảo mật',
    signature: 'Chữ ký',
    throws: 'Lỗi được ném',
    type: 'Kiểu',
  },
} as const;

function heading(level: 3 | 4, text: string): HTMLHeadingElement {
  const element = document.createElement(`h${level}`);
  element.textContent = text;
  return element;
}

function paragraph(text: string, className?: string): HTMLParagraphElement {
  const element = document.createElement('p');
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function list(items: readonly string[]): HTMLUListElement {
  const element = document.createElement('ul');
  for (const item of items) {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    element.appendChild(listItem);
  }
  return element;
}

function renderParameters(
  parameters: readonly ApiParameter[],
  locale: Locale,
  headingLevel: 3 | 4,
): HTMLElement {
  const copy = COPY[locale];
  const section = document.createElement('div');
  section.className = 'api-detail';
  section.appendChild(heading(headingLevel, copy.parameters));
  if (parameters.length === 0) {
    section.appendChild(paragraph(copy.noParameters, 'api-empty'));
    return section;
  }

  const region = document.createElement('div');
  region.className = 'content-table-scroll';
  region.tabIndex = 0;
  region.setAttribute('role', 'region');
  region.setAttribute('aria-label', copy.parameters);
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const row = document.createElement('tr');
  for (const label of [copy.name, copy.type, copy.defaultValue]) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    row.appendChild(cell);
  }
  head.appendChild(row);
  table.appendChild(head);
  const body = document.createElement('tbody');
  for (const parameter of parameters) {
    const parameterRow = document.createElement('tr');
    const name = document.createElement('td');
    const nameCode = document.createElement('code');
    nameCode.textContent = parameter.optional ? `${parameter.name}?` : parameter.name;
    const description = document.createElement('span');
    description.className = 'api-parameter-description';
    description.textContent = parameter.description[locale];
    name.append(nameCode, description);
    const type = document.createElement('td');
    const typeCode = document.createElement('code');
    typeCode.textContent = parameter.type;
    type.appendChild(typeCode);
    const defaultValue = document.createElement('td');
    defaultValue.textContent = parameter.defaultValue ?? '—';
    parameterRow.append(name, type, defaultValue);
    body.appendChild(parameterRow);
  }
  table.appendChild(body);
  region.appendChild(table);
  section.appendChild(region);
  return section;
}

function renderProperties(
  properties: readonly ApiProperty[],
  locale: Locale,
  headingLevel: 3 | 4,
): HTMLElement | null {
  if (properties.length === 0) return null;
  const copy = COPY[locale];
  const section = document.createElement('div');
  section.className = 'api-detail';
  section.appendChild(heading(headingLevel, copy.properties));
  const region = document.createElement('div');
  region.className = 'content-table-scroll';
  region.tabIndex = 0;
  region.setAttribute('role', 'region');
  region.setAttribute('aria-label', copy.properties);
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const row = document.createElement('tr');
  for (const label of [copy.name, copy.type, copy.defaultValue]) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    row.appendChild(cell);
  }
  head.appendChild(row);
  table.appendChild(head);
  const body = document.createElement('tbody');
  for (const property of properties) {
    const propertyRow = document.createElement('tr');
    const name = document.createElement('td');
    const nameCode = document.createElement('code');
    const propertyName = `${property.readonly ? 'readonly ' : ''}${property.name}${property.optional ? '?' : ''}`;
    nameCode.textContent = propertyName;
    const description = document.createElement('span');
    description.className = 'api-parameter-description';
    description.textContent = property.description[locale];
    name.append(nameCode, description);
    const type = document.createElement('td');
    const typeCode = document.createElement('code');
    typeCode.textContent = property.type;
    type.appendChild(typeCode);
    const defaultValue = document.createElement('td');
    defaultValue.textContent = property.defaultValue ?? '—';
    propertyRow.append(name, type, defaultValue);
    body.appendChild(propertyRow);
  }
  table.appendChild(body);
  region.appendChild(table);
  section.appendChild(region);
  return section;
}

function apiErrorLink(symbol: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = formatHashRoute({ routeId: 'api/errors', anchor: slug(symbol) });
  link.textContent = symbol;
  return link;
}

function renderThrows(
  errors: ApiEntry['throws'] | ApiMember['throws'],
  locale: Locale,
  headingLevel: 3 | 4,
): HTMLElement | null {
  if (errors.length === 0) return null;
  const section = document.createElement('div');
  section.className = 'api-detail';
  section.appendChild(heading(headingLevel, COPY[locale].throws));
  const errorList = document.createElement('ul');
  for (const error of errors) {
    const item = document.createElement('li');
    item.append(apiErrorLink(error.symbol), document.createTextNode(` — ${error.when[locale]}`));
    errorList.appendChild(item);
  }
  section.appendChild(errorList);
  return section;
}

function renderNotes(title: string, notes: readonly string[], headingLevel: 3 | 4): HTMLElement | null {
  if (notes.length === 0) return null;
  const section = document.createElement('div');
  section.className = 'api-detail';
  section.append(heading(headingLevel, title), list(notes));
  return section;
}

function renderDeprecation(
  deprecation: ApiEntry['deprecation'] | ApiMember['deprecation'],
  locale: Locale,
): HTMLElement | null {
  if (!deprecation) return null;
  const note = document.createElement('aside');
  note.className = 'content-callout content-callout--warning';
  note.setAttribute('role', 'note');
  const title = document.createElement('strong');
  title.textContent = COPY[locale].deprecation;
  note.append(title, document.createTextNode(` — ${deprecation.note[locale]}`));
  if (deprecation.replacement) {
    const replacement = document.createElement('code');
    replacement.textContent = deprecation.replacement;
    note.append(document.createTextNode(' '), replacement);
  }
  return note;
}

function renderExamples(
  ids: readonly string[],
  examplesById: ReadonlyMap<string, ExampleEntry>,
  exampleRoutes: ReadonlyMap<string, string>,
  locale: Locale,
  headingLevel: 3 | 4,
): HTMLElement | null {
  if (ids.length === 0) return null;
  const section = document.createElement('div');
  section.className = 'api-detail';
  section.appendChild(heading(headingLevel, COPY[locale].examples));
  const exampleList = document.createElement('ul');
  for (const id of ids) {
    const example = examplesById.get(id);
    if (!example) continue;
    const item = document.createElement('li');
    const link = document.createElement('a');
    const routeId = exampleRoutes.get(example.pageId);
    if (!routeId) continue;
    link.href = formatHashRoute({ routeId, anchor: example.anchor });
    link.textContent = example.title[locale];
    item.appendChild(link);
    exampleList.appendChild(item);
  }
  section.appendChild(exampleList);
  return exampleList.childElementCount > 0 ? section : null;
}

function renderMember(
  namespace: string,
  member: ApiMember,
  locale: Locale,
  examplesById: ReadonlyMap<string, ExampleEntry>,
  exampleRoutes: ReadonlyMap<string, string>,
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'api-member';
  section.setAttribute('aria-labelledby', member.anchor);
  const title = document.createElement('h3');
  title.id = member.anchor;
  title.tabIndex = -1;
  title.textContent = `${namespace}.${member.name}`;
  const kind = document.createElement('span');
  kind.className = 'api-kind';
  kind.textContent = COPY[locale].member;
  section.append(title, kind, paragraph(member.summary[locale]));
  const deprecation = renderDeprecation(member.deprecation, locale);
  if (deprecation) section.appendChild(deprecation);
  section.appendChild(renderCodeBlock(member.signature, {
    filename: COPY[locale].signature,
    language: 'ts',
    locale,
  }));
  section.appendChild(renderParameters(member.parameters, locale, 4));
  section.appendChild(heading(4, COPY[locale].returns));
  section.appendChild(paragraph(member.returns[locale]));
  const throws = renderThrows(member.throws, locale, 4);
  if (throws) section.appendChild(throws);
  const runtime = renderNotes(COPY[locale].runtime, member.runtimeNotes[locale], 4);
  if (runtime) section.appendChild(runtime);
  const security = renderNotes(COPY[locale].security, member.securityNotes[locale], 4);
  if (security) section.appendChild(security);
  const examples = renderExamples(member.exampleIds, examplesById, exampleRoutes, locale, 4);
  if (examples) section.appendChild(examples);
  return section;
}

export function createApiPageContent(
  definition: ApiPageDefinition,
  exampleRoutes: ReadonlyMap<string, string>,
): DocPageContent {
  return {
    render(context): HTMLElement {
      const locale = context.locale;
      const copy = COPY[locale];
      const examplesById = new Map(definition.examples.map(example => [example.id, example]));
      const article = document.createElement('article');
      article.className = 'doc-article api-page';
      const header = document.createElement('header');
      header.className = 'doc-article__header';
      const eyebrow = paragraph(copy.reference, 'doc-article__eyebrow');
      const title = document.createElement('h1');
      title.textContent = definition.title[locale];
      const summary = paragraph(definition.summary[locale], 'doc-article__summary');
      header.append(eyebrow, title, summary);
      article.appendChild(header);

      const overview = document.createElement('section');
      overview.className = 'doc-section api-overview';
      overview.setAttribute('aria-labelledby', 'api-overview');
      const overviewTitle = document.createElement('h2');
      overviewTitle.id = 'api-overview';
      overviewTitle.tabIndex = -1;
      overviewTitle.textContent = copy.overview;
      overview.append(
        overviewTitle,
        paragraph(locale === 'vi'
          ? `${definition.entries.length} public symbol được lập chỉ mục trên trang này. Dùng search để mở deep link của symbol hoặc namespace member.`
          : `${definition.entries.length} public symbols are indexed on this page. Use search to open a symbol or namespace-member deep link.`),
      );
      article.appendChild(overview);

      for (const entry of definition.entries) {
        const section = document.createElement('section');
        section.className = 'api-entry';
        section.setAttribute('aria-labelledby', entry.anchor);
        const entryTitle = document.createElement('h2');
        entryTitle.id = entry.anchor;
        entryTitle.tabIndex = -1;
        entryTitle.textContent = entry.symbol;
        const kind = document.createElement('span');
        kind.className = 'api-kind';
        kind.textContent = entry.kind;
        section.append(entryTitle, kind, paragraph(entry.summary[locale]));
        const deprecation = renderDeprecation(entry.deprecation, locale);
        if (deprecation) section.appendChild(deprecation);

        const importKeyword = entry.kind === 'interface' || entry.kind === 'type' ? 'import type' : 'import';
        section.appendChild(renderCodeBlock(
          `${importKeyword} { ${entry.symbol} } from '${entry.importPath}';`,
          { filename: copy.import, language: 'ts', locale },
        ));
        section.appendChild(renderCodeBlock(entry.signature, {
          filename: copy.signature,
          language: 'ts',
          locale,
        }));
        const properties = renderProperties(entry.properties ?? [], locale, 3);
        if (properties) section.appendChild(properties);
        section.appendChild(renderParameters(entry.parameters, locale, 3));
        section.appendChild(heading(3, copy.returns));
        section.appendChild(paragraph(entry.returns[locale]));

        const throws = renderThrows(entry.throws, locale, 3);
        if (throws) section.appendChild(throws);
        const runtime = renderNotes(copy.runtime, entry.runtimeNotes[locale], 3);
        if (runtime) section.appendChild(runtime);
        const security = renderNotes(copy.security, entry.securityNotes[locale], 3);
        if (security) section.appendChild(security);
        if (entry.aliases && entry.aliases.length > 0) {
          section.append(heading(3, copy.aliases), paragraph(entry.aliases.join(', ')));
        }
        const examples = renderExamples(entry.exampleIds, examplesById, exampleRoutes, locale, 3);
        if (examples) section.appendChild(examples);

        for (const member of entry.members ?? []) {
          section.appendChild(renderMember(entry.symbol, member, locale, examplesById, exampleRoutes));
        }
        article.appendChild(section);
      }

      return article;
    },
  };
}
