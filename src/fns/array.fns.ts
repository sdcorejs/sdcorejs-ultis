/* eslint-disable @typescript-eslint/no-explicit-any */
import { CircularReferenceError, ValidationError } from '../errors';
import { getOwnPropertyPath, resolveOwnPropertyPath } from '../internal/property-path';
import { assertSafeObjectKey, defineSafeDataProperty } from '../internal/security';
import { StringUtilities } from './string.fns';

/** Options for bounded tree search. */
export interface ArraySearchOptions {
  /** Maximum child depth. Defaults to `100`. */
  maxDepth?: number;
}

const validateMaxDepth = (value: number | undefined): number => {
  const maxDepth = value ?? 100;
  if (!Number.isSafeInteger(maxDepth) || maxDepth <= 0) {
    throw new ValidationError('maxDepth must be a positive safe integer');
  }
  return maxDepth;
};

type OwnDataArrayElement<T> =
  | { found: false }
  | { found: true; value: T };

const readOwnDataArrayElement = <T>(items: readonly T[], index: number): OwnDataArrayElement<T> => {
  const descriptor = Object.getOwnPropertyDescriptor(items, index);
  if (!descriptor || !Object.hasOwn(descriptor, 'value')) return { found: false };
  return { found: true, value: descriptor.value as T };
};

const matchesFields = (
  item: unknown,
  searchText: unknown,
  fields: readonly string[],
): boolean => {
  if (fields.length === 0) return item !== undefined && item !== null && StringUtilities.aliasIncludes(item, searchText);
  return fields.some(field => {
    const value = getOwnPropertyPath(item, field);
    return value !== undefined && value !== null && StringUtilities.aliasIncludes(value, searchText);
  });
};

const treeContainsMatch = (
  root: unknown,
  searchText: unknown,
  fields: readonly string[],
  childrenPath: string | undefined,
  maxDepth: number,
): boolean => {
  type Frame = { node: unknown; depth: number; exit: boolean };
  const active = new WeakSet<object>();
  const stack: Frame[] = [{ node: root, depth: 0, exit: false }];

  while (stack.length > 0) {
    const frame = stack.pop() as Frame;
    const objectNode = (typeof frame.node === 'object' || typeof frame.node === 'function') && frame.node !== null
      ? frame.node as object
      : undefined;
    if (frame.exit) {
      if (objectNode) active.delete(objectNode);
      continue;
    }
    if (objectNode) {
      if (active.has(objectNode)) throw new CircularReferenceError('array search tree');
      active.add(objectNode);
      stack.push({ ...frame, exit: true });
    }
    if (matchesFields(frame.node, searchText, fields)) return true;
    if (!childrenPath || !objectNode) continue;
    const resolution = resolveOwnPropertyPath(objectNode, childrenPath);
    if (!resolution.found || resolution.value === undefined || resolution.value === null) continue;
    if (!Array.isArray(resolution.value)) {
      throw new ValidationError(`children path ${JSON.stringify(childrenPath)} must resolve to an array`);
    }
    if (resolution.value.length === 0) continue;
    if (frame.depth >= maxDepth) throw new ValidationError(`array search exceeded maxDepth (${maxDepth})`);
    for (let index = resolution.value.length - 1; index >= 0; index--) {
      const child = readOwnDataArrayElement(resolution.value, index);
      if (!child.found) continue;
      stack.push({ node: child.value, depth: frame.depth + 1, exit: false });
    }
  }
  return false;
};

/**
 * Performs stable, non-mutating, diacritic-insensitive search. When `children`
 * is supplied, descendants are traversed iteratively with cycle and depth checks.
 * Field and child paths use own data properties only and never invoke getters.
 */
const search = <T = any>(
  items: T[],
  searchText: any,
  fields?: (string | undefined) | (string | undefined)[],
  children?: string,
  options: ArraySearchOptions = {},
): T[] => {
  if (!searchText?.toString()) return items;
  if (!Array.isArray(items) || items.length === 0) return items;
  const normalizedFields: string[] = [];
  if (Array.isArray(fields)) {
    for (let index = 0; index < fields.length; index++) {
      const field = readOwnDataArrayElement(fields, index);
      if (field.found && typeof field.value === 'string' && field.value.length > 0) {
        normalizedFields.push(field.value);
      }
    }
  } else if (typeof fields === 'string' && fields.length > 0) {
    normalizedFields.push(fields);
  }
  normalizedFields.forEach(assertSafeObjectKey);
  if (children) assertSafeObjectKey(children);
  const maxDepth = validateMaxDepth(options.maxDepth);
  const result: T[] = [];
  for (let index = 0; index < items.length; index++) {
    const item = readOwnDataArrayElement(items, index);
    if (item.found && treeContainsMatch(item.value, searchText, normalizedFields, children, maxDepth)) {
      result.push(item.value);
    }
  }
  return result;
};

/** Merges arrays in stable order and keeps the first item for each own-property key value. */
const union = <T = unknown>(key: string, ...args: (T[] | undefined | null)[]): T[] => {
  assertSafeObjectKey(key);
  const result: T[] = [];
  const seen = new Set<unknown>();
  for (const values of args) {
    if (!Array.isArray(values)) continue;
    for (const item of values) {
      if (item === undefined || item === null) continue;
      const itemKey = getOwnPropertyPath(item, key);
      if (seen.has(itemKey)) continue;
      seen.add(itemKey);
      result.push(item);
    }
  }
  return result;
};

/** Builds a plain record with last-value-wins duplicate behavior and safe own keys. */
const toObject = <T>(key: string, items: T[] | undefined | null): Record<string, T> => {
  assertSafeObjectKey(key);
  const result: Record<string, T> = {};
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    if (item === undefined || item === null) continue;
    const value = getOwnPropertyPath(item, key);
    if (value === undefined || value === null) continue;
    const objectKey = String(value);
    assertSafeObjectKey(objectKey);
    defineSafeDataProperty(result, objectKey, item);
  }
  return result;
};

/** Returns stable SameValueZero-distinct values without mutating the input. */
const distinct = <T = any>(items: T[] | undefined | null): T[] =>
  Array.isArray(items) ? [...new Set(items)] : [];

/** Returns a validated zero-based page using `slice`; sparse-array holes remain sparse. */
const paging = <T = any>(
  items: T[] | undefined | null,
  pageSize: number,
  page?: number,
): T[] => {
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0) {
    throw new ValidationError('pageSize must be a positive safe integer');
  }
  const pageNumber = page ?? 0;
  if (!Number.isSafeInteger(pageNumber) || pageNumber < 0) {
    throw new ValidationError('page must be a non-negative safe integer');
  }
  const offset = pageNumber * pageSize;
  if (!Number.isSafeInteger(offset)) throw new ValidationError('paging offset exceeds the safe integer range');
  if (!Array.isArray(items)) return [];
  return items.slice(offset, offset + pageSize);
};

export const ArrayUtilities = { search, union, toObject, distinct, paging };
