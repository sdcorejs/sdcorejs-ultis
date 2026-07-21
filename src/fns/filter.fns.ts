import { FilterValidationError } from '../errors';
import { resolveOwnPropertyPath } from '../internal/property-path';
import {
  DateRelative,
  Filter,
  FilterAndOr,
  FilterBetween,
  FilterFieldType,
  FilterHasData,
  FilterNoData,
  FilterTimestampUnit,
  MatchOptions,
  ValidatedFilter,
} from '../models/filter.model';
import { DateUtilities } from './date.fns';
import { Utilities } from './utility.fns';

const DEFAULT_MAX_FILTER_DEPTH = 32;
const HAS_DATA_OPERATORS = new Set([
  'EQUAL', 'NOT_EQUAL', 'CONTAIN', 'NOT_CONTAIN', 'IN', 'NOT_IN',
  'START_WITH', 'NOT_START_WITH', 'END_WITH', 'NOT_END_WITH',
  'GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL',
]);
const NO_DATA_OPERATORS = new Set(['NULL', 'NOT_NULL']);
const LOGICAL_OPERATORS = new Set(['AND', 'OR']);
const NUMERIC_STRING = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/** Options for normalizing a standalone date value to epoch milliseconds. */
export interface ToEpochOptions {
  /** Required for numeric timestamps unless the explicit legacy switch is enabled. */
  timestampUnit?: FilterTimestampUnit;
  /**
   * Re-enables the v1.x `< 1e12 = seconds` magnitude heuristic unchanged.
   * @deprecated Provide `timestampUnit` instead. Magnitude inference is ambiguous;
   * enabling it can reinterpret legitimate pre-2001 millisecond timestamps.
   */
  legacyTimestampInference?: boolean;
}

type DataRecord = Record<string, unknown>;
type NormalizedValue = string | number | boolean | null | undefined;
type NormalizedResult = { ok: true; value: NormalizedValue } | { ok: false };

const isRecord = (value: unknown): value is DataRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readOwnData = (source: DataRecord, key: string, required: boolean, context: string): unknown => {
  const descriptor = Object.getOwnPropertyDescriptor(source, key);
  if (!descriptor) {
    if (required) throw new FilterValidationError(`${context} requires an own ${key} property`);
    return undefined;
  }
  if (!('value' in descriptor)) throw new FilterValidationError(`${context}.${key} cannot be an accessor`);
  return descriptor.value;
};

const readDenseOwnDataArray = (source: unknown, context: string): unknown[] => {
  if (!Array.isArray(source)) throw new FilterValidationError(`${context} must be an array`);
  const values: unknown[] = [];
  for (let index = 0; index < source.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(source, String(index));
    if (!descriptor) throw new FilterValidationError(`${context} cannot contain sparse or inherited entries`);
    if (!('value' in descriptor)) throw new FilterValidationError(`${context}[${index}] cannot be an accessor`);
    values.push(descriptor.value);
  }
  for (const key of Reflect.ownKeys(source)) {
    if (key === 'length') continue;
    if (typeof key === 'string') {
      const index = Number(key);
      if (Number.isSafeInteger(index) && index >= 0 && index < source.length && String(index) === key) continue;
    }
    throw new FilterValidationError(`${context} cannot contain extra properties`);
  }
  return values;
};

