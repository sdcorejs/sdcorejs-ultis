import {
  CircularReferenceError,
  UnsupportedSerializationTypeError,
  WebCryptoUnavailableError,
} from '../errors';
import { encodeBase64Url, encodeHex, encodeUtf8 } from '../internal/encoding';
import { assertSafeObjectKey } from '../internal/security';

/** Options shared by deterministic serializers. */
export interface SerializationOptions {
  /** Maximum recursively visited depth. Defaults to `100`. */
  maxDepth?: number;
}

/** Options for JSON-domain stable serialization. */
export type StableStringifyOptions = SerializationOptions;

/** Options for extended, type-tagged canonical serialization. */
export type CanonicalStringifyOptions = SerializationOptions;

const DEFAULT_MAX_DEPTH = 100;

const getMaxDepth = (options: SerializationOptions): number => {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  if (!Number.isSafeInteger(maxDepth) || maxDepth <= 0) {
    throw new UnsupportedSerializationTypeError('invalid maxDepth option');
  }
  return maxDepth;
};

const typeName = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'Array';
  const primitive = typeof value;
  if (primitive !== 'object') return primitive;
  if (value instanceof Date) return 'Date';
  if (value instanceof RegExp) return 'RegExp';
  if (value instanceof Map) return 'Map';
  if (value instanceof Set) return 'Set';
  if (value instanceof ArrayBuffer) return 'ArrayBuffer';
  if (ArrayBuffer.isView(value)) return dataConstructorName(value, 'ArrayBufferView');
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return typeof File !== 'undefined' && value instanceof File ? 'File' : 'Blob';
  }
  return dataConstructorName(value as object, 'object');
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const dataConstructorName = (value: object, fallback: string): string => {
  const prototype = Object.getPrototypeOf(value);
  if (prototype === null) return fallback;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor');
  return descriptor && 'value' in descriptor && typeof descriptor.value === 'function' && descriptor.value.name
    ? descriptor.value.name
    : fallback;
};

const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const isCanonicalArrayIndex = (key: string): boolean => {
  if (!/^(?:0|[1-9]\d*)$/.test(key)) return false;
  const index = Number(key);
  return Number.isSafeInteger(index) && index >= 0 && index < 4_294_967_295;
};

const assertNoEnumerableExpando = (
  value: object,
  path: string,
  allowStringKey: (key: string) => boolean = () => false,
): void => {
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable) continue;
    if (typeof key !== 'string' || !allowStringKey(key)) {
      throw new UnsupportedSerializationTypeError('enumerable expando property', path);
    }
  }
};

const assertDepth = (depth: number, maxDepth: number, path: string): void => {
  if (depth > maxDepth) throw new UnsupportedSerializationTypeError('maximum depth exceeded', path);
};

const enumerableStringKeys = (value: object, path: string): string[] => {
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === 'symbol' && descriptor?.enumerable) {
      throw new UnsupportedSerializationTypeError('symbol key', path);
    }
  }
  return Object.keys(value);
};

const readDataProperty = (value: object, key: string, path: string): unknown => {
  assertSafeObjectKey(key);
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !descriptor.enumerable) return undefined;
  if (!('value' in descriptor)) throw new UnsupportedSerializationTypeError('accessor property', path);
  return descriptor.value;
};

/**
 * Deterministically serializes JSON-compatible values, sorting plain-object keys.
 *
 * `Date` is retained for v1.x compatibility and encodes as its ISO string. The
 * function rejects `undefined`, functions, symbols, bigint, non-finite numbers,
 * sparse arrays, accessors, class instances, binary/collection objects, and cycles.
 * Negative zero follows JSON semantics and encodes as `0`.
 */
