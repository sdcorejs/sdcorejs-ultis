import type {
  ApiEntry,
  DocPage,
  DocPageContent,
  DocPageModule,
  DocRegistry,
  ExampleEntry,
  Localized,
  RegistryData,
} from './types';

export interface RegistryIssue {
  readonly code:
    | 'duplicate-anchor'
    | 'duplicate-api-id'
    | 'duplicate-example-id'
    | 'duplicate-member-name'
    | 'duplicate-property-name'
    | 'duplicate-page-id'
    | 'duplicate-route'
    | 'duplicate-symbol'
    | 'missing-locale'
    | 'missing-example'
    | 'unknown-example'
    | 'unknown-page'
    | 'unknown-symbol';
  readonly path: string;
  readonly message: string;
}

export class RegistryValidationError extends Error {
  readonly issues: readonly RegistryIssue[];

  constructor(issues: readonly RegistryIssue[]) {
    super(`Invalid documentation registry (${issues.length} issue${issues.length === 1 ? '' : 's'}).`);
    this.name = 'RegistryValidationError';
    this.issues = issues;
  }
}

export function definePage<const T extends DocPage>(page: T): T {
  return page;
}

export function defineApiEntry<const T extends ApiEntry>(entry: T): T {
  return entry;
}

export function defineExample<const T extends ExampleEntry>(entry: T): T {
  return entry;
}

function isPageContent(value: unknown): value is DocPageContent {
  return typeof value === 'object'
    && value !== null
    && typeof (value as { render?: unknown }).render === 'function';
}

export function lazyPage(
  importer: () => Promise<DocPageContent | DocPageModule>,
): () => Promise<DocPageContent> {
  let cached: Promise<DocPageContent> | undefined;

  return () => {
    cached ??= importer().then((loaded) => {
      if (isPageContent(loaded)) return loaded;
      if (isPageContent(loaded.default)) return loaded.default;
      if (isPageContent(loaded.content)) return loaded.content;
      throw new TypeError('A lazy documentation page must export DocPageContent as default or content.');
    });
    return cached;
  };
}

function pushDuplicateIssues(
  items: readonly { readonly value: string; readonly path: string }[],
  code: RegistryIssue['code'],
  label: string,
  issues: RegistryIssue[],
): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.value)) {
      issues.push({
        code,
        path: item.path,
        message: `Duplicate ${label} "${item.value}".`,
      });
    }
    seen.add(item.value);
  }
}

function checkLocalized<T>(
  value: Localized<T> | unknown,
  path: string,
  issues: RegistryIssue[],
): void {
  if (!value || typeof value !== 'object') {
    issues.push({ code: 'missing-locale', path, message: `${path} must define en and vi.` });
    return;
  }

  for (const locale of ['en', 'vi'] as const) {
    if (!(locale in value) || (value as Record<string, unknown>)[locale] === undefined) {
      issues.push({
        code: 'missing-locale',
        path: `${path}.${locale}`,
        message: `${path} is missing locale "${locale}".`,
      });
    }
  }
}

