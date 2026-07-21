import type { ApiEntry } from './types';
import {
  CORE_API_ENTRIES,
  CORE_DOCUMENTED_SYMBOLS,
  CORE_IMPORT_PATHS,
} from './api/core-entries';
import {
  FUNCTION_A_API_ENTRIES,
  FUNCTION_A_DOCUMENTED_SYMBOLS,
  FUNCTION_A_IMPORT_PATHS,
  FUNCTION_A_NAMESPACE_MEMBERS,
} from './api/function-entries-a';
import {
  FUNCTION_B_API_ENTRIES,
  FUNCTION_B_DOCUMENTED_SYMBOLS,
  FUNCTION_B_IMPORT_PATHS,
  FUNCTION_B_NAMESPACE_MEMBERS,
} from './api/function-entries-b';

export const DOCUMENTED_PUBLIC_SYMBOLS = [
  ...CORE_DOCUMENTED_SYMBOLS,
  ...FUNCTION_A_DOCUMENTED_SYMBOLS,
  ...FUNCTION_B_DOCUMENTED_SYMBOLS,
] as const;

export const DOCUMENTED_NAMESPACE_MEMBERS = {
  ...FUNCTION_A_NAMESPACE_MEMBERS,
  ...FUNCTION_B_NAMESPACE_MEMBERS,
} as const;

export const DOCUMENTED_IMPORT_PATHS = {
  ...CORE_IMPORT_PATHS,
  ...FUNCTION_A_IMPORT_PATHS,
  ...FUNCTION_B_IMPORT_PATHS,
} as const;

/** Compiler-checked property inventories for structured exports that were previously incomplete. */
export const DOCUMENTED_STRUCTURED_PROPERTIES = {
  FilterHasDataAbsolute: ['field', 'operator', 'timestampUnit?', 'dataType?', 'data'],
  FilterHasDataField: ['field', 'operator', 'timestampUnit?', 'dataType', 'data'],
  FilterHasDataToday: ['field', 'operator', 'timestampUnit?', 'dataType', 'data'],
  FilterHasDataRelative: ['field', 'operator', 'timestampUnit?', 'dataType', 'data'],
  FilterBetween: ['field', 'operator', 'timestampUnit?', 'data'],
  FilterNoData: ['field', 'operator'],
  FilterAndOr: ['operator', 'data'],
  Order: ['field', 'direction'],
  PagingReq: ['filters?', 'fields?', 'pageSize?', 'pageNumber?', 'orders?'],
  SubscriptionLike: ['closed?', 'unsubscribe'],
  ObserverLike: ['next?', 'error?', 'complete?'],
  SubscribableLike: ['subscribe'],
  ParseFiniteNumberOptions: [
    'trim?',
    'allowHex?',
    'allowExponent?',
    'allowDecimal?',
    'allowLeadingPlus?',
    'allowBoolean?',
  ],
} as const;

export const DOCUMENTED_DEPRECATED_TYPES = [
  'DetectIncognitoOptions',
  'IncognitoDetectionResult',
] as const;

export const API_ENTRIES: readonly ApiEntry[] = Object.freeze([
  ...CORE_API_ENTRIES,
  ...FUNCTION_A_API_ENTRIES,
  ...FUNCTION_B_API_ENTRIES,
]);
