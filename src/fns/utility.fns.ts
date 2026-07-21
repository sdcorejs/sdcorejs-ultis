import {
  PagingLimitError,
  PagingResponseError,
  SecureRandomUnavailableError,
  ValidationError,
} from '../errors';
import {
  PropertyPathOptions,
  getOwnPropertyPath,
} from '../internal/property-path';
import {
  assertSafeEnumerableOwnKeys,
  assertSafeObjectKey,
  createSafeRecord,
  defineSafeDataProperty,
} from '../internal/security';
import {
  canonicalStringify,
  hash,
  hash32,
  sha256Blob,
  sha256Canonical,
  stableStringify,
} from './serialization.fns';

export type { PropertyPathOptions } from '../internal/property-path';

export type PlainRecord = Record<string, unknown>;

/** Options for bounded clone and merge traversal. */
export interface ObjectTraversalOptions {
  /** Maximum nested object/array depth. Defaults to `1_000`. */
  maxDepth?: number;
}

const DEFAULT_OBJECT_MAX_DEPTH = 1_000;

const objectMaxDepth = (options: ObjectTraversalOptions): number => {
  const maxDepth = options.maxDepth ?? DEFAULT_OBJECT_MAX_DEPTH;
  if (!Number.isSafeInteger(maxDepth) || maxDepth <= 0) {
    throw new ValidationError('maxDepth must be a positive safe integer');
  }
  return maxDepth;
};

/** Options controlling bounded offset pagination. */
export interface FetchAllByPagingOptions {
  /** Hard cap protecting against non-terminating endpoints. Defaults to `10_000`. */
  maxPages?: number;
  /**
   * Optional cancellation signal raced against every request and passed to the
   * callback as its third argument.
   */
  signal?: AbortSignal;
  /** Policy when `total` changes after the first page. Defaults to `'error'`. */
  totalChangePolicy?: 'error' | 'latest';
}

const assertPositiveSafeInteger = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value) || value <= 0) throw new ValidationError(`${label} must be a positive safe integer`);
};

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw signal.reason ?? new ValidationError('Pagination was aborted');
};

const awaitPageWithAbort = <T>(request: PromiseLike<T>, signal?: AbortSignal): Promise<T> => {
  if (!signal) return Promise.resolve(request);
  if (signal.aborted) return Promise.reject(signal.reason ?? new ValidationError('Pagination was aborted'));

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const cleanup = (): void => signal.removeEventListener('abort', onAbort);
    const onAbort = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(signal.reason ?? new ValidationError('Pagination was aborted'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
      return;
    }
    void Promise.resolve(request).then(
      value => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      },
      error => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      },
    );
  });
};

/**
 * Exhausts a strictly zero-based paginated endpoint and returns all items in order.
 * Responses are validated on every page; later failures throw instead of discarding
 * already fetched data. Callback requests always start at page `0` and increment
 * consecutively. Duplicate item values remain lossless because a repeated payload is
 * not proof that an offset endpoint repeated the same logical page. Termination is
 * bounded by the declared total, empty-page checks, the safe page range, and `maxPages`.
 * When configured, the abort signal races each page promise and is passed to the
 * callback for transport cancellation.
 */