export const stableStringify = (value: unknown, options: StableStringifyOptions = {}): string => {
  const maxDepth = getMaxDepth(options);
  const ancestors = new WeakSet<object>();

  const visit = (current: unknown, path: string, depth: number): string => {
    assertDepth(depth, maxDepth, path);
    if (current === null) return 'null';
    switch (typeof current) {
      case 'string':
      case 'boolean':
        return JSON.stringify(current);
      case 'number':
        if (!Number.isFinite(current)) throw new UnsupportedSerializationTypeError(String(current), path);
        return Object.is(current, -0) ? '0' : JSON.stringify(current);
      case 'undefined':
      case 'function':
      case 'symbol':
      case 'bigint':
        throw new UnsupportedSerializationTypeError(typeName(current), path);
      case 'object':
        break;
    }

    const objectValue = current as object;
    if (ancestors.has(objectValue)) throw new CircularReferenceError(path);
    ancestors.add(objectValue);
    try {
      if (current instanceof Date) {
        assertNoEnumerableExpando(current, path);
        if (!Number.isFinite(current.getTime())) throw new UnsupportedSerializationTypeError('Invalid Date', path);
        return JSON.stringify(current.toISOString());
      }
      if (Array.isArray(current)) {
        assertNoEnumerableExpando(current, path, key => isCanonicalArrayIndex(key) && Number(key) < current.length);
        const encoded: string[] = [];
        for (let index = 0; index < current.length; index++) {
          if (!Object.hasOwn(current, index)) throw new UnsupportedSerializationTypeError('sparse array', `${path}[${index}]`);
          const descriptor = Object.getOwnPropertyDescriptor(current, String(index));
          if (!descriptor || !('value' in descriptor)) {
            throw new UnsupportedSerializationTypeError('accessor array element', `${path}[${index}]`);
          }
          encoded.push(visit(descriptor.value, `${path}[${index}]`, depth + 1));
        }
        return `[${encoded.join(',')}]`;
      }
      if (!isPlainRecord(current)) throw new UnsupportedSerializationTypeError(typeName(current), path);
      const entries = enumerableStringKeys(current, path)
        .sort()
        .map(key => `${JSON.stringify(key)}:${visit(readDataProperty(current, key, `${path}.${key}`), `${path}.${key}`, depth + 1)}`);
      return `{${entries.join(',')}}`;
    } finally {
      ancestors.delete(objectValue);
    }
  };

  return visit(value, '$', 0);
};

type CanonicalNode = readonly unknown[];
const tagged = (type: string, ...payload: unknown[]): CanonicalNode => ['@sdcorejs/canonical/v1', type, ...payload];

const canonicalNode = (
  value: unknown,
  maxDepth: number,
  ancestors: WeakSet<object>,
  path: string,
  depth: number,
): CanonicalNode => {
  assertDepth(depth, maxDepth, path);
  if (value === null) return tagged('null');
  switch (typeof value) {
    case 'undefined': return tagged('undefined');
    case 'string': return tagged('string', value);
    case 'boolean': return tagged('boolean', value);
    case 'number':
      if (Number.isNaN(value)) return tagged('number', 'nan');
      if (value === Infinity) return tagged('number', 'infinity');
      if (value === -Infinity) return tagged('number', '-infinity');
      if (Object.is(value, -0)) return tagged('number', '-0');
      return tagged('number', value);
    case 'bigint': return tagged('bigint', value.toString(10));
    case 'function':
    case 'symbol':
      throw new UnsupportedSerializationTypeError(typeName(value), path);
    case 'object':
      break;
  }

  const objectValue = value as object;
  if (ancestors.has(objectValue)) throw new CircularReferenceError(path);
  ancestors.add(objectValue);
  try {
    if (value instanceof Date) {
      assertNoEnumerableExpando(value, path);
      if (!Number.isFinite(value.getTime())) throw new UnsupportedSerializationTypeError('Invalid Date', path);
      return tagged('date', value.toISOString());
    }
    if (value instanceof RegExp) {
      assertNoEnumerableExpando(value, path);
      return tagged('regexp', value.source, value.flags);
    }
    if (Array.isArray(value)) {
      assertNoEnumerableExpando(value, path, key => isCanonicalArrayIndex(key) && Number(key) < value.length);
      const entries: CanonicalNode[] = [];
      for (let index = 0; index < value.length; index++) {
        if (!Object.hasOwn(value, index)) {
          entries.push(tagged('hole'));
          continue;
        }
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor)) {
          throw new UnsupportedSerializationTypeError('accessor array element', `${path}[${index}]`);
        }
        entries.push(canonicalNode(descriptor.value, maxDepth, ancestors, `${path}[${index}]`, depth + 1));
      }
      return tagged('array', entries);
    }
    if (value instanceof Map) {
      assertNoEnumerableExpando(value, path);
      const entries = [...value.entries()].map(([key, entryValue], index) => {
        const keyNode = canonicalNode(key, maxDepth, ancestors, `${path}.<map-key:${index}>`, depth + 1);
        const valueNode = canonicalNode(entryValue, maxDepth, ancestors, `${path}.<map-value:${index}>`, depth + 1);
        return [JSON.stringify(keyNode), JSON.stringify(valueNode), keyNode, valueNode] as const;
      });
      entries.sort((a, b) => compareCodeUnits(a[0], b[0]) || compareCodeUnits(a[1], b[1]));
      return tagged('map', entries.map(([, , key, entryValue]) => [key, entryValue]));
    }
    if (value instanceof Set) {
      assertNoEnumerableExpando(value, path);
      const entries = [...value].map((entry, index) => {
        const node = canonicalNode(entry, maxDepth, ancestors, `${path}.<set:${index}>`, depth + 1);
        return [JSON.stringify(node), node] as const;
      });
      entries.sort((a, b) => compareCodeUnits(a[0], b[0]));
      return tagged('set', entries.map(([, node]) => node));
    }
    if (value instanceof ArrayBuffer) {
      assertNoEnumerableExpando(value, path);
      return tagged('array-buffer', encodeBase64Url(new Uint8Array(value)));
    }
    if (ArrayBuffer.isView(value)) {
      const constructorName = dataConstructorName(value, 'ArrayBufferView');
      assertNoEnumerableExpando(value, path, key => constructorName !== 'DataView' && isCanonicalArrayIndex(key));
      const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      return tagged('typed-array', constructorName, encodeBase64Url(bytes));
    }
    if (typeof Blob !== 'undefined' && value instanceof Blob) {
      throw new UnsupportedSerializationTypeError(typeof File !== 'undefined' && value instanceof File ? 'File' : 'Blob', path);
    }
    if (!isPlainRecord(value)) throw new UnsupportedSerializationTypeError(typeName(value), path);
    const entries = enumerableStringKeys(value, path)
      .sort()
      .map(key => [key, canonicalNode(readDataProperty(value, key, `${path}.${key}`), maxDepth, ancestors, `${path}.${key}`, depth + 1)] as const);
    return tagged('object', entries);
  } finally {
    ancestors.delete(objectValue);
  }
};

