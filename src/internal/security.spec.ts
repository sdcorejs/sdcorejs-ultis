import { describe, expect, it, vi } from 'vitest';
import { UnsafeObjectKeyError, UnsafePropertyPathError } from '../errors';
import { getOwnPropertyPath, parsePropertyPath, resolveOwnPropertyPath } from './property-path';
import { assertSafeObjectKey, defineSafeDataProperty } from './security';

describe('canonical object-key security', () => {
  it.each(['__proto__', 'prototype', 'constructor'])('rejects %s', key => {
    expect(() => assertSafeObjectKey(key)).toThrow(UnsafeObjectKeyError);
  });

  it('defines an own data property without changing the target prototype', () => {
    const target = {};
    defineSafeDataProperty(target, 'safe', 1);
    expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
    expect(Object.hasOwn(target, 'safe')).toBe(true);
    expect(target).toEqual({ safe: 1 });
  });
});

describe('safe property paths', () => {
  it('supports own dot, numeric dot, numeric bracket, and quoted bracket segments', () => {
    const source = { items: [{ 'display-name': 'Ada' }] };
    expect(getOwnPropertyPath(source, 'items.0.display-name')).toBe('Ada');
    expect(getOwnPropertyPath(source, 'items[0]["display-name"]')).toBe('Ada');
    expect(parsePropertyPath('[0].name')).toEqual(['0', 'name']);
  });

  it('supports null-prototype records', () => {
    const source = Object.create(null) as Record<string, unknown>;
    source.child = Object.assign(Object.create(null), { value: 7 });
    expect(getOwnPropertyPath(source, 'child.value')).toBe(7);
  });

  it('does not traverse inherited properties', () => {
    const source = Object.create({ inherited: 'secret' }) as Record<string, unknown>;
    source.own = 'safe';
    expect(resolveOwnPropertyPath(source, 'inherited')).toEqual({ found: false, value: undefined });
    expect(getOwnPropertyPath(source, 'own')).toBe('safe');
  });

  it('does not invoke getters unless explicitly enabled', () => {
    const getter = vi.fn(() => 42);
    const source = Object.defineProperty({}, 'value', { enumerable: true, get: getter });
    expect(getOwnPropertyPath(source, 'value')).toBeUndefined();
    expect(getter).not.toHaveBeenCalled();
    expect(getOwnPropertyPath(source, 'value', { allowAccessors: true })).toBe(42);
    expect(getter).toHaveBeenCalledOnce();
  });

  it('rejects direct and accessor endpoints that resolve to protected prototypes', () => {
    expect(() => getOwnPropertyPath({ endpoint: Object.prototype }, 'endpoint'))
      .toThrow(UnsafePropertyPathError);
    const source = Object.defineProperty({}, 'endpoint', {
      enumerable: true,
      get: () => Function.prototype,
    });
    expect(() => getOwnPropertyPath(source, 'endpoint', { allowAccessors: true }))
      .toThrow(UnsafePropertyPathError);
  });

  it.each([
    '__proto__.polluted',
    'constructor.prototype',
    'safe.prototype.value',
    '.leading',
    'trailing.',
    'two..dots',
    'a[not-numeric]',
    'a.[0]',
    '',
  ])('rejects unsafe or malformed path %j', path => {
    expect(() => getOwnPropertyPath({}, path)).toThrow(UnsafePropertyPathError);
  });

  it('enforces maximum path depth', () => {
    expect(() => getOwnPropertyPath({ a: { b: 1 } }, 'a.b', { maxDepth: 1 }))
      .toThrow(UnsafePropertyPathError);
  });
});