export const fetchAllByPaging = async <T = unknown>(
  func: (
    pageSize: number,
    pageNumber: number,
    signal?: AbortSignal,
  ) => Promise<{ items: T[]; total: number }>,
  defaultPageSize = 1000,
  options: FetchAllByPagingOptions = {},
): Promise<T[]> => {
  if (typeof func !== 'function') throw new ValidationError('func must be callable');
  assertPositiveSafeInteger(defaultPageSize, 'pageSize');
  const maxPages = options.maxPages ?? 10_000;
  assertPositiveSafeInteger(maxPages, 'maxPages');
  if (options.totalChangePolicy !== undefined &&
      options.totalChangePolicy !== 'error' &&
      options.totalChangePolicy !== 'latest') {
    throw new ValidationError("totalChangePolicy must be 'error' or 'latest'");
  }
  const totalChangePolicy = options.totalChangePolicy ?? 'error';
  let pageNumber = 0;

  const collected: T[] = [];
  let expectedTotal: number | undefined;
  for (let pagesFetched = 0; ; pagesFetched++, pageNumber++) {
    throwIfAborted(options.signal);
    if (pagesFetched >= maxPages) throw new PagingLimitError(`Pagination exceeded maxPages (${maxPages})`);
    if (!Number.isSafeInteger(pageNumber)) throw new PagingLimitError('Pagination exceeded the safe page-number range');
    const request = options.signal === undefined
      ? func(defaultPageSize, pageNumber)
      : func(defaultPageSize, pageNumber, options.signal);
    const response = await awaitPageWithAbort(request, options.signal);
    throwIfAborted(options.signal);
    if (!response || !Array.isArray(response.items)) {
      throw new PagingResponseError(`Page ${pageNumber} did not return an items array`);
    }
    if (!Number.isFinite(response.total) || response.total < 0 || !Number.isSafeInteger(response.total)) {
      throw new PagingResponseError(`Page ${pageNumber} returned an invalid total`);
    }
    if (response.items.length > defaultPageSize) {
      throw new PagingResponseError(`Page ${pageNumber} returned more than pageSize items`);
    }

    if (expectedTotal === undefined) expectedTotal = response.total;
    else if (response.total !== expectedTotal) {
      if (totalChangePolicy === 'error') {
        throw new PagingResponseError(`Page ${pageNumber} changed total from ${expectedTotal} to ${response.total}`);
      }
      expectedTotal = response.total;
    }

    const reachableTotal = expectedTotal;
    if (collected.length > reachableTotal) {
      throw new PagingResponseError(`Page ${pageNumber} changed total below the number of collected items`);
    }
    if (reachableTotal === 0) {
      if (response.items.length > 0) throw new PagingResponseError(`Page ${pageNumber} returned items beyond total ${expectedTotal}`);
      return collected;
    }
    if (response.items.length === 0) {
      if (collected.length === reachableTotal) return collected;
      throw new PagingResponseError(`Page ${pageNumber} made no progress before reaching total ${reachableTotal}`);
    }

    if (collected.length + response.items.length > reachableTotal) {
      throw new PagingResponseError(`Page ${pageNumber} returned more items than total ${expectedTotal} permits`);
    }
    for (const item of response.items) collected.push(item);
    if (collected.length === reachableTotal) return collected;
  }
};

/** Generates a short time/random identifier; it is neither a UUID nor cryptographically secure. */
export const randomId = (prefix?: string | null): string => {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
  return prefix ? `${prefix}_${id}` : id;
};

/** Parses a query string into an own-property record and rejects prototype-sensitive keys. */
export const parseQueryParams = (queryString?: string): Record<string, string> => {
  const params = new URLSearchParams(queryString || '');
  const result: Record<string, string> = {};
  params.forEach((value, key) => defineSafeDataProperty(result, key, value));
  return result;
};

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Generates a lowercase RFC 4122/9562-compatible UUID v4 or throws when secure randomness is unavailable. */
export const generateUuid = (): string => {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi) throw new SecureRandomUnavailableError();
  if (typeof cryptoApi.randomUUID === 'function') {
    try {
      const uuid = cryptoApi.randomUUID().toLowerCase();
      if (UUID_V4_PATTERN.test(uuid)) return uuid;
    } catch {
      // A working getRandomValues implementation remains a secure fallback.
    }
  }
  if (typeof cryptoApi.getRandomValues !== 'function') throw new SecureRandomUnavailableError();
  const bytes = new Uint8Array(16);
  try {
    cryptoApi.getRandomValues(bytes);
  } catch (cause) {
    throw new SecureRandomUnavailableError({ cause });
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/** Safely reads a dot/bracket path through own data properties only. Getters are skipped by default. */
export const getNestedValue = <T = unknown>(
  obj: unknown,
  path: string,
  options: PropertyPathOptions = {},
): T | undefined => getOwnPropertyPath<T>(obj, path, options);

/** Checks whether a value is a plain object literal or a null-prototype record. */
export const isPlainObject = (value: unknown): value is PlainRecord => {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isClassInstance = (value: object): boolean => {
  const prototype = Object.getPrototypeOf(value);
  if (prototype === null || prototype === Object.prototype) return false;
  const constructorDescriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor');
  return constructorDescriptor !== undefined &&
    !constructorDescriptor.enumerable &&
    'value' in constructorDescriptor &&
    typeof constructorDescriptor.value === 'function' &&
    constructorDescriptor.value.prototype === prototype;
};

/**
 * Includes custom-prototype record-like objects so they are sanitized into safe
 * own-property records rather than escaping with an attacker-controlled prototype.
 * Genuine class instances remain compatibility leaves.
 */
const isCopyableRecord = (value: unknown): value is PlainRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !isClassInstance(value);

type ExternalCloneResolver = (value: object) => object | undefined;

const cloneValue = <T>(
  value: T,
  seen: WeakMap<object, unknown>,
  externalClone?: ExternalCloneResolver,
  depth = 0,
  maxDepth = DEFAULT_OBJECT_MAX_DEPTH,
): T => {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return value;
  if (depth > maxDepth) throw new ValidationError(`Object traversal exceeded maxDepth (${maxDepth})`);
  const external = externalClone?.(value as object);
  if (external !== undefined) return external as T;
  if (seen.has(value as object)) return seen.get(value as object) as T;

  if (Array.isArray(value)) {
    assertSafeEnumerableOwnKeys(value);
    const output = new Array(value.length) as unknown[];
    seen.set(value, output);
    for (let index = 0; index < value.length; index++) {
      if (!Object.hasOwn(value, index)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !('value' in descriptor)) throw new ValidationError(`Accessor array element rejected at index ${index}`);
      Object.defineProperty(output, index, {
        configurable: true,
        enumerable: true,
        value: cloneValue(descriptor.value, seen, externalClone, depth + 1, maxDepth),
        writable: true,
      });
    }
    return output as T;
  }

  if (!isCopyableRecord(value)) return value;
  const prototype = Object.getPrototypeOf(value) === null ? null : Object.prototype;
  const output = createSafeRecord(prototype);
  seen.set(value, output);
  for (const key of Object.keys(value)) {
    assertSafeObjectKey(key);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor)) throw new ValidationError(`Accessor property rejected: ${key}`);
    defineSafeDataProperty(output, key, cloneValue(descriptor.value, seen, externalClone, depth + 1, maxDepth));
  }
  return output as T;
};

