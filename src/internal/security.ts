import { UnsafeObjectKeyError } from '../errors';

const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/** Returns whether a string key can be used without crossing a prototype boundary. */
export const isSafeObjectKey = (key: PropertyKey): boolean =>
  typeof key !== 'string' || !UNSAFE_OBJECT_KEYS.has(key);

/** Rejects keys that can replace, construct, or traverse JavaScript prototypes. */
export const assertSafeObjectKey = (key: PropertyKey): void => {
  if (!isSafeObjectKey(key)) throw new UnsafeObjectKeyError(key as string);
};

/** Rejects enumerable own properties with prototype-sensitive string keys. */
export const assertSafeEnumerableOwnKeys = (source: object): void => {
  for (const key of Reflect.ownKeys(source)) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (descriptor?.enumerable) assertSafeObjectKey(key);
  }
};

/** Defines an enumerable own data property after applying the canonical key policy. */
export const defineSafeDataProperty = (
  target: object,
  key: PropertyKey,
  value: unknown,
): void => {
  assertSafeObjectKey(key);
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
};

/** Creates a record whose prototype is guaranteed to be `Object.prototype` or `null`. */
export const createSafeRecord = (prototype: object | null = Object.prototype): Record<string, unknown> =>
  Object.create(prototype === null ? null : Object.prototype) as Record<string, unknown>;
