export const LOCALES = ['en', 'vi'] as const;

export type Locale = (typeof LOCALES)[number];

export type Localized<T> = Readonly<Record<Locale, T>>;

export const DOC_GROUPS = ['start', 'guides', 'api', 'examples', 'resources'] as const;

export type DocGroupId = (typeof DOC_GROUPS)[number];

export interface DocRouteTarget {
  readonly routeId: string;
  readonly anchor?: string | null;
}

export interface DocRenderContext {
  readonly locale: Locale;
  readonly navigate: (target: DocRouteTarget) => void;
}

export interface DocAnchor {
  readonly anchor: string;
  readonly title: Localized<string>;
  readonly keywords?: Localized<readonly string[]>;
}

export interface DocPageContent {
  readonly render: (context: DocRenderContext) => HTMLElement | DocumentFragment;
}

export interface DocPageModule {
  readonly default?: DocPageContent;
  readonly content?: DocPageContent;
}

export type DocPageLoader = () => Promise<DocPageContent>;

export interface DocPage {
  readonly id: string;
  readonly routeId: string;
  readonly group: DocGroupId;
  readonly order?: number;
  readonly title: Localized<string>;
  readonly summary: Localized<string>;
  readonly keywords: Localized<readonly string[]>;
  readonly anchors?: readonly DocAnchor[];
  readonly load: DocPageLoader;
}

export const API_KINDS = [
  'constant',
  'error',
  'function',
  'interface',
  'model',
  'namespace',
  'type',
] as const;

export type ApiKind = (typeof API_KINDS)[number];

export interface ApiParameter {
  readonly name: string;
  readonly type: string;
  readonly optional?: boolean;
  readonly defaultValue?: string;
  readonly description: Localized<string>;
}

export interface ApiProperty {
  readonly name: string;
  readonly type: string;
  readonly optional?: boolean;
  readonly readonly?: boolean;
  readonly defaultValue?: string;
  readonly description: Localized<string>;
}

export interface ApiErrorReference {
  readonly symbol: string;
  readonly when: Localized<string>;
}

export interface ApiDeprecation {
  readonly replacement?: string;
  readonly note: Localized<string>;
}

export interface ApiMember {
  readonly name: string;
  readonly anchor: string;
  readonly signature: string;
  readonly summary: Localized<string>;
  readonly parameters: readonly ApiParameter[];
  readonly returns: Localized<string>;
  readonly throws: readonly ApiErrorReference[];
  readonly runtimeNotes: Localized<readonly string[]>;
  readonly securityNotes: Localized<readonly string[]>;
  readonly exampleIds: readonly string[];
  readonly deprecation?: ApiDeprecation;
}

export interface ApiEntry {
  readonly id: string;
  readonly symbol: string;
  readonly kind: ApiKind;
  readonly pageId: string;
  readonly anchor: string;
  readonly importPath: string;
  readonly signature: string;
  readonly summary: Localized<string>;
  readonly properties?: readonly ApiProperty[];
  readonly parameters: readonly ApiParameter[];
  readonly returns: Localized<string>;
  readonly throws: readonly ApiErrorReference[];
  readonly runtimeNotes: Localized<readonly string[]>;
  readonly securityNotes: Localized<readonly string[]>;
  readonly exampleIds: readonly string[];
  readonly members?: readonly ApiMember[];
  readonly deprecation?: ApiDeprecation;
  readonly aliases?: readonly string[];
}

export type ExampleLanguage = 'bash' | 'html' | 'json' | 'text' | 'ts';

export interface ExampleEntry {
  readonly id: string;
  readonly pageId: string;
  readonly anchor: string;
  readonly title: Localized<string>;
  readonly summary: Localized<string>;
  readonly language: ExampleLanguage;
  readonly loadSource: () => Promise<string>;
  readonly relatedSymbols: readonly string[];
}

export interface RegistryData {
  readonly pages: readonly DocPage[];
  readonly api: readonly ApiEntry[];
  readonly examples: readonly ExampleEntry[];
}

/** Lightweight registry surface used by the persistent shell before route data is loaded. */
export interface DocNavigationRegistry {
  readonly pages: readonly DocPage[];
  readonly pagesById: ReadonlyMap<string, DocPage>;
  readonly pagesByRoute: ReadonlyMap<string, DocPage>;
}

export interface DocRegistry extends RegistryData, DocNavigationRegistry {
  readonly apiBySymbol: ReadonlyMap<string, ApiEntry>;
  readonly examplesById: ReadonlyMap<string, ExampleEntry>;
}