const readOptionMap = <T>(source: unknown, key: string): T | undefined => {
  if (!isRecord(source)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(source, key);
  return descriptor && 'value' in descriptor ? descriptor.value as T : undefined;
};

const getFieldType = (field: string, options?: MatchOptions): FilterFieldType | undefined => {
  const type = readOptionMap<FilterFieldType>(options?.fieldTypes, field);
  if (type !== undefined && !['string', 'number', 'boolean', 'date'].includes(type)) {
    throw new FilterValidationError(`Unsupported field type for ${field}`);
  }
  return type;
};

const getTimestampUnit = (
  field: string,
  filterUnit: FilterTimestampUnit | undefined,
  options?: MatchOptions,
): FilterTimestampUnit | undefined => {
  const unit = filterUnit ?? readOptionMap<FilterTimestampUnit>(options?.timestampUnits, field) ?? options?.timestampUnit;
  if (unit !== undefined && unit !== 'seconds' && unit !== 'milliseconds') {
    throw new FilterValidationError(`Unsupported timestamp unit for ${field}`);
  }
  return unit;
};

const parseTemporalString = (value: string): number | null => {
  try {
    if (DateUtilities.isValidInstant(value)) return DateUtilities.parseInstant(value).getTime();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return DateUtilities.parseLocalDateStrict(value).getTime();
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(value)) return DateUtilities.parseLocalDateStrict(value, 'yyyy/MM/dd').getTime();
    if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(value)) {
      return DateUtilities.parseLocalDateStrict(value, value.includes('/') ? 'MM/dd/yyyy' : 'MM-dd-yyyy').getTime();
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
      return DateUtilities.parseLocalDateTimeStrict(value).getTime();
    }
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(value)) {
      const normalized = value.replace(' ', 'T');
      return DateUtilities.parseLocalDateTimeStrict(normalized, 'yyyy-MM-ddTHH:mm').getTime();
    }
  } catch {
    return null;
  }
  return null;
};

/** Converts a strict date representation to epoch milliseconds, or `null` when unresolved. */
export const toEpoch = (value: unknown, options: ToEpochOptions = {}): number | null => {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    const epoch = options.timestampUnit === 'seconds'
      ? value * 1000
      : options.timestampUnit === 'milliseconds'
        ? value
        : options.legacyTimestampInference
          ? (value < 1e12 ? value * 1000 : value)
          : null;
    if (epoch === null || !Number.isFinite(epoch) || !Number.isFinite(new Date(epoch).getTime())) return null;
    return epoch;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed !== value) return null;
  if (NUMERIC_STRING.test(trimmed)) return toEpoch(Number(trimmed), options);
  return parseTemporalString(trimmed);
};

const normalize = (
  value: unknown,
  type: FilterFieldType | undefined,
  epochOptions: ToEpochOptions,
): NormalizedResult => {
  if (value === null || value === undefined) return { ok: true, value };
  switch (type) {
    case 'date': {
      const epoch = toEpoch(value, epochOptions);
      return epoch === null ? { ok: false } : { ok: true, value: epoch };
    }
    case 'number': {
      if (typeof value === 'number') return Number.isFinite(value) ? { ok: true, value } : { ok: false };
      if (typeof value !== 'string' || value.trim() !== value || !NUMERIC_STRING.test(value)) return { ok: false };
      const number = Number(value);
      return Number.isFinite(number) ? { ok: true, value: number } : { ok: false };
    }
    case 'boolean':
      if (typeof value === 'boolean') return { ok: true, value };
      if (value === 'true') return { ok: true, value: true };
      if (value === 'false') return { ok: true, value: false };
      return { ok: false };
    case 'string':
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? { ok: true, value: String(value) }
        : { ok: false };
    default:
      if (value instanceof Date) {
        const epoch = toEpoch(value);
        return epoch === null ? { ok: false } : { ok: true, value: epoch };
      }
      if (typeof value === 'string') {
        const epoch = parseTemporalString(value);
        return epoch === null ? { ok: true, value } : { ok: true, value: epoch };
      }
      return typeof value === 'number'
        ? (Number.isFinite(value) ? { ok: true, value } : { ok: false })
        : typeof value === 'boolean'
          ? { ok: true, value }
          : { ok: false };
  }
};

const resolveType = (
  field: string,
  left: unknown,
  right: unknown,
  dataType: FilterHasData['dataType'],
  timestampUnit: FilterTimestampUnit | undefined,
  options?: MatchOptions,
): FilterFieldType | undefined => {
  const declared = getFieldType(field, options);
  if (declared) return declared;
  if (
    dataType === 'date-today' ||
    dataType === 'date-relative' ||
    timestampUnit !== undefined ||
    left instanceof Date ||
    right instanceof Date ||
    (typeof left === 'string' && parseTemporalString(left) !== null) ||
    (typeof right === 'string' && parseTemporalString(right) !== null)
  ) return 'date';
  if (typeof left === 'string') return 'string';
  if (typeof left === 'number') return 'number';
  if (typeof left === 'boolean') return 'boolean';
  return undefined;
};

