import type {
  ApiDeprecation,
  ApiEntry,
  ApiErrorReference,
  ApiKind,
  ApiMember,
  ApiProperty,
  Localized,
} from '../types';

export type PageId =
  | 'api-array'
  | 'api-browser'
  | 'api-color'
  | 'api-constants'
  | 'api-date'
  | 'api-errors'
  | 'api-filter'
  | 'api-models-types'
  | 'api-number'
  | 'api-object-utility-serialization'
  | 'api-string'
  | 'api-validation-async';

export type CanonicalImportPath =
  | '@sdcorejs/utils/constants'
  | '@sdcorejs/utils/errors'
  | '@sdcorejs/utils/fns'
  | '@sdcorejs/utils/models';

export interface ErrorSpec {
  readonly symbol: string;
  readonly en: string;
  readonly vi: string;
}

export interface ParameterSpec {
  readonly name: string;
  readonly type: string;
  readonly optional?: boolean;
  readonly defaultValue?: string;
  readonly en: string;
  readonly vi: string;
}

export interface PropertySpec extends ParameterSpec {
  readonly readonly?: boolean;
}

export interface SymbolSpec {
  readonly symbol: string;
  readonly kind: ApiKind;
  readonly pageId: PageId;
  readonly importPath: CanonicalImportPath;
  readonly signature: string;
  readonly en: string;
  readonly vi: string;
  readonly returnsEn?: string;
  readonly returnsVi?: string;
  readonly parameters?: readonly ParameterSpec[];
  readonly properties?: readonly PropertySpec[];
  readonly throws?: readonly ErrorSpec[];
  readonly runtimeEn?: readonly string[];
  readonly runtimeVi?: readonly string[];
  readonly securityEn?: readonly string[];
  readonly securityVi?: readonly string[];
  readonly exampleIds?: readonly string[];
  readonly deprecation?: ApiDeprecation;
  readonly aliases?: readonly string[];
}

export interface MemberSpec {
  readonly name: string;
  readonly signature: string;
  readonly en?: string;
  readonly vi?: string;
  readonly returnsEn?: string;
  readonly returnsVi?: string;
  readonly parameters?: readonly ParameterSpec[];
  readonly throws?: readonly ErrorSpec[];
  readonly runtimeEn?: readonly string[];
  readonly runtimeVi?: readonly string[];
  readonly securityEn?: readonly string[];
  readonly securityVi?: readonly string[];
  readonly exampleIds?: readonly string[];
  readonly deprecation?: ApiDeprecation;
}

export const localized = <T>(en: T, vi: T): Localized<T> => ({ en, vi });

export const slug = (value: string): string => value
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase();

const toErrorReference = (error: ErrorSpec): ApiErrorReference => ({
  symbol: error.symbol,
  when: localized(error.en, error.vi),
});

const toParameter = (parameter: ParameterSpec) => ({
  name: parameter.name,
  type: parameter.type,
  ...(parameter.optional ? { optional: true } : {}),
  ...(parameter.defaultValue === undefined ? {} : { defaultValue: parameter.defaultValue }),
  description: localized(parameter.en, parameter.vi),
});

const toProperty = (property: PropertySpec): ApiProperty => ({
  name: property.name,
  type: property.type,
  ...(property.optional ? { optional: true } : {}),
  ...(property.readonly ? { readonly: true } : {}),
  ...(property.defaultValue === undefined ? {} : { defaultValue: property.defaultValue }),
  description: localized(property.en, property.vi),
});

export const deprecated = (replacement: string | undefined, en: string, vi: string): ApiDeprecation => ({
  replacement,
  note: localized(en, vi),
});

export const errorSpec = (symbol: string, en: string, vi: string): ErrorSpec => ({ symbol, en, vi });

function defaultMemberExamples(namespace: string, member: string): readonly string[] {
  if (namespace === 'StringUtilities') {
    if (member === 'sha256') return ['canonical-hashing'];
    if (member === 'templateToDisplay' || member === 'parseExpression') return ['safe-objects'];
    return ['numbers-validation'];
  }
  if (namespace === 'ColorUtilities') return ['numbers-validation'];
  if (namespace === 'Utilities' && member === 'randomId') return ['numbers-validation'];
  return ['typed-errors'];
}

function defaultEntryExamples(spec: SymbolSpec): readonly string[] {
  if (spec.symbol === 'TemplatePathOptions') return ['safe-objects'];
  if (spec.symbol === 'ColorUtilities' || spec.symbol === 'randomId') return ['numbers-validation'];
  const byPage: Readonly<Record<PageId, readonly string[]>> = {
    'api-array': ['array-operations'],
    'api-browser': ['browser-workflows'],
    'api-color': ['numbers-validation'],
    'api-constants': ['numbers-validation'],
    'api-date': ['dates-dst'],
    'api-errors': ['typed-errors'],
    'api-filter': ['strict-filters'],
    'api-models-types': ['strict-filters'],
    'api-number': ['numbers-validation'],
    'api-object-utility-serialization': ['safe-objects'],
    'api-string': ['numbers-validation'],
    'api-validation-async': ['async-rxjs'],
  };
  return byPage[spec.pageId];
}

