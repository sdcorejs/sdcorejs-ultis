import { describe, expect, it, vi } from 'vitest';
import { UnsafeObjectKeyError, ValidationError } from '../errors';
import { ArrayUtilities } from './array.fns';
import { ObjectUtilities, Utilities } from './utility.fns';

describe('object builder security', () => {
  it.each([
    '{"__proto__":{"polluted":"yes"}}',
    '{"constructor":{"prototype":{"polluted":"yes"}}}',
    '{"prototype":{"polluted":"yes"}}',
    '{"safe":{"__proto__":{"polluted":"yes"}}}',
  ])('rejects dangerous JSON keys recursively: %s', payload => {
    const source = JSON.parse(payload);
    expect(() => ObjectUtilities.clone(source)).toThrow(UnsafeObjectKeyError);
    expect(() => ObjectUtilities.merge({}, source)).toThrow(UnsafeObjectKeyError);
    expect(({} as { polluted?: string }).polluted).toBeUndefined();
  });

  it.each(['__proto__', 'constructor', 'prototype'])(
    'rejects dangerous enumerable array expando keys recursively: %s',
    key => {
      const array: unknown[] = [];
      Object.defineProperty(array, key, {
        configurable: true,
        enumerable: true,
        value: { polluted: 'yes' },
        writable: true,
      });
      const source = { nested: array };

      expect(() => ObjectUtilities.clone(source)).toThrow(UnsafeObjectKeyError);
      expect(() => ObjectUtilities.merge<Record<string, unknown>>({}, source)).toThrow(UnsafeObjectKeyError);
      expect(({} as { polluted?: string }).polluted).toBeUndefined();
    },
  );

  it('rejects dangerous toObject keys without changing any prototype', () => {
    expect(() => ArrayUtilities.toObject('id', [{ id: '__proto__' }])).toThrow(UnsafeObjectKeyError);
    expect(({} as { polluted?: string }).polluted).toBeUndefined();
  });

  it('preserves null-prototype semantics and cycles during clone', () => {
    const source = Object.create(null) as Record<string, unknown>;
    source.name = 'safe';
    source.self = source;
    const result = ObjectUtilities.clone(source);
    expect(Object.getPrototypeOf(result)).toBeNull();
    expect(result.self).toBe(result);
  });

  it('preserves cyclic plain graphs during merge without overflowing', () => {
    const source: Record<string, unknown> = { value: 1 };
    source.self = source;
    const result = ObjectUtilities.merge({}, source);
    expect(result.value).toBe(1);
    expect(result.self).toBe(result);
  });

  it('ignores inherited properties and rejects accessors without invocation', () => {
    const inherited = Object.create({ inherited: 1 }) as Record<string, unknown>;
    inherited.own = 2;
    const sanitized = ObjectUtilities.clone(inherited);
    expect(sanitized).not.toBe(inherited);
    expect(Object.getPrototypeOf(sanitized)).toBe(Object.prototype);
    expect(sanitized).toEqual({ own: 2 });
    expect((sanitized as { inherited?: number }).inherited).toBeUndefined();
    const getter = vi.fn(() => 'secret');
    const accessor = Object.defineProperty({}, 'secret', { enumerable: true, get: getter });
    expect(() => ObjectUtilities.clone(accessor)).toThrow(ValidationError);
    expect(getter).not.toHaveBeenCalled();
  });

  it('sanitizes nested custom prototypes without invoking Symbol.toStringTag getters', () => {
    const tagGetter = vi.fn(() => 'Date');
    const child = Object.create({ admin: true }) as Record<PropertyKey, unknown>;
    child.own = 2;
    Object.defineProperty(child, Symbol.toStringTag, { get: tagGetter });
    const result = ObjectUtilities.merge({}, { child });
    const clonedChild = result.child as Record<string, unknown>;
    expect(tagGetter).not.toHaveBeenCalled();
    expect(clonedChild).not.toBe(child);
    expect(Object.getPrototypeOf(clonedChild)).toBe(Object.prototype);
    expect(clonedChild).toEqual({ own: 2 });
    expect(clonedChild.admin).toBeUndefined();
  });

  it('keeps genuine class instances as leaves while memoizing merge pairs independently', () => {
    class Example { constructor(readonly value: number) {} }
    const instance = new Example(1);
    expect(ObjectUtilities.clone(instance)).toBe(instance);

    const shared = { a: 1 };
    const result = ObjectUtilities.merge(
      { x: shared, y: shared },
      { x: { b: 1 }, y: { c: 1 } } as unknown as { x: typeof shared; y: typeof shared },
    ) as unknown as { x: Record<string, number>; y: Record<string, number> };
    expect(result.x).toEqual({ a: 1, b: 1 });
    expect(result.y).toEqual({ a: 1, c: 1 });
    expect(result.x).not.toBe(result.y);
  });

  it('fails excessive acyclic clone and merge depth with a typed error', () => {
    const root: Record<string, unknown> = {};
    let cursor = root;
    for (let index = 0; index < 25; index++) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(() => ObjectUtilities.clone(root, { maxDepth: 10 })).toThrow(ValidationError);
    expect(() => ObjectUtilities.merge({}, root, { maxDepth: 10 })).toThrow(ValidationError);
  });

  it('rejects unsafe query parameter keys', () => {
    expect(() => Utilities.parseQueryParams('__proto__=x')).toThrow(UnsafeObjectKeyError);
  });
});