const compareValues = (
  left: unknown,
  right: unknown,
  type: FilterFieldType | undefined,
  leftEpoch: ToEpochOptions,
  rightEpoch: ToEpochOptions,
): { valid: boolean; order: number | null; equal: boolean } => {
  const x = normalize(left, type, leftEpoch);
  const y = normalize(right, type, rightEpoch);
  if (!x.ok || !y.ok) return { valid: false, order: null, equal: false };
  if (x.value === null || x.value === undefined || y.value === null || y.value === undefined) {
    return { valid: true, order: null, equal: x.value === y.value };
  }
  if (typeof x.value !== typeof y.value) return { valid: true, order: null, equal: false };
  if (x.value < y.value) return { valid: true, order: -1, equal: false };
  if (x.value > y.value) return { valid: true, order: 1, equal: false };
  return { valid: true, order: 0, equal: true };
};

/** Builds a validated relative-date specification. */
export const relativeDate = (
  amount: number,
  direction: DateRelative['direction'],
  unit: DateRelative['unit'],
): DateRelative => {
  const result = { amount, direction, unit };
  if (!isDateRelative(result)) throw new FilterValidationError('Invalid relative-date specification');
  return result;
};

/** Strict type guard for positive safe-integer relative-date specifications. */
export const isDateRelative = (value: unknown): value is DateRelative => {
  if (!isRecord(value)) return false;
  const amount = readOptionMap<unknown>(value, 'amount');
  const direction = readOptionMap<unknown>(value, 'direction');
  const unit = readOptionMap<unknown>(value, 'unit');
  return typeof amount === 'number' &&
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    (direction === 'previous' || direction === 'next') &&
    (unit === 'hour' || unit === 'day' || unit === 'week' || unit === 'month');
};

/** Resolves a relative-date specification using an optional deterministic reference time. */
export const resolveRelativeDate = (relative: DateRelative, now: Date = new Date()): Date => {
  if (!isDateRelative(relative)) throw new FilterValidationError('Invalid relative-date specification');
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new FilterValidationError('Invalid relative-date reference time');
  const base = relative.unit === 'hour' ? new Date(now.getTime()) : DateUtilities.begin(now);
  if (!base) throw new FilterValidationError('Could not resolve relative-date reference time');
  const amount = (relative.direction === 'previous' ? -1 : 1) * relative.amount;
  const result = relative.unit === 'hour'
    ? DateUtilities.addHours(base, amount)
    : relative.unit === 'day'
      ? DateUtilities.addDays(base, amount)
      : relative.unit === 'week'
        ? DateUtilities.addDays(base, amount * 7)
        : DateUtilities.addMonths(base, amount);
  if (!result) throw new FilterValidationError('Could not resolve relative date');
  return result;
};

const validatePath = (path: unknown, options: MatchOptions | undefined, context: string): string => {
  if (typeof path !== 'string' || path.length === 0) throw new FilterValidationError(`${context} must be a non-empty path`);
  Utilities.getNestedValue({}, path, { maxDepth: options?.maxPathDepth });
  return path;
};

const validateTimestampUnit = (value: unknown, context: string): FilterTimestampUnit | undefined => {
  if (value === undefined) return undefined;
  if (value !== 'seconds' && value !== 'milliseconds') throw new FilterValidationError(`${context} has an invalid timestampUnit`);
  return value;
};

const cloneOperand = (value: unknown, context: string): string | number | boolean | Date | null | undefined => {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) throw new FilterValidationError(`${context} contains an invalid Date`);
    return new Date(value.getTime());
  }
  if (typeof value === 'number' && !Number.isFinite(value)) throw new FilterValidationError(`${context} must be finite`);
  if (value === null || value === undefined || ['string', 'number', 'boolean'].includes(typeof value)) return value as string | number | boolean | null | undefined;
  throw new FilterValidationError(`${context} contains an unsupported operand`);
};

const validateTypedOperand = (
  value: unknown,
  type: FilterFieldType,
  epochOptions: ToEpochOptions,
  context: string,
): void => {
  if (!normalize(value, type, epochOptions).ok) {
    throw new FilterValidationError(`${context} is invalid for field type ${type}`);
  }
};

