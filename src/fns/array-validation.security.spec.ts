import { describe, expect, it } from 'vitest';
import { CircularReferenceError, UnsafeObjectKeyError, ValidationError } from '../errors';
import { ArrayUtilities } from './array.fns';
import { NumberUtilities } from './number.fns';
import { StringUtilities } from './string.fns';
import { ValidationUtilities } from './validation.fns';

describe('ArrayUtilities hardened contracts', () => {
  it('keeps first-wins stable union behavior in linear order', () => {
    const first = { id: 1, value: 'first' };
    const second = { id: 1, value: 'second' };
    expect(ArrayUtilities.union('id', [first], [null as never, second, { id: 2, value: 'two' }]))
      .toEqual([first, { id: 2, value: 'two' }]);
  });

  it('handles large unions and deeply nested trees without timing assertions', () => {
    const first = Array.from({ length: 5_000 }, (_, id) => ({ id, source: 'first' }));
    const second = Array.from({ length: 5_000 }, (_, offset) => ({ id: offset + 2_500, source: 'second' }));
    const union = ArrayUtilities.union('id', first, second);
    expect(union).toHaveLength(7_500);
    expect(union[2_500]).toBe(first[2_500]);
    expect(union.at(-1)).toEqual({ id: 7_499, source: 'second' });

    type TreeNode = { name: string; children?: TreeNode[] };
    let root: TreeNode = { name: 'target' };
    for (let depth = 0; depth < 2_000; depth++) root = { name: `node-${depth}`, children: [root] };
    expect(ArrayUtilities.search([root], 'target', 'name', 'children', { maxDepth: 2_001 }))
      .toEqual([root]);
  });

  it('rejects cycles, invalid child collections, and excessive tree depth', () => {
    const cyclic: { name: string; children: unknown[] } = { name: 'root', children: [] };
    cyclic.children.push(cyclic);
    expect(() => ArrayUtilities.search([cyclic], 'missing', 'name', 'children')).toThrow(CircularReferenceError);
    expect(() => ArrayUtilities.search([{ name: 'x', children: 'bad' }], 'missing', 'name', 'children'))
      .toThrow(ValidationError);
    const nested = { name: 'a', children: [{ name: 'b', children: [{ name: 'c' }] }] };
    expect(() => ArrayUtilities.search([nested], 'missing', 'name', 'children', { maxDepth: 1 }))
      .toThrow(ValidationError);
  });

  it('does not search inherited fields or getters', () => {
    const inherited = Object.create({ name: 'match' });
    expect(ArrayUtilities.search([inherited], 'match', 'name')).toEqual([]);
    let called = false;
    const accessor = Object.defineProperty({}, 'name', { get: () => { called = true; return 'match'; } });
    expect(ArrayUtilities.search([accessor], 'match', 'name')).toEqual([]);
    expect(called).toBe(false);
  });

  it('does not invoke accessor elements in child, field, or top-level arrays', () => {
    let calls = 0;
    const children: unknown[] = [];
    Object.defineProperty(children, 0, {
      configurable: true,
      get: () => { calls += 1; return { name: 'match' }; },
    });
    children.length = 1;

    const fields: (string | undefined)[] = [];
    Object.defineProperty(fields, 0, {
      configurable: true,
      get: () => { calls += 1; return 'name'; },
    });
    fields.length = 1;

    const items: Array<{ name: string; children?: unknown[] }> = [{ name: 'root', children }];
    Object.defineProperty(items, 1, {
      configurable: true,
      get: () => { calls += 1; return { name: 'match' }; },
    });
    items.length = 2;

    expect(ArrayUtilities.search(items, 'match', fields, 'children')).toEqual([]);
    expect(calls).toBe(0);
  });

  it('validates paging and preserves sparse holes with slice', () => {
    expect(() => ArrayUtilities.paging([1, 2], 0)).toThrow(ValidationError);
    expect(() => ArrayUtilities.paging(null, 0)).toThrow(ValidationError);
    expect(() => ArrayUtilities.paging([1, 2], 1.5)).toThrow(ValidationError);
    expect(() => ArrayUtilities.paging([1, 2], 1, -1)).toThrow(ValidationError);
    expect(() => ArrayUtilities.paging([1, 2], 1, 0.5)).toThrow(ValidationError);
    expect(() => ArrayUtilities.paging([1, 2], 1, Number.POSITIVE_INFINITY)).toThrow(ValidationError);
    expect(() => ArrayUtilities.paging([1, 2], 1, Number.MAX_SAFE_INTEGER + 1)).toThrow(ValidationError);
    expect(() => ArrayUtilities.paging([1, 2], Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER))
      .toThrow(ValidationError);
    // @ts-expect-error Array paging no longer accepts one-based options.
    expect(ArrayUtilities.paging([1, 2, 3, 4], 2, 1, { pageBase: 1 })).toEqual([3, 4]);
    const sparse = new Array(3);
    sparse[2] = 'x';
    const page = ArrayUtilities.paging(sparse, 2, 0);
    expect(page).toHaveLength(2);
    expect(Object.hasOwn(page, 0)).toBe(false);
  });

  it('rejects unsafe output and lookup keys', () => {
    expect(() => ArrayUtilities.toObject('id', [{ id: 'constructor' }])).toThrow(UnsafeObjectKeyError);
    expect(() => ArrayUtilities.union('__proto__', [])).toThrow(UnsafeObjectKeyError);
  });
});