/**
 * Deeply clones arrays and record-like objects while preserving cycles and null prototypes.
 * Sparse-array holes are preserved. Date, Map, Set, class instances, functions, and
 * other non-plain leaves retain their original reference for v1.x compatibility.
 * Custom-prototype records are sanitized to ordinary own-property records. Excessive
 * acyclic depth throws a typed validation error instead of overflowing the stack.
 */
export const clone = <T>(value: T, options: ObjectTraversalOptions = {}): T =>
  cloneValue(value, new WeakMap(), undefined, 0, objectMaxDepth(options));

interface MergeContext {
  defaultCloneSeen: WeakMap<object, unknown>;
  overrideCloneSeen: WeakMap<object, unknown>;
  pairSeen: WeakMap<object, WeakMap<object, PlainRecord>>;
  activeDefault: WeakMap<object, PlainRecord>;
  activeOverride: WeakMap<object, PlainRecord>;
  maxDepth: number;
}

const cloneForMerge = <T>(
  value: T,
  context: MergeContext,
  source: 'default' | 'override',
  depth: number,
): T => {
  const seen = source === 'default' ? context.defaultCloneSeen : context.overrideCloneSeen;
  const active = source === 'default' ? context.activeDefault : context.activeOverride;
  return cloneValue(value, seen, object => active.get(object), depth, context.maxDepth);
};

const rememberActive = (
  map: WeakMap<object, PlainRecord>,
  source: object,
  output: PlainRecord,
): (() => void) => {
  const hadPrior = map.has(source);
  const prior = map.get(source);
  map.set(source, output);
  return () => {
    if (hadPrior && prior !== undefined) map.set(source, prior);
    else map.delete(source);
  };
};