const inferBetweenType = (field: string, from: unknown, to: unknown, options?: MatchOptions): FilterFieldType => {
  const declared = getFieldType(field, options);
  if (declared) {
    if (declared === 'boolean') throw new FilterValidationError('BETWEEN does not support boolean fields');
    return declared;
  }
  if (
    from === null ||
    from === undefined ||
    to === null ||
    to === undefined ||
    typeof from === 'boolean' ||
    typeof to === 'boolean'
  ) {
    throw new FilterValidationError('BETWEEN bounds must be ordered string, number, or date values');
  }
  const fromIsDate = from instanceof Date || (typeof from === 'string' && parseTemporalString(from) !== null);
  const toIsDate = to instanceof Date || (typeof to === 'string' && parseTemporalString(to) !== null);
  if (fromIsDate || toIsDate) return 'date';

  const fromIsNumber = typeof from === 'number' || (typeof from === 'string' && NUMERIC_STRING.test(from));
  const toIsNumber = typeof to === 'number' || (typeof to === 'string' && NUMERIC_STRING.test(to));
  if (fromIsNumber && toIsNumber) return 'number';
  if (typeof from === 'string' && typeof to === 'string') return 'string';
  throw new FilterValidationError('BETWEEN bounds are not mutually comparable');
};

const validateBetweenOrder = (
  field: string,
  from: unknown,
  to: unknown,
  unit: FilterTimestampUnit | undefined,
  options?: MatchOptions,
): void => {
  const type = inferBetweenType(field, from, to, options);
  const epochOptions = {
    timestampUnit: getTimestampUnit(field, unit, options),
    legacyTimestampInference: options?.legacyTimestampInference,
  };
  const comparison = compareValues(from, to, type, epochOptions, epochOptions);
  if (!comparison.valid) throw new FilterValidationError('BETWEEN bounds are invalid for the declared field type');
  if (comparison.order === null) throw new FilterValidationError('BETWEEN bounds are not mutually comparable');
  if (comparison.order > 0) throw new FilterValidationError('BETWEEN lower bound cannot exceed upper bound');
};