describe('explicit number validation', () => {
  it('distinguishes finite numbers, numeric strings, and legacy coercion', () => {
    expect(NumberUtilities.isFiniteNumber(1)).toBe(true);
    expect(NumberUtilities.isFiniteNumber(Infinity)).toBe(false);
    expect(NumberUtilities.isNumericString('1e3')).toBe(true);
    expect(NumberUtilities.isNumericString('0xff')).toBe(false);
    expect(NumberUtilities.isNumericString('0xff', { allowHex: true })).toBe(true);
    expect(NumberUtilities.isNumericString(' 1 ')).toBe(false);
    expect(NumberUtilities.parseFiniteNumber(' 1 ', { trim: true })).toBe(1);
    expect(NumberUtilities.parseFiniteNumber(false)).toBeNull();
    expect(NumberUtilities.parseFiniteNumber(false, { allowBoolean: true })).toBe(0);
    expect(NumberUtilities.parseFiniteNumber([])).toBeNull();
  });
});

describe('ValidationUtilities policies', () => {
  it('throws for unknown runtime pattern names instead of matching everything', () => {
    expect(() => ValidationUtilities.validate('UNKNOWN' as never, 'anything')).toThrow(ValidationError);
  });

  it('uses URL parsing with explicit relative, credential, and protocol policies', () => {
    const credentialUrl = ['https://user', 'pass@example.com'].join(':');

    expect(ValidationUtilities.isUrl('https://example.technology/path')).toBe(true);
    expect(ValidationUtilities.isUrl('/relative')).toBe(false);
    expect(ValidationUtilities.isUrl('/relative', { allowRelative: true })).toBe(true);
    expect(ValidationUtilities.isUrl(credentialUrl)).toBe(false);
    expect(ValidationUtilities.isUrl('ftp://example.com')).toBe(false);
    expect(ValidationUtilities.isUrl('ftp://example.com', { protocols: ['ftp:'] })).toBe(true);
  });

  it('validates generic UUIDs separately from UUID v4', () => {
    expect(ValidationUtilities.isUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    expect(ValidationUtilities.isUuidV4('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(ValidationUtilities.isUuidV4('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
    expect(ValidationUtilities.isUuid('550E8400-E29B-41D4-A716-446655440000', { allowUppercase: false })).toBe(false);
  });

  it('labels extension checking accurately and rejects malformed base64 padding', () => {
    expect(ValidationUtilities.hasImageFileExtension('/images/photo.WEBP?size=2')).toBe(true);
    expect(ValidationUtilities.hasImageFileExtension('/images/file.pdf')).toBe(false);
    for (const value of ['TQ==', 'TWE=', 'SGVsbG8=', 'SGVsbG8h']) {
      expect(ValidationUtilities.isBase64(value)).toBe(true);
      expect(new RegExp(StringUtilities.REGEX_BASE64).test(value)).toBe(true);
    }
    for (const value of ['TQ', 'TWE', 'SGVsbG8', 'A===', 'TW=E']) {
      expect(ValidationUtilities.isBase64(value)).toBe(false);
      expect(new RegExp(StringUtilities.REGEX_BASE64).test(value)).toBe(false);
    }
  });
});