const mergeValue = <T>(
  defaultValue: T,
  overrideValue: T | undefined,
  context: MergeContext,
  depth: number,
): T => {
  if (depth > context.maxDepth) throw new ValidationError(`Object traversal exceeded maxDepth (${context.maxDepth})`);
  if (overrideValue === undefined) return cloneForMerge(defaultValue, context, 'default', depth);
  if (isCopyableRecord(defaultValue) && isCopyableRecord(overrideValue)) {
    const priorForDefault = context.pairSeen.get(defaultValue);
    const priorPair = priorForDefault?.get(overrideValue);
    if (priorPair !== undefined) return priorPair as T;

    const output = createSafeRecord(Object.getPrototypeOf(defaultValue) === null ? null : Object.prototype);
    const pairs = priorForDefault ?? new WeakMap<object, PlainRecord>();
    if (priorForDefault === undefined) context.pairSeen.set(defaultValue, pairs);
    pairs.set(overrideValue, output);
    const restoreDefault = rememberActive(context.activeDefault, defaultValue, output);
    const restoreOverride = rememberActive(context.activeOverride, overrideValue, output);
    try {
      const keys = new Set([...Object.keys(defaultValue), ...Object.keys(overrideValue)]);
      for (const key of keys) {
        assertSafeObjectKey(key);
        const defaultDescriptor = Object.getOwnPropertyDescriptor(defaultValue, key);
        const overrideDescriptor = Object.getOwnPropertyDescriptor(overrideValue, key);
        if (defaultDescriptor && !('value' in defaultDescriptor)) throw new ValidationError(`Accessor property rejected: ${key}`);
        if (overrideDescriptor && !('value' in overrideDescriptor)) throw new ValidationError(`Accessor property rejected: ${key}`);
        defineSafeDataProperty(
          output,
          key,
          mergeValue(defaultDescriptor?.value, overrideDescriptor?.value, context, depth + 1),
        );
      }
    } finally {
      restoreOverride();
      restoreDefault();
    }
    return output as T;
  }
  return cloneForMerge(overrideValue, context, 'override', depth);
};

/**
 * Deeply merges plain records. Arrays replace and clone; `undefined` inherits the
 * default; `null` overrides. Date, Map, Set, and class instances are non-plain
 * leaves and retain the selected reference. Cyclic plain graphs are preserved.
 */
export const merge = <T>(
  defaultValue: T,
  overrideValue: T | undefined,
  options: ObjectTraversalOptions = {},
): T =>
  mergeValue(defaultValue, overrideValue, {
    defaultCloneSeen: new WeakMap(),
    overrideCloneSeen: new WeakMap(),
    pairSeen: new WeakMap(),
    activeDefault: new WeakMap(),
    activeOverride: new WeakMap(),
    maxDepth: objectMaxDepth(options),
  }, 0);

/** Folds partial records from left to right using {@link merge}. */
export const deepMerge = <T>(...sources: Partial<T>[]): T =>
  sources.reduce<PlainRecord>((accumulator, source) => merge(accumulator, source as PlainRecord), {}) as T;

/** Object-focused deterministic serialization, hashing, traversal, cloning, and merge helpers. */
export const ObjectUtilities = {
  stableStringify,
  /** Encodes supported extended JavaScript values with deterministic, collision-safe tags. */
  canonicalStringify,
  /**
   * Retains the legacy collision-prone 32-bit hash for supported simple values.
   * @deprecated Use `hash32` for accurate non-cryptographic naming or
   * `sha256Canonical` for cryptographic canonical hashing. Unsupported values now throw.
   */
  hash,
  /** Returns a fast, collision-prone, non-cryptographic compatibility hash. */
  hash32,
  /** Returns the lowercase hexadecimal SHA-256 of a canonical value encoding. */
  sha256Canonical,
  /** Hashes actual Blob/File bytes asynchronously with SHA-256. */
  sha256Blob,
  parseQueryParams,
  getNestedValue,
  isPlainObject,
  clone,
  merge,
  deepMerge,
};

/** General-purpose pagination, ID, serialization, URL-query, and object helpers. */
export const Utilities = {
  fetchAllByPaging,
  randomId,
  stableStringify,
  /** Encodes supported extended JavaScript values with deterministic, collision-safe tags. */
  canonicalStringify,
  /**
   * Retains the legacy collision-prone 32-bit hash for supported simple values.
   * @deprecated Use `hash32` for accurate non-cryptographic naming or
   * `sha256Canonical` for cryptographic canonical hashing. Unsupported values now throw.
   */
  hash,
  /** Returns a fast, collision-prone, non-cryptographic compatibility hash. */
  hash32,
  /** Returns the lowercase hexadecimal SHA-256 of a canonical value encoding. */
  sha256Canonical,
  /** Hashes actual Blob/File bytes asynchronously with SHA-256. */
  sha256Blob,
  parseQueryParams,
  generateUuid,
  getNestedValue,
  isPlainObject,
  clone,
  merge,
  deepMerge,
};