const validateNode = <T>(
  input: unknown,
  options: MatchOptions<T> | undefined,
  depth: number,
  maxDepth: number,
  active: WeakSet<object>,
): Filter<T> => {
  if (!isRecord(input)) throw new FilterValidationError('Filter must be a non-array object');
  if (depth > maxDepth) throw new FilterValidationError(`Filter exceeds maximum depth ${maxDepth}`);
  if (active.has(input)) throw new FilterValidationError('Cyclic filter graph detected');
  active.add(input);
  try {
    const operator = readOwnData(input, 'operator', true, 'filter');
    if (typeof operator !== 'string') throw new FilterValidationError('Filter operator must be a string');

    if (LOGICAL_OPERATORS.has(operator)) {
      if (Object.hasOwn(input, 'field')) throw new FilterValidationError('Logical filters cannot contain a field');
      const data = readOwnData(input, 'data', true, `filter ${operator}`);
      const children = readDenseOwnDataArray(data, `${operator} data`);
      const validatedChildren: Filter<T>[] = [];
      for (const child of children) {
        validatedChildren.push(validateNode<T>(child, options, depth + 1, maxDepth, active));
      }
      return {
        operator: operator as 'AND' | 'OR',
        data: validatedChildren,
      } as FilterAndOr<T>;
    }

    const field = validatePath(readOwnData(input, 'field', true, 'filter'), options as MatchOptions, 'filter.field');
    const timestampUnit = validateTimestampUnit(readOwnData(input, 'timestampUnit', false, 'filter'), 'filter');

    if (NO_DATA_OPERATORS.has(operator)) {
      return { field, operator } as FilterNoData<T>;
    }
    if (operator === 'BETWEEN') {
      const data = readOwnData(input, 'data', true, 'BETWEEN filter');
      if (!isRecord(data)) throw new FilterValidationError('BETWEEN data must be an object');
      const from = cloneOperand(readOwnData(data, 'from', true, 'BETWEEN data'), 'BETWEEN.from');
      const to = cloneOperand(readOwnData(data, 'to', true, 'BETWEEN data'), 'BETWEEN.to');
      validateBetweenOrder(field, from, to, timestampUnit, options as MatchOptions);
      return { field, operator: 'BETWEEN', data: { from, to }, ...(timestampUnit ? { timestampUnit } : {}) } as FilterBetween<T>;
    }
    if (!HAS_DATA_OPERATORS.has(operator)) throw new FilterValidationError(`Unsupported filter operator: ${operator}`);

    const dataType = readOwnData(input, 'dataType', false, 'filter');
    if (
      dataType !== undefined &&
      dataType !== 'absolute' &&
      dataType !== 'field' &&
      dataType !== 'date-today' &&
      dataType !== 'date-relative'
    ) {
      throw new FilterValidationError('Invalid filter dataType');
    }
    const data = readOwnData(input, 'data', true, `filter ${operator}`);
    const isMembershipOperator = operator === 'IN' || operator === 'NOT_IN';
    if (isMembershipOperator && (dataType === 'date-today' || dataType === 'date-relative')) {
      throw new FilterValidationError(`${operator} does not support scalar ${dataType} data`);
    }
    if (isMembershipOperator && dataType !== 'field' && !Array.isArray(data)) {
      throw new FilterValidationError(`${operator} data must be an array`);
    }
    let clonedData: unknown;
    if (dataType === 'field') {
      clonedData = validatePath(data, options as MatchOptions, 'filter.data');
    } else if (dataType === 'date-today') {
      if (data !== 'TODAY') throw new FilterValidationError('date-today data must be TODAY');
      clonedData = data;
    } else if (dataType === 'date-relative') {
      if (!isDateRelative(data)) throw new FilterValidationError('Invalid date-relative data');
      clonedData = { amount: data.amount, direction: data.direction, unit: data.unit };
    } else if (isMembershipOperator) {
      const members = readDenseOwnDataArray(data, `${operator} data`);
      const clonedMembers: Array<string | number | boolean | Date | null | undefined> = [];
      for (let index = 0; index < members.length; index++) {
        clonedMembers.push(cloneOperand(members[index], `${operator}[${index}]`));
      }
      clonedData = clonedMembers;
    } else {
      clonedData = cloneOperand(data, `${operator}.data`);
    }

    const declaredType = getFieldType(field, options as MatchOptions);
    const validationType = declaredType ?? (
      dataType === 'date-today' || dataType === 'date-relative' || timestampUnit !== undefined
        ? 'date'
        : undefined
    );
    if (validationType && dataType !== 'field' && dataType !== 'date-today' && dataType !== 'date-relative') {
      const epochOptions = {
        timestampUnit: getTimestampUnit(field, timestampUnit, options as MatchOptions),
        legacyTimestampInference: options?.legacyTimestampInference,
      };
      if (Array.isArray(clonedData)) {
        for (let index = 0; index < clonedData.length; index++) {
          validateTypedOperand(clonedData[index], validationType, epochOptions, `${operator}[${index}]`);
        }
      } else {
        validateTypedOperand(clonedData, validationType, epochOptions, `${operator}.data`);
      }
    }

    const result: DataRecord = { field, operator, data: clonedData };
    if (dataType !== undefined) result.dataType = dataType;
    if (timestampUnit !== undefined) result.timestampUnit = timestampUnit;
    return result as unknown as FilterHasData<T>;
  } finally {
    active.delete(input);
  }
};

/**
 * Validates and clones a filter definition before evaluation.
 * This is a data-selection helper, not an authorization boundary.
 */
export const validateFilter = <T = unknown>(filter: unknown, options?: MatchOptions<T>): ValidatedFilter<T> => {
  const configuredMaxDepth = options?.maxDepth;
  if (configuredMaxDepth !== undefined && (!Number.isSafeInteger(configuredMaxDepth) || configuredMaxDepth < 0)) {
    throw new FilterValidationError('maxDepth must be a non-negative safe integer');
  }
  const maxDepth = configuredMaxDepth ?? DEFAULT_MAX_FILTER_DEPTH;
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0) throw new FilterValidationError('maxDepth must be a non-negative safe integer');
  if (
    options?.maxPathDepth !== undefined &&
    (!Number.isSafeInteger(options.maxPathDepth) || options.maxPathDepth <= 0)
  ) {
    throw new FilterValidationError('maxPathDepth must be a positive safe integer');
  }
  if (options?.timestampUnit !== undefined && options.timestampUnit !== 'seconds' && options.timestampUnit !== 'milliseconds') {
    throw new FilterValidationError('timestampUnit must be seconds or milliseconds');
  }
  if (options?.legacyTimestampInference !== undefined && typeof options.legacyTimestampInference !== 'boolean') {
    throw new FilterValidationError('legacyTimestampInference must be a boolean');
  }
  if (
    options?.missingValuePolicy !== undefined &&
    options.missingValuePolicy !== 'nullish' &&
    options.missingValuePolicy !== 'distinct'
  ) {
    throw new FilterValidationError('missingValuePolicy must be nullish or distinct');
  }
  if (options?.now !== undefined && (!(options.now instanceof Date) || !Number.isFinite(options.now.getTime()))) {
    throw new FilterValidationError('now must be a valid Date');
  }
  return validateNode<T>(filter, options, 0, maxDepth, new WeakSet()) as ValidatedFilter<T>;
};

