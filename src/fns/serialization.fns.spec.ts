import { describe, expect, it, vi } from 'vitest';
import {
  CircularReferenceError,
  UnsupportedSerializationTypeError,
} from '../errors';
import {
  canonicalStringify,
  hash,
  hash32,
  sha256Blob,
  sha256Canonical,
  stableStringify,
} from './serialization.fns';

describe('stableStringify strict JSON domain', () => {
  it('sorts object keys recursively and preserves array order', () => {
    expect(stableStringify({ z: 1, nested: { b: 2, a: 1 }, array: [2, 1] }))
      .toBe('{"array":[2,1],"nested":{"a":1,"b":2},"z":1}');
    expect(stableStringify({ b: 2, a: 1 })).toBe(stableStringify({ a: 1, b: 2 }));
  });

  it('retains Date compatibility and JSON negative-zero semantics', () => {
    expect(stableStringify(new Date('2026-01-02T03:04:05.000Z'))).toBe('"2026-01-02T03:04:05.000Z"');
    expect(stableStringify(-0)).toBe('0');
  });

  it.each([
    undefined,
    () => undefined,
    Symbol('x'),
    1n,
    Number.NaN,
    Infinity,
    /x/,
    new Map(),
    new Set(),
    new Uint8Array([1]),
  ])('rejects unsupported value %#', value => {
    expect(() => stableStringify(value)).toThrow(UnsupportedSerializationTypeError);
  });

  it('rejects sparse arrays instead of creating malformed JSON', () => {
    const sparse = new Array(2);
    expect(() => stableStringify(sparse)).toThrow(UnsupportedSerializationTypeError);
  });

  it('rejects accessors without invocation', () => {
    const getter = vi.fn(() => 'secret');
    const value = Object.defineProperty({}, 'secret', { enumerable: true, get: getter });
    expect(() => stableStringify(value)).toThrow(UnsupportedSerializationTypeError);
    expect(getter).not.toHaveBeenCalled();
  });

  it('does not invoke Symbol.toStringTag and rejects ignored array state', () => {
    const tagGetter = vi.fn(() => 'Map');
    const value = Object.defineProperty({ safe: 1 }, Symbol.toStringTag, { get: tagGetter });
    expect(stableStringify(value)).toBe('{"safe":1}');
    expect(tagGetter).not.toHaveBeenCalled();

    const expanded = Object.assign([1], { extra: 2 });
    expect(() => stableStringify(expanded)).toThrow(UnsupportedSerializationTypeError);
  });

  it('rejects cycles with a typed error before stack overflow', () => {
    const value: Record<string, unknown> = {};
    value.self = value;
    expect(() => stableStringify(value)).toThrow(CircularReferenceError);
  });

  it('rejects class instances', () => {
    class Example { value = 1; }
    expect(() => stableStringify(new Example())).toThrow(UnsupportedSerializationTypeError);
  });

  it('serializes large flat records deterministically without a timing threshold', () => {
    const entries = Array.from(
      { length: 5_000 },
      (_, index) => [`key-${String(index).padStart(5, '0')}`, index] as const,
    );
    const forward = Object.fromEntries(entries);
    const reverse = Object.fromEntries([...entries].reverse());
    const encoded = stableStringify(forward);
    expect(encoded).toBe(stableStringify(reverse));
    expect(encoded).toContain('"key-04999":4999');
  });
});

describe('canonicalStringify extended domain', () => {
  it('distinguishes primitive edge cases with unambiguous tags', () => {
    const values = [undefined, null, Number.NaN, Infinity, -Infinity, -0, 0, 1n];
    expect(new Set(values.map(value => canonicalStringify(value))).size).toBe(values.length);
  });

  it('is independent of object, Map, and Set insertion order', () => {
    expect(canonicalStringify({ b: 2, a: 1 })).toBe(canonicalStringify({ a: 1, b: 2 }));
    expect(canonicalStringify(new Map<unknown, unknown>([['b', 2], ['a', 1]])))
      .toBe(canonicalStringify(new Map<unknown, unknown>([['a', 1], ['b', 2]])));
    expect(canonicalStringify(new Set(['b', 'a']))).toBe(canonicalStringify(new Set(['a', 'b'])));
  });

  it('orders by raw code units without localeCompare', () => {
    const localeCompare = vi.spyOn(String.prototype, 'localeCompare').mockImplementation(() => {
      throw new Error('locale-sensitive comparator must not run');
    });
    try {
      expect(() => canonicalStringify(new Map([['ä', 1], ['z', 2]]))).not.toThrow();
      expect(() => canonicalStringify(new Set(['ä', 'z']))).not.toThrow();
    } finally {
      localeCompare.mockRestore();
    }
  });

  it('encodes Date, RegExp, binary data, sparse holes, and BigInt deterministically', () => {
    const value = {
      date: new Date('2026-01-01T00:00:00.000Z'),
      regexp: /a+/gi,
      bytes: new Uint16Array([1, 513]),
      sparse: Object.assign(new Array(2), { 1: 'x' }),
      bigint: 99n,
    };
    const encoded = canonicalStringify(value);
    expect(encoded).toContain('typed-array');
    expect(encoded).toContain('regexp');
    expect(encoded).toContain('hole');
    expect(encoded).toBe(canonicalStringify(value));
  });

  it('cannot collide with user objects that resemble internal tags', () => {
    expect(canonicalStringify(['@sdcorejs/canonical/v1', 'null']))
      .not.toBe(canonicalStringify(null));
  });

  it('rejects enumerable expando and symbol state on arrays and built-ins', () => {
    const array = Object.assign([1], { extra: 2 });
    const map = Object.assign(new Map([['a', 1]]), { extra: 2 });
    const bytes = Object.assign(new Uint8Array([1]), { extra: 2 });
    const date = Object.assign(new Date('2026-01-01T00:00:00.000Z'), { extra: 2 });
    const symbol = Symbol('extra');
    const set = new Set([1]);
    Object.defineProperty(set, symbol, { enumerable: true, value: 2 });
    for (const value of [array, map, bytes, date, set]) {
      expect(() => canonicalStringify(value)).toThrow(UnsupportedSerializationTypeError);
    }
    expect(canonicalStringify([1])).not.toBe(canonicalStringify({ 0: 1 }));
  });

  it('rejects Blob metadata and hashes Blob contents through the async API', async () => {
    const blob = new Blob(['hello']);
    expect(() => canonicalStringify(blob)).toThrow(UnsupportedSerializationTypeError);
    await expect(sha256Blob(blob)).resolves.toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});

describe('hash contracts', () => {
  it('preserves the legacy simple-value hash through the accurate hash32 name', () => {
    expect(hash({ b: 2, a: 1 })).toBe(hash32({ a: 1, b: 2 }));
    expect(hash32({ a: 1, b: 2 })).toMatch(/^h\d+$/);
  });

  it('hashes canonical equivalents to equal SHA-256 digests', async () => {
    await expect(sha256Canonical({ b: new Set([2, 1]), a: 1 }))
      .resolves.toBe(await sha256Canonical({ a: 1, b: new Set([1, 2]) }));
    await expect(sha256Canonical({ a: 2 })).resolves.not.toBe(await sha256Canonical({ a: 1 }));
  });
});