/**
 * Canonically encodes supported extended JavaScript values with collision-safe type tags.
 * Object keys, map entries, and set values are deterministically ordered. Functions,
 * symbols, class instances, accessors, Blob/File values, and cycles are rejected.
 */
export const canonicalStringify = (value: unknown, options: CanonicalStringifyOptions = {}): string =>
  JSON.stringify(canonicalNode(value, getMaxDepth(options), new WeakSet(), '$', 0));

/**
 * Produces the library's legacy 32-bit string hash over stable serialization.
 *
 * This hash is non-cryptographic, collision-prone, and unsuitable for signatures,
 * authentication, authorization, or untrusted persistent cache identities.
 */
export const hash32 = (value: unknown): string => {
  const serialized = stableStringify(value);
  let result = 0;
  for (let index = 0; index < serialized.length; index++) {
    result = (result << 5) - result + serialized.charCodeAt(index);
    result |= 0;
  }
  return `h${Math.abs(result)}`;
};

/**
 * Ambiguous compatibility name for {@link hash32}; behavior is unchanged for the
 * previously supported JSON-compatible domain.
 *
 * @deprecated Use {@link hash32}. Migration risk: unsupported values now throw
 * deterministically instead of colliding or violating the declared return type.
 */
export const hash = hash32;

const getSubtleCrypto = (): SubtleCrypto => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new WebCryptoUnavailableError();
  return subtle;
};

/** Canonicalizes a value and returns its SHA-256 digest as lowercase hexadecimal. */
export const sha256Canonical = async (
  value: unknown,
  options: CanonicalStringifyOptions = {},
): Promise<string> => {
  const digest = await getSubtleCrypto().digest('SHA-256', encodeUtf8(canonicalStringify(value, options)));
  return encodeHex(new Uint8Array(digest));
};

/** Reads Blob/File bytes asynchronously and returns their SHA-256 digest as lowercase hexadecimal. */
export const sha256Blob = async (blob: Blob): Promise<string> => {
  if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
    throw new UnsupportedSerializationTypeError(typeName(blob));
  }
  const digest = await getSubtleCrypto().digest('SHA-256', await blob.arrayBuffer());
  return encodeHex(new Uint8Array(digest));
};