export function createMember(namespace: string, spec: MemberSpec): ApiMember {
  return {
    name: spec.name,
    anchor: `${slug(namespace)}-${slug(spec.name)}`,
    signature: spec.signature,
    summary: localized(
      spec.en ?? `Public ${namespace}.${spec.name} member.`,
      spec.vi ?? `Thành viên công khai ${namespace}.${spec.name}.`,
    ),
    parameters: (spec.parameters ?? []).map(toParameter),
    returns: localized(
      spec.returnsEn ?? 'The value described by the signature.',
      spec.returnsVi ?? 'Giá trị được mô tả trong chữ ký.',
    ),
    throws: (spec.throws ?? []).map(toErrorReference),
    runtimeNotes: localized(spec.runtimeEn ?? [], spec.runtimeVi ?? []),
    securityNotes: localized(spec.securityEn ?? [], spec.securityVi ?? []),
    exampleIds: spec.exampleIds && spec.exampleIds.length > 0
      ? spec.exampleIds
      : defaultMemberExamples(namespace, spec.name),
    ...(spec.deprecation ? { deprecation: spec.deprecation } : {}),
  };
}

export function createEntry(spec: SymbolSpec, members?: readonly ApiMember[]): ApiEntry {
  const structuredProperties = spec.properties
    ?? (spec.kind === 'interface' || spec.kind === 'model' ? spec.parameters : undefined);
  return {
    id: slug(spec.symbol),
    symbol: spec.symbol,
    kind: spec.kind,
    pageId: spec.pageId,
    anchor: slug(spec.symbol),
    importPath: spec.importPath,
    signature: spec.signature,
    summary: localized(spec.en, spec.vi),
    ...(structuredProperties ? { properties: structuredProperties.map(toProperty) } : {}),
    parameters: spec.kind === 'interface' || spec.kind === 'model'
      ? []
      : (spec.parameters ?? []).map(toParameter),
    returns: localized(
      spec.returnsEn ?? 'The value or type described by the signature.',
      spec.returnsVi ?? 'Giá trị hoặc kiểu được mô tả trong chữ ký.',
    ),
    throws: (spec.throws ?? []).map(toErrorReference),
    runtimeNotes: localized(spec.runtimeEn ?? [], spec.runtimeVi ?? []),
    securityNotes: localized(spec.securityEn ?? [], spec.securityVi ?? []),
    exampleIds: spec.exampleIds && spec.exampleIds.length > 0
      ? spec.exampleIds
      : defaultEntryExamples(spec),
    ...(members ? { members } : {}),
    ...(spec.deprecation ? { deprecation: spec.deprecation } : {}),
    ...(spec.aliases ? { aliases: spec.aliases } : {}),
  };
}

export const commonErrors = {
  circular: errorSpec('CircularReferenceError', 'The input graph contains an unsupported cycle.', 'Đồ thị đầu vào chứa chu trình không được hỗ trợ.'),
  date: errorSpec('DateParseError', 'Strict date parsing or date calculation fails.', 'Phân tích ngày nghiêm ngặt hoặc phép tính ngày thất bại.'),
  filter: errorSpec('FilterValidationError', 'The filter definition or option is invalid.', 'Định nghĩa bộ lọc hoặc tùy chọn không hợp lệ.'),
  pagingLimit: errorSpec('PagingLimitError', 'Pagination exceeds a configured or safe-integer limit.', 'Phân trang vượt giới hạn cấu hình hoặc số nguyên an toàn.'),
  pagingResponse: errorSpec('PagingResponseError', 'A page response is malformed, inconsistent, or non-progressing.', 'Phản hồi trang sai cấu trúc, không nhất quán hoặc không tiến triển.'),
  secureRandom: errorSpec('SecureRandomUnavailableError', 'Cryptographically secure randomness is unavailable.', 'Không có nguồn ngẫu nhiên mật mã an toàn.'),
  unsafeKey: errorSpec('UnsafeObjectKeyError', 'A prototype-sensitive object key is encountered.', 'Phát hiện khóa đối tượng nhạy cảm với prototype.'),
  unsafePath: errorSpec('UnsafePropertyPathError', 'A property path is malformed, too deep, or prototype-sensitive.', 'Đường dẫn thuộc tính sai, quá sâu hoặc nhạy cảm với prototype.'),
  unsupported: errorSpec('UnsupportedSerializationTypeError', 'The value is outside the documented serialization domain.', 'Giá trị nằm ngoài miền tuần tự hóa được tài liệu hóa.'),
  validation: errorSpec('ValidationError', 'A caller argument or option is invalid.', 'Đối số hoặc tùy chọn của bên gọi không hợp lệ.'),
  webCrypto: errorSpec('WebCryptoUnavailableError', 'The required Web Crypto API is unavailable.', 'Web Crypto API cần thiết không khả dụng.'),
} as const;