export function validateRegistry(data: RegistryData): readonly RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const pageIds = new Set(data.pages.map((page) => page.id));
  const exampleIds = new Set(data.examples.map((example) => example.id));
  const symbols = new Set(data.api.map((entry) => entry.symbol));

  pushDuplicateIssues(
    data.pages.map((page, index) => ({ value: page.id, path: `pages[${index}].id` })),
    'duplicate-page-id',
    'page ID',
    issues,
  );
  pushDuplicateIssues(
    data.pages.map((page, index) => ({ value: page.routeId, path: `pages[${index}].routeId` })),
    'duplicate-route',
    'route ID',
    issues,
  );
  pushDuplicateIssues(
    data.api.map((entry, index) => ({ value: entry.id, path: `api[${index}].id` })),
    'duplicate-api-id',
    'API entry ID',
    issues,
  );
  pushDuplicateIssues(
    data.api.map((entry, index) => ({ value: entry.symbol, path: `api[${index}].symbol` })),
    'duplicate-symbol',
    'API symbol',
    issues,
  );
  pushDuplicateIssues(
    data.examples.map((example, index) => ({ value: example.id, path: `examples[${index}].id` })),
    'duplicate-example-id',
    'example ID',
    issues,
  );

  const anchorsByPage = new Map<string, { readonly value: string; readonly path: string }[]>();
  const addAnchor = (pageId: string, value: string, path: string): void => {
    const anchors = anchorsByPage.get(pageId) ?? [];
    anchors.push({ value, path });
    anchorsByPage.set(pageId, anchors);
  };

  data.pages.forEach((page, pageIndex) => {
    page.anchors?.forEach((anchor, anchorIndex) => {
      addAnchor(page.id, anchor.anchor, `pages[${pageIndex}].anchors[${anchorIndex}].anchor`);
    });
  });
  data.api.forEach((entry, apiIndex) => {
    addAnchor(entry.pageId, entry.anchor, `api[${apiIndex}].anchor`);
    entry.members?.forEach((member, memberIndex) => {
      addAnchor(entry.pageId, member.anchor, `api[${apiIndex}].members[${memberIndex}].anchor`);
    });
  });
  data.examples.forEach((example, exampleIndex) => {
    addAnchor(example.pageId, example.anchor, `examples[${exampleIndex}].anchor`);
  });
  anchorsByPage.forEach((anchors, pageId) => {
    pushDuplicateIssues(anchors, 'duplicate-anchor', `anchor on page "${pageId}"`, issues);
  });

  data.pages.forEach((page, pageIndex) => {
    checkLocalized(page.title, `pages[${pageIndex}].title`, issues);
    checkLocalized(page.summary, `pages[${pageIndex}].summary`, issues);
    checkLocalized(page.keywords, `pages[${pageIndex}].keywords`, issues);
    const anchors = page.anchors ?? [];
    anchors.forEach((anchor, anchorIndex) => {
      checkLocalized(anchor.title, `pages[${pageIndex}].anchors[${anchorIndex}].title`, issues);
      if (anchor.keywords) {
        checkLocalized(anchor.keywords, `pages[${pageIndex}].anchors[${anchorIndex}].keywords`, issues);
      }
    });
  });

  data.api.forEach((entry, apiIndex) => {
    if (!pageIds.has(entry.pageId)) {
      issues.push({
        code: 'unknown-page',
        path: `api[${apiIndex}].pageId`,
        message: `API symbol "${entry.symbol}" references unknown page "${entry.pageId}".`,
      });
    }
    checkLocalized(entry.summary, `api[${apiIndex}].summary`, issues);
    checkLocalized(entry.returns, `api[${apiIndex}].returns`, issues);
    checkLocalized(entry.runtimeNotes, `api[${apiIndex}].runtimeNotes`, issues);
    checkLocalized(entry.securityNotes, `api[${apiIndex}].securityNotes`, issues);
    const properties = entry.properties ?? [];
    pushDuplicateIssues(
      properties.map((property, propertyIndex) => ({
        value: property.name,
        path: `api[${apiIndex}].properties[${propertyIndex}].name`,
      })),
      'duplicate-property-name',
      `property name on API entry "${entry.id}"`,
      issues,
    );
    properties.forEach((property, propertyIndex) => {
      checkLocalized(
        property.description,
        `api[${apiIndex}].properties[${propertyIndex}].description`,
        issues,
      );
    });
    entry.parameters.forEach((parameter, parameterIndex) => {
      checkLocalized(
        parameter.description,
        `api[${apiIndex}].parameters[${parameterIndex}].description`,
        issues,
      );
    });
    entry.throws.forEach((error, errorIndex) => {
      checkLocalized(error.when, `api[${apiIndex}].throws[${errorIndex}].when`, issues);
      if (!symbols.has(error.symbol)) {
        issues.push({
          code: 'unknown-symbol',
          path: `api[${apiIndex}].throws[${errorIndex}].symbol`,
          message: `API symbol "${entry.symbol}" references unknown error "${error.symbol}".`,
        });
      }
    });
    if (entry.deprecation) {
      checkLocalized(entry.deprecation.note, `api[${apiIndex}].deprecation.note`, issues);
    }
    if (entry.exampleIds.length === 0) {
      issues.push({
        code: 'missing-example',
        path: `api[${apiIndex}].exampleIds`,
        message: `API symbol "${entry.symbol}" must reference at least one example.`,
      });
    }
    entry.exampleIds.forEach((exampleId, exampleIndex) => {
      if (!exampleIds.has(exampleId)) {
        issues.push({
          code: 'unknown-example',
          path: `api[${apiIndex}].exampleIds[${exampleIndex}]`,
          message: `API symbol "${entry.symbol}" references unknown example "${exampleId}".`,
        });
      }
    });
    const members = entry.members ?? [];
    pushDuplicateIssues(
      members.map((member, memberIndex) => ({
        value: member.name,
        path: `api[${apiIndex}].members[${memberIndex}].name`,
      })),
      'duplicate-member-name',
      `member name on API entry "${entry.id}"`,
      issues,
    );
    members.forEach((member, memberIndex) => {
      const memberPath = `api[${apiIndex}].members[${memberIndex}]`;
      checkLocalized(member.summary, `${memberPath}.summary`, issues);
      checkLocalized(member.returns, `${memberPath}.returns`, issues);
      checkLocalized(member.runtimeNotes, `${memberPath}.runtimeNotes`, issues);
      checkLocalized(member.securityNotes, `${memberPath}.securityNotes`, issues);
      member.parameters.forEach((parameter, parameterIndex) => {
        checkLocalized(
          parameter.description,
          `${memberPath}.parameters[${parameterIndex}].description`,
          issues,
        );
      });
      member.throws.forEach((error, errorIndex) => {
        checkLocalized(error.when, `${memberPath}.throws[${errorIndex}].when`, issues);
        if (!symbols.has(error.symbol)) {
          issues.push({
            code: 'unknown-symbol',
            path: `${memberPath}.throws[${errorIndex}].symbol`,
            message: `API member "${entry.symbol}.${member.name}" references unknown error "${error.symbol}".`,
          });
        }
      });
      if (member.deprecation) {
        checkLocalized(member.deprecation.note, `${memberPath}.deprecation.note`, issues);
      }
      if (member.exampleIds.length === 0) {
        issues.push({
          code: 'missing-example',
          path: `${memberPath}.exampleIds`,
          message: `API member "${entry.symbol}.${member.name}" must reference at least one example.`,
        });
      }
      member.exampleIds.forEach((exampleId, exampleIndex) => {
        if (!exampleIds.has(exampleId)) {
          issues.push({
            code: 'unknown-example',
            path: `${memberPath}.exampleIds[${exampleIndex}]`,
            message: `API member "${entry.symbol}.${member.name}" references unknown example "${exampleId}".`,
          });
        }
      });
    });
  });

  data.examples.forEach((example, exampleIndex) => {
    if (!pageIds.has(example.pageId)) {
      issues.push({
        code: 'unknown-page',
        path: `examples[${exampleIndex}].pageId`,
        message: `Example "${example.id}" references unknown page "${example.pageId}".`,
      });
    }
    checkLocalized(example.title, `examples[${exampleIndex}].title`, issues);
    checkLocalized(example.summary, `examples[${exampleIndex}].summary`, issues);
    example.relatedSymbols.forEach((symbol, symbolIndex) => {
      if (!symbols.has(symbol)) {
        issues.push({
          code: 'unknown-symbol',
          path: `examples[${exampleIndex}].relatedSymbols[${symbolIndex}]`,
          message: `Example "${example.id}" references unknown API symbol "${symbol}".`,
        });
      }
    });
  });

  return issues;
}

export function buildRegistry(data: RegistryData): DocRegistry {
  const pages = Object.freeze([...data.pages]);
  const api = Object.freeze([...data.api]);
  const examples = Object.freeze([...data.examples]);
  const normalized: RegistryData = { pages, api, examples };
  const issues = validateRegistry(normalized);
  if (issues.length > 0) throw new RegistryValidationError(issues);

  return Object.freeze({
    ...normalized,
    pagesById: new Map(pages.map((page) => [page.id, page])),
    pagesByRoute: new Map(pages.map((page) => [page.routeId, page])),
    apiBySymbol: new Map(api.map((entry) => [entry.symbol, entry])),
    examplesById: new Map(examples.map((example) => [example.id, example])),
  });
}
