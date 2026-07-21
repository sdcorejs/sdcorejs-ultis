import { UnsafePropertyPathError } from '../errors';
import { assertSafeObjectKey } from './security';

/** Options for safe own-property path traversal. */
export interface PropertyPathOptions {
  /** Maximum number of path segments. Defaults to `32`. */
  maxDepth?: number;
  /** Invoke own accessor properties. Disabled by default because getters can have side effects. */
  allowAccessors?: boolean;
}

/** Result metadata used when missing and explicit `undefined` must be distinguished. */
export interface PropertyPathResolution<T = unknown> {
  /** Whether every segment was present as an own property. */
  found: boolean;
  /** The resolved value when found. */
  value: T | undefined;
}

const DEFAULT_MAX_PATH_DEPTH = 32;

const failPath = (path: string, reason: string): never => {
  throw new UnsafePropertyPathError(path, reason);
};

const readQuotedSegment = (path: string, start: number): { segment: string; next: number } => {
  const quote = path[start];
  let segment = '';
  let index = start + 1;
  while (index < path.length) {
    const char = path[index];
    if (char === '\\') {
      index++;
      if (index >= path.length) failPath(path, 'unterminated escape sequence');
      segment += path[index];
      index++;
      continue;
    }
    if (char === quote) return { segment, next: index + 1 };
    segment += char;
    index++;
  }
  return failPath(path, 'unterminated quoted bracket segment');
};

/**
 * Parses dot paths and numeric/quoted bracket paths without evaluating JavaScript.
 * Examples: `user.name`, `items[0].name`, `record["display-name"]`.
 */
export const parsePropertyPath = (
  path: string,
  options: PropertyPathOptions = {},
): string[] => {
  if (typeof path !== 'string' || path.length === 0) failPath(String(path), 'path must be a non-empty string');
  if (path.trim() !== path) failPath(path, 'leading or trailing whitespace is not allowed');

  const segments: string[] = [];
  let index = 0;
  let requirePlainSegment = true;

  while (index < path.length) {
    if (path[index] === '.') failPath(path, 'empty path segment');

    if (path[index] !== '[') {
      const start = index;
      while (index < path.length && path[index] !== '.' && path[index] !== '[' && path[index] !== ']') index++;
      const segment = path.slice(start, index);
      if (!segment || segment.trim() !== segment || /\s/.test(segment)) failPath(path, 'malformed dot segment');
      segments.push(segment);
      requirePlainSegment = false;
    } else if (requirePlainSegment && segments.length > 0) {
      failPath(path, 'bracket segment cannot follow a dot');
    }

    while (index < path.length && path[index] === '[') {
      index++;
      if (index >= path.length) failPath(path, 'unterminated bracket segment');
      let segment: string;
      if (path[index] === '"' || path[index] === "'") {
        const result = readQuotedSegment(path, index);
        segment = result.segment;
        index = result.next;
      } else {
        const start = index;
        while (index < path.length && path[index] !== ']') index++;
        segment = path.slice(start, index);
        if (!/^(0|[1-9]\d*)$/.test(segment)) failPath(path, 'bracket segments must be numeric or quoted');
      }
      if (!segment) failPath(path, 'empty bracket segment');
      if (path[index] !== ']') failPath(path, 'unterminated bracket segment');
      index++;
      segments.push(segment);
      requirePlainSegment = false;
    }

    if (index < path.length) {
      if (path[index] !== '.') failPath(path, `unexpected character ${JSON.stringify(path[index])}`);
      index++;
      if (index >= path.length) failPath(path, 'path cannot end with a dot');
      requirePlainSegment = true;
    }
  }

  const maxDepth = options.maxDepth ?? DEFAULT_MAX_PATH_DEPTH;
  if (!Number.isSafeInteger(maxDepth) || maxDepth <= 0) failPath(path, 'maxDepth must be a positive safe integer');
  if (segments.length > maxDepth) failPath(path, `path exceeds maximum depth ${maxDepth}`);
  for (const segment of segments) {
    try {
      assertSafeObjectKey(segment);
    } catch {
      failPath(path, `prototype-sensitive segment ${JSON.stringify(segment)}`);
    }
  }
  return segments;
};

/** Resolves a path through own data properties only, without invoking getters by default. */
export const resolveOwnPropertyPath = <T = unknown>(
  source: unknown,
  path: string,
  options: PropertyPathOptions = {},
): PropertyPathResolution<T> => {
  const segments = parsePropertyPath(path, options);
  let current: unknown = source;

  if (current === Object.prototype || current === Function.prototype) {
    failPath(path, 'prototype objects cannot be traversal roots');
  }

  for (const segment of segments) {
    if ((typeof current !== 'object' && typeof current !== 'function') || current === null) {
      return { found: false, value: undefined };
    }
    if (current === Object.prototype || current === Function.prototype) {
      failPath(path, 'traversal reached a prototype object');
    }
    if (!Object.hasOwn(current, segment)) return { found: false, value: undefined };
    const descriptor = Object.getOwnPropertyDescriptor(current, segment);
    if (!descriptor) return { found: false, value: undefined };
    if ('get' in descriptor || 'set' in descriptor) {
      if (!options.allowAccessors || typeof descriptor.get !== 'function') {
        return { found: false, value: undefined };
      }
      current = descriptor.get.call(current);
    } else {
      current = descriptor.value;
    }
    if (current === Object.prototype || current === Function.prototype) {
      failPath(path, 'traversal resolved to a prototype object');
    }
  }

  return { found: true, value: current as T };
};

/** Returns a safely resolved own-property value, or `undefined` when absent/inaccessible. */
export const getOwnPropertyPath = <T = unknown>(
  source: unknown,
  path: string,
  options: PropertyPathOptions = {},
): T | undefined => resolveOwnPropertyPath<T>(source, path, options).value;