type ResolvedOperand = { found: boolean; value: unknown; field?: string };

const resolveDataDetailed = (filter: FilterHasData, entity: unknown, options?: MatchOptions): ResolvedOperand => {
  switch (filter.dataType) {
    case 'field': {
      const resolution = resolveOwnPropertyPath(entity, filter.data, { maxDepth: options?.maxPathDepth });
      return { ...resolution, field: filter.data };
    }
    case 'date-today': {
      const today = DateUtilities.begin(options?.now ?? new Date());
      return { found: today !== null, value: today };
    }
    case 'date-relative':
      return { found: true, value: resolveRelativeDate(filter.data, options?.now ?? new Date()) };
    default:
      return { found: true, value: filter.data };
  }
};

/** Resolves a filter operand using safe own-property traversal for field references. */
export const resolveData = (filter: FilterHasData, entity: unknown, options?: MatchOptions): unknown =>
  resolveDataDetailed(filter, entity, options).value;

const evaluateHasData = (filter: FilterHasData, entity: unknown, options?: MatchOptions): boolean => {
  const left = resolveOwnPropertyPath(entity, filter.field, { maxDepth: options?.maxPathDepth });
  if (!left.found) return false;
  const right = resolveDataDetailed(filter, entity, options);
  if (!right.found) return false;
  const leftEpoch = {
    timestampUnit: getTimestampUnit(filter.field, filter.timestampUnit, options),
    legacyTimestampInference: options?.legacyTimestampInference,
  };
  const rightEpoch = {
    timestampUnit: getTimestampUnit(right.field ?? filter.field, filter.timestampUnit, options),
    legacyTimestampInference: options?.legacyTimestampInference,
  };
  const type = resolveType(filter.field, left.value, right.value, filter.dataType, leftEpoch.timestampUnit, options);

  if (['CONTAIN', 'NOT_CONTAIN', 'START_WITH', 'NOT_START_WITH', 'END_WITH', 'NOT_END_WITH'].includes(filter.operator)) {
    if (left.value === null || left.value === undefined || right.value === null || right.value === undefined) return false;
    if (!['string', 'number', 'boolean'].includes(typeof left.value) || !['string', 'number', 'boolean'].includes(typeof right.value)) return false;
    const source = String(left.value).toLowerCase();
    const operand = String(right.value).toLowerCase();
    if (filter.operator === 'CONTAIN') return source.includes(operand);
    if (filter.operator === 'NOT_CONTAIN') return !source.includes(operand);
    if (filter.operator === 'START_WITH') return source.startsWith(operand);
    if (filter.operator === 'NOT_START_WITH') return !source.startsWith(operand);
    if (filter.operator === 'END_WITH') return source.endsWith(operand);
    return !source.endsWith(operand);
  }

  if (filter.operator === 'IN' || filter.operator === 'NOT_IN') {
    if (!Array.isArray(right.value)) return false;
    let members: unknown[];
    try {
      members = readDenseOwnDataArray(right.value, `${filter.operator} resolved data`);
    } catch {
      return false;
    }
    const normalizedLeft = normalize(left.value, type, leftEpoch);
    if (!normalizedLeft.ok) return false;
    let contains = false;
    for (const item of members) {
      const comparison = compareValues(left.value, item, type, leftEpoch, rightEpoch);
      if (!comparison.valid) return false;
      if (comparison.equal) contains = true;
    }
    return filter.operator === 'IN' ? contains : !contains;
  }

  const comparison = compareValues(left.value, right.value, type, leftEpoch, rightEpoch);
  if (!comparison.valid) return false;
  switch (filter.operator) {
    case 'EQUAL': return comparison.equal;
    case 'NOT_EQUAL': return !comparison.equal;
    case 'GREATER_THAN': return comparison.order !== null && comparison.order > 0;
    case 'LESS_THAN': return comparison.order !== null && comparison.order < 0;
    case 'GREATER_OR_EQUAL': return comparison.order !== null && comparison.order >= 0;
    case 'LESS_OR_EQUAL': return comparison.order !== null && comparison.order <= 0;
    default: return false;
  }
};

