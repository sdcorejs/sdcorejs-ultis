import { describe, it, expect, vi } from 'vitest';
import { Utilities } from './utility.fns';
import { UnsafePropertyPathError } from '../errors';

// ─── fetchAllByPaging ─────────────────────────────────────────────────────────

describe('Utilities.fetchAllByPaging', () => {
  it('returns all items from a single page (total fits within one call)', async () => {
    const items = ['a', 'b', 'c'];
    const func = vi.fn().mockResolvedValue({ items, total: 3 });

    const result = await Utilities.fetchAllByPaging(func, 10);

    expect(result).toEqual(['a', 'b', 'c']);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith(10, 0);
  });

  it('collects items across two pages', async () => {
    const page1 = { items: [1, 2, 3], total: 5 };
    const page2 = { items: [4, 5], total: 5 };
    const func = vi.fn()
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const result = await Utilities.fetchAllByPaging(func, 3);

    expect(result).toEqual([1, 2, 3, 4, 5]);
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenNthCalledWith(1, 3, 0);
    expect(func).toHaveBeenNthCalledWith(2, 3, 1);
  });

  it('returns empty array when total is 0', async () => {
    const func = vi.fn().mockResolvedValue({ items: [], total: 0 });

    const result = await Utilities.fetchAllByPaging(func);

    expect(result).toEqual([]);
    // Only one call needed — total=0 means the else branch returns []
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('stops exactly at the page boundary (total === pageSize)', async () => {
    const items = [1, 2, 3, 4];
    const func = vi.fn().mockResolvedValue({ items, total: 4 });

    const result = await Utilities.fetchAllByPaging(func, 4);

    expect(result).toEqual([1, 2, 3, 4]);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('uses default page size 1000 when none specified', async () => {
    const func = vi.fn().mockResolvedValue({ items: ['x'], total: 1 });

    await Utilities.fetchAllByPaging(func);

    expect(func).toHaveBeenCalledWith(1000, 0);
  });
});

// ─── randomId ────────────────────────────────────────────────────────────────

describe('Utilities.randomId', () => {
  it('returns a non-empty string', () => {
    const id = Utilities.randomId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('includes prefix separated by underscore when prefix is provided', () => {
    const id = Utilities.randomId('order');
    expect(id.startsWith('order_')).toBe(true);
  });

  it('does not add prefix when prefix is null', () => {
    const id = Utilities.randomId(null);
    expect(id.includes('_')).toBe(false);
  });

  it('does not add prefix when prefix is undefined', () => {
    const id = Utilities.randomId(undefined);
    expect(id.includes('_')).toBe(false);
  });

  it('two successive calls produce different IDs', () => {
    const id1 = Utilities.randomId();
    const id2 = Utilities.randomId();
    expect(id1).not.toBe(id2);
  });

  it('two calls with the same prefix produce different IDs', () => {
    const id1 = Utilities.randomId('user');
    const id2 = Utilities.randomId('user');
    expect(id1).not.toBe(id2);
  });
});

// ─── hash ────────────────────────────────────────────────────────────────────

describe('Utilities.hash', () => {
  it('returns a string starting with "h"', () => {
    const result = Utilities.hash({ a: 1 });
    expect(typeof result).toBe('string');
    expect(result.startsWith('h')).toBe(true);
  });

  it('is deterministic — same input always produces same hash', () => {
    const obj = { name: 'test', value: 42 };
    expect(Utilities.hash(obj)).toBe(Utilities.hash(obj));
  });

  it('produces the same hash regardless of key insertion order', () => {
    const h1 = Utilities.hash({ a: 1, b: 2 });
    const h2 = Utilities.hash({ b: 2, a: 1 });
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different objects', () => {
    expect(Utilities.hash({ a: 1 })).not.toBe(Utilities.hash({ a: 2 }));
  });

  it('works with an array input', () => {
    const result = Utilities.hash([1, 2, 3]);
    expect(typeof result).toBe('string');
    expect(result.startsWith('h')).toBe(true);
  });

  it('array order matters — [1,2] and [2,1] have different hashes', () => {
    expect(Utilities.hash([1, 2])).not.toBe(Utilities.hash([2, 1]));
  });

  it('same array produces same hash', () => {
    expect(Utilities.hash([1, 2, 3])).toBe(Utilities.hash([1, 2, 3]));
  });

  it('works with null and primitive inputs', () => {
    const n = Utilities.hash(null);
    const s = Utilities.hash('hello');
    const num = Utilities.hash(42);
    expect(n.startsWith('h')).toBe(true);
    expect(s.startsWith('h')).toBe(true);
    expect(num.startsWith('h')).toBe(true);
  });

  it('nested key order does not matter', () => {
    const h1 = Utilities.hash({ outer: { x: 1, y: 2 } });
    const h2 = Utilities.hash({ outer: { y: 2, x: 1 } });
    expect(h1).toBe(h2);
  });
});

// ─── parseQueryParams ─────────────────────────────────────────────────────────

describe('Utilities.parseQueryParams', () => {
  it('returns empty object for undefined input', () => {
    expect(Utilities.parseQueryParams(undefined)).toEqual({});
  });

  it('returns empty object for empty string', () => {
    expect(Utilities.parseQueryParams('')).toEqual({});
  });

  it('parses a query string with leading "?"', () => {
    expect(Utilities.parseQueryParams('?page=1&size=20')).toEqual({
      page: '1',
      size: '20',
    });
  });

  it('parses a query string without leading "?"', () => {
    expect(Utilities.parseQueryParams('q=hello')).toEqual({ q: 'hello' });
  });

  it('decodes URL-encoded values', () => {
    const result = Utilities.parseQueryParams('name=Nguy%E1%BB%85n');
    expect(result).toEqual({ name: 'Nguyễn' });
  });

  it('handles multiple params', () => {
    const result = Utilities.parseQueryParams('a=1&b=2&c=3');
    expect(result).toEqual({ a: '1', b: '2', c: '3' });
  });

  it('handles a param with no value', () => {
    const result = Utilities.parseQueryParams('flag=');
    expect(result).toEqual({ flag: '' });
  });
});

// ─── generateUuid ─────────────────────────────────────────────────────────────

describe('Utilities.generateUuid', () => {
  it('returns a non-empty string', () => {
    const id = Utilities.generateUuid();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('always matches UUID v4 and RFC variant format', () => {
    const id = Utilities.generateUuid();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(uuidPattern.test(id)).toBe(true);
  });

  it('produces different values on successive calls', () => {
    const id1 = Utilities.generateUuid();
    const id2 = Utilities.generateUuid();
    expect(id1).not.toBe(id2);
  });
});

// ─── getNestedValue ───────────────────────────────────────────────────────────

describe('Utilities.getNestedValue', () => {
  it('reads a simple top-level key', () => {
    expect(Utilities.getNestedValue({ a: 1 }, 'a')).toBe(1);
  });

  it('reads a deeply nested key', () => {
    const obj = { user: { address: { city: 'Hanoi' } } };
    expect(Utilities.getNestedValue(obj, 'user.address.city')).toBe('Hanoi');
  });

  it('returns undefined for a missing top-level key', () => {
    expect(Utilities.getNestedValue({ a: 1 }, 'b')).toBeUndefined();
  });

  it('returns undefined for a missing nested key', () => {
    expect(Utilities.getNestedValue({ a: {} }, 'a.b.c')).toBeUndefined();
  });

  it('returns undefined when obj is null', () => {
    expect(Utilities.getNestedValue(null, 'a')).toBeUndefined();
  });

  it('returns undefined when obj is undefined', () => {
    expect(Utilities.getNestedValue(undefined, 'a')).toBeUndefined();
  });

  it('rejects an empty path string', () => {
    expect(() => Utilities.getNestedValue({ a: 1 }, '')).toThrow(UnsafePropertyPathError);
  });

  it('reads a value of 0 (falsy but valid)', () => {
    expect(Utilities.getNestedValue({ count: 0 }, 'count')).toBe(0);
  });

  it('reads a boolean false value', () => {
    expect(Utilities.getNestedValue({ active: false }, 'active')).toBe(false);
  });

  it('reads a null value at the leaf', () => {
    expect(Utilities.getNestedValue({ a: { b: null } }, 'a.b')).toBeNull();
  });

  it('returns undefined when an intermediate node is null', () => {
    expect(Utilities.getNestedValue({ a: null }, 'a.b')).toBeUndefined();
  });
});