const evaluateBetween = (filter: FilterBetween, entity: unknown, options?: MatchOptions): boolean => {
  const resolution = resolveOwnPropertyPath(entity, filter.field, { maxDepth: options?.maxPathDepth });
  if (!resolution.found || resolution.value === null || resolution.value === undefined) return false;
  const type = inferBetweenType(filter.field, filter.data.from, filter.data.to, options);
  const epoch = {
    timestampUnit: getTimestampUnit(filter.field, filter.timestampUnit, options),
    legacyTimestampInference: options?.legacyTimestampInference,
  };
  const lower = compareValues(resolution.value, filter.data.from, type, epoch, epoch);
  const upper = compareValues(resolution.value, filter.data.to, type, epoch, epoch);
  return lower.valid && upper.valid && lower.order !== null && upper.order !== null && lower.order >= 0 && upper.order <= 0;
};

const evaluateNoData = (filter: FilterNoData, entity: unknown, options?: MatchOptions): boolean => {
  const resolution = resolveOwnPropertyPath(entity, filter.field, { maxDepth: options?.maxPathDepth });
  if (options?.missingValuePolicy === 'distinct') {
    if (!resolution.found) return false;
    return filter.operator === 'NULL' ? resolution.value === null : resolution.value !== null;
  }
  return filter.operator === 'NULL'
    ? !resolution.found || resolution.value === null || resolution.value === undefined
    : resolution.found && resolution.value !== null && resolution.value !== undefined;
};

const evaluateValidated = (filter: Filter, entity: unknown, options?: MatchOptions): boolean => {
  if (filter.operator === 'AND' || filter.operator === 'OR') {
    for (const child of filter.data) {
      const matches = evaluateValidated(child, entity, options);
      if (filter.operator === 'AND' && !matches) return false;
      if (filter.operator === 'OR' && matches) return true;
    }
    return filter.operator === 'AND';
  }
  if (filter.operator === 'BETWEEN') return evaluateBetween(filter, entity, options);
  if (filter.operator === 'NULL' || filter.operator === 'NOT_NULL') return evaluateNoData(filter, entity, options);
  return evaluateHasData(filter as FilterHasData, entity, options);
};

/** Validates and evaluates one filter against an item; invalid item values deterministically do not match. */
export const evaluateFilter = <T = unknown>(item: T, filter: unknown, options?: MatchOptions<T>): boolean =>
  evaluateValidated(validateFilter<T>(filter, options), item, options as MatchOptions);

/** Compatibility API retaining the historical `(filter, item, options)` argument order. */
export const evaluate = <T = unknown>(filter: Filter<T>, item: T, options?: MatchOptions<T>): boolean =>
  evaluateFilter(item, filter, options);

/** Evaluates a top-level implicit-AND list. Empty lists match all items. Not an authorization control. */
export const match = <T = unknown>(filters: Filter<T>[], item: T, options?: MatchOptions<T>): boolean => {
  if (filters === null || filters === undefined) return true;
  const entries = readDenseOwnDataArray(filters, 'filters');
  if (entries.length === 0) return true;
  for (const filter of entries) {
    if (!evaluateFilter(item, filter, options)) return false;
  }
  return true;
};

/** Validated client-side filtering helpers. Never use client filtering as an authorization boundary. */
export const FilterUtilities = {
  match,
  evaluate,
  /** Validates and evaluates one filter; invalid entity values are deterministic non-matches. */
  evaluateFilter,
  /** Validates and safely clones a filter definition before evaluation. */
  validateFilter,
  resolveData,
  resolveRelativeDate,
  /** Converts a date representation using an explicit timestamp unit by default. */
  toEpoch,
  relativeDate,
  isDateRelative,
};
