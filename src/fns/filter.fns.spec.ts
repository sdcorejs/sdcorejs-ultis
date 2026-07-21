import { describe, it, expect } from 'vitest';
import { FilterUtilities } from './filter.fns';
import { DateUtilities } from './date.fns';
import { DateRelative, Filter, MatchOptions } from '../models/filter.model';

// ─────────────────────────────────────────────────────────────────────────────
// Fixture — a single product whose fields cover every value shape the evaluator
// must handle: primitives, arrays, nested paths, an ISO date string, a date as a
// millisecond timestamp, a date as a SECONDS timestamp, a falsy-but-present value
// (stock: 0), a numeric-looking string (sku), and an explicit null.
// ─────────────────────────────────────────────────────────────────────────────

interface Vendor {
  country: string;
  since: string; // ISO date
}

interface Product {
  name: string;
  sku: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  active: boolean;
  tags: string[];
  createdAt: string; // ISO date string
  updatedAtMs: number; // date as millisecond epoch
  seenAtSec: number; // date as SECOND epoch
  deletedAt: string | null;
  vendor: Vendor;
}

const ISO_2020 = '2020-01-01';
const MS_2020 = new Date(ISO_2020).getTime();
const SEC_2020 = Math.floor(MS_2020 / 1000);

const product: Product = {
  name: 'iPhone 15',
  sku: '007',
  price: 1000,
  cost: 700,
  category: 'electronics',
  stock: 0,
  active: true,
  tags: ['phone', 'apple'],
  createdAt: '2025-01-15',
  updatedAtMs: MS_2020,
  seenAtSec: SEC_2020,
  deletedAt: null,
  vendor: { country: 'VN', since: '2010-05-20' },
};

/** Convenience: run a filter list against the shared fixture. */
const match = (filters: Filter<Product>[], options?: MatchOptions<Product>) =>
  FilterUtilities.match(filters, product, options);

const DAY = 24 * 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════════════
// 1. toEpoch — pure date normalization (the heart of timestamp handling)
// ═══════════════════════════════════════════════════════════════════════════

describe('FilterUtilities.toEpoch', () => {
  it('returns null for null / undefined', () => {
    expect(FilterUtilities.toEpoch(null)).toBeNull();
    expect(FilterUtilities.toEpoch(undefined)).toBeNull();
  });

  it('Date instance → getTime()', () => {
    const d = new Date(ISO_2020);
    expect(FilterUtilities.toEpoch(d)).toBe(MS_2020);
  });

  it('invalid Date → null', () => {
    expect(FilterUtilities.toEpoch(new Date('not-a-date'))).toBeNull();
  });

  it('millisecond number is kept as-is', () => {
    expect(FilterUtilities.toEpoch(MS_2020, { timestampUnit: 'milliseconds' })).toBe(MS_2020);
  });

  it('second number is scaled to milliseconds', () => {
    expect(FilterUtilities.toEpoch(SEC_2020, { timestampUnit: 'seconds' })).toBe(MS_2020);
  });

  it('numeric string is treated as a timestamp', () => {
    expect(FilterUtilities.toEpoch(String(MS_2020), { timestampUnit: 'milliseconds' })).toBe(MS_2020);
    expect(FilterUtilities.toEpoch(String(SEC_2020), { timestampUnit: 'seconds' })).toBe(MS_2020);
  });

  it('ISO date string → epoch', () => {
    expect(FilterUtilities.toEpoch(ISO_2020)).toBe(DateUtilities.parseLocalDateStrict(ISO_2020).getTime());
    expect(FilterUtilities.toEpoch('2025-01-15')).toBe(DateUtilities.parseLocalDateStrict('2025-01-15').getTime());
  });

  it('unparseable string → null', () => {
    expect(FilterUtilities.toEpoch('hello world')).toBeNull();
  });

  it('all four representations of the same instant collapse to one value', () => {
    const all = [
      FilterUtilities.toEpoch(new Date(MS_2020)),
      FilterUtilities.toEpoch('2020-01-01T00:00:00.000Z'),
      FilterUtilities.toEpoch(MS_2020, { timestampUnit: 'milliseconds' }),
      FilterUtilities.toEpoch(SEC_2020, { timestampUnit: 'seconds' }),
    ];
    expect(new Set(all).size).toBe(1);
    expect(all[0]).toBe(MS_2020);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. relativeDate / resolveRelativeDate / resolveData / guard
// ═══════════════════════════════════════════════════════════════════════════

describe('FilterUtilities.relativeDate (constructor)', () => {
  it('builds a DateRelative literal', () => {
    expect(FilterUtilities.relativeDate(3, 'previous', 'day')).toEqual<DateRelative>({
      amount: 3,
      direction: 'previous',
      unit: 'day',
    });
  });
});

describe('FilterUtilities.isDateRelative (guard)', () => {
  it('true for a well-formed spec', () => {
    expect(FilterUtilities.isDateRelative({ amount: 1, direction: 'previous', unit: 'day' })).toBe(true);
    expect(FilterUtilities.isDateRelative({ amount: 9, direction: 'next', unit: 'hour' })).toBe(true);
  });
  it('false for primitives / wrong shape', () => {
    expect(FilterUtilities.isDateRelative('TODAY')).toBe(false);
    expect(FilterUtilities.isDateRelative(null)).toBe(false);
    expect(FilterUtilities.isDateRelative(42)).toBe(false);
    expect(FilterUtilities.isDateRelative({ amount: 1, direction: 'sideways', unit: 'day' })).toBe(false);
    expect(FilterUtilities.isDateRelative({ amount: '1', direction: 'next', unit: 'day' })).toBe(false);
    expect(FilterUtilities.isDateRelative({ amount: 1, direction: 'next', unit: 'year' })).toBe(false);
    expect(FilterUtilities.isDateRelative({ amount: 1.5, direction: 'next', unit: 'day' })).toBe(false);
    expect(FilterUtilities.isDateRelative({ amount: Number.MAX_SAFE_INTEGER + 1, direction: 'next', unit: 'day' })).toBe(false);
  });
});

describe('FilterUtilities.resolveRelativeDate', () => {
  it('day/week/month anchor at midnight today', () => {
    const now = new Date(2024, 5, 15, 13, 14, 15, 123);
    for (const unit of ['day', 'week', 'month'] as const) {
      const d = FilterUtilities.resolveRelativeDate({ amount: 1, direction: 'previous', unit }, now);
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
    }
  });

  it('hour anchors at "now" (carries a time-of-day)', () => {
    const now = new Date(2024, 5, 15, 13, 14, 15, 123);
    const back = FilterUtilities.resolveRelativeDate({ amount: 5, direction: 'previous', unit: 'hour' }, now);
    const fwd = FilterUtilities.resolveRelativeDate({ amount: 5, direction: 'next', unit: 'hour' }, now);
    expect(fwd.getTime() - back.getTime()).toBe(10 * 60 * 60 * 1000);
    expect([back.getMinutes(), back.getSeconds(), back.getMilliseconds()]).toEqual([14, 15, 123]);
    expect([fwd.getMinutes(), fwd.getSeconds(), fwd.getMilliseconds()]).toEqual([14, 15, 123]);
  });

  it('previous is earlier than next for every unit', () => {
    const now = new Date(2024, 5, 15, 13, 14, 15, 123);
    for (const unit of ['hour', 'day', 'week', 'month'] as const) {
      const prev = FilterUtilities.resolveRelativeDate({ amount: 2, direction: 'previous', unit }, now);
      const next = FilterUtilities.resolveRelativeDate({ amount: 2, direction: 'next', unit }, now);
      expect(next.getTime()).toBeGreaterThan(prev.getTime());
    }
  });

  it('week offset is ~7×amount days from today', () => {
    const now = new Date(2024, 5, 15, 13, 14, 15, 123);
    const today = DateUtilities.begin(now)!;
    const oneWeekAgo = FilterUtilities.resolveRelativeDate({ amount: 1, direction: 'previous', unit: 'week' }, now);
    expect(Math.round((today.getTime() - oneWeekAgo.getTime()) / DAY)).toBe(7);
  });
});

describe('FilterUtilities.resolveData', () => {
  it('absolute (or omitted) returns the literal untouched', () => {
    expect(FilterUtilities.resolveData({ field: 'price', operator: 'EQUAL', data: 500 }, product)).toBe(500);
    expect(
      FilterUtilities.resolveData({ field: 'price', operator: 'EQUAL', dataType: 'absolute', data: 500 }, product)
    ).toBe(500);
  });
  it('field reads the other field off the entity', () => {
    expect(
      FilterUtilities.resolveData({ field: 'price', operator: 'EQUAL', dataType: 'field', data: 'cost' }, product)
    ).toBe(700);
  });
  it('date-today resolves to a midnight Date', () => {
    const d = FilterUtilities.resolveData(
      { field: 'createdAt', operator: 'EQUAL', dataType: 'date-today', data: 'TODAY' },
      product
    ) as Date;
    expect(d).toBeInstanceOf(Date);
    expect(d.getHours()).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Single-value operators — absolute literal (dataType omitted)
// ═══════════════════════════════════════════════════════════════════════════

describe('operators — equality', () => {
  it('EQUAL string / number / boolean', () => {
    expect(match([{ field: 'category', operator: 'EQUAL', data: 'electronics' }])).toBe(true);
    expect(match([{ field: 'price', operator: 'EQUAL', data: 1000 }])).toBe(true);
    expect(match([{ field: 'active', operator: 'EQUAL', data: true }])).toBe(true);
    expect(match([{ field: 'category', operator: 'EQUAL', data: 'food' }])).toBe(false);
  });
  it('EQUAL matches an explicit null field', () => {
    expect(match([{ field: 'deletedAt', operator: 'EQUAL', data: null }])).toBe(true);
  });
  it('NOT_EQUAL', () => {
    expect(match([{ field: 'category', operator: 'NOT_EQUAL', data: 'food' }])).toBe(true);
    expect(match([{ field: 'category', operator: 'NOT_EQUAL', data: 'electronics' }])).toBe(false);
  });
});

describe('operators — ordering (number)', () => {
  it('GREATER_THAN / LESS_THAN', () => {
    expect(match([{ field: 'price', operator: 'GREATER_THAN', data: 500 }])).toBe(true);
    expect(match([{ field: 'price', operator: 'GREATER_THAN', data: 1000 }])).toBe(false);
    expect(match([{ field: 'price', operator: 'LESS_THAN', data: 1500 }])).toBe(true);
  });
  it('GREATER_OR_EQUAL / LESS_OR_EQUAL respect the boundary', () => {
    expect(match([{ field: 'price', operator: 'GREATER_OR_EQUAL', data: 1000 }])).toBe(true);
    expect(match([{ field: 'price', operator: 'LESS_OR_EQUAL', data: 1000 }])).toBe(true);
    expect(match([{ field: 'price', operator: 'GREATER_OR_EQUAL', data: 1001 }])).toBe(false);
  });
  it('ordering against a missing field is false (not a throw)', () => {
    expect(match([{ field: 'vendor.rating' as any, operator: 'GREATER_THAN', data: 0 }])).toBe(false);
  });
});

describe('operators — string family (case-insensitive)', () => {
  it('CONTAIN / NOT_CONTAIN', () => {
    expect(match([{ field: 'name', operator: 'CONTAIN', data: 'PHONE' }])).toBe(true);
    expect(match([{ field: 'name', operator: 'CONTAIN', data: 'samsung' }])).toBe(false);
    expect(match([{ field: 'name', operator: 'NOT_CONTAIN', data: 'samsung' }])).toBe(true);
  });
  it('START_WITH / NOT_START_WITH', () => {
    expect(match([{ field: 'name', operator: 'START_WITH', data: 'iphone' }])).toBe(true);
    expect(match([{ field: 'name', operator: 'NOT_START_WITH', data: 'samsung' }])).toBe(true);
  });
  it('END_WITH / NOT_END_WITH', () => {
    expect(match([{ field: 'name', operator: 'END_WITH', data: '15' }])).toBe(true);
    expect(match([{ field: 'name', operator: 'NOT_END_WITH', data: 'pro' }])).toBe(true);
  });
});

describe('operators — IN / NOT_IN', () => {
  it('IN membership', () => {
    expect(match([{ field: 'category', operator: 'IN', data: ['electronics', 'food'] }])).toBe(true);
    expect(match([{ field: 'category', operator: 'IN', data: ['food', 'toys'] }])).toBe(false);
  });
  it('NOT_IN', () => {
    expect(match([{ field: 'category', operator: 'NOT_IN', data: ['food'] }])).toBe(true);
    expect(match([{ field: 'category', operator: 'NOT_IN', data: ['electronics'] }])).toBe(false);
  });
});

describe('operators — NULL / NOT_NULL', () => {
  it('NULL is true for null and for a missing path', () => {
    expect(match([{ field: 'deletedAt', operator: 'NULL' }])).toBe(true);
    expect(match([{ field: 'vendor.phone' as any, operator: 'NULL' }])).toBe(true);
  });
  it('NOT_NULL is true for any present value — including falsy 0', () => {
    expect(match([{ field: 'name', operator: 'NOT_NULL' }])).toBe(true);
    expect(match([{ field: 'stock', operator: 'NOT_NULL' }])).toBe(true); // 0 is present
    expect(match([{ field: 'deletedAt', operator: 'NOT_NULL' }])).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Nested paths
// ═══════════════════════════════════════════════════════════════════════════

describe('nested dot-path fields', () => {
  it('reads vendor.country', () => {
    expect(match([{ field: 'vendor.country', operator: 'EQUAL', data: 'VN' }])).toBe(true);
    expect(match([{ field: 'vendor.country', operator: 'EQUAL', data: 'US' }])).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. BETWEEN
// ═══════════════════════════════════════════════════════════════════════════

describe('BETWEEN', () => {
  it('numeric inclusive range', () => {
    expect(match([{ field: 'price', operator: 'BETWEEN', data: { from: 500, to: 1500 } }])).toBe(true);
    expect(match([{ field: 'price', operator: 'BETWEEN', data: { from: 1000, to: 1000 } }])).toBe(true); // inclusive
    expect(match([{ field: 'price', operator: 'BETWEEN', data: { from: 1001, to: 2000 } }])).toBe(false);
  });
  it('ISO date-string range (heuristic date detection)', () => {
    expect(match([{ field: 'createdAt', operator: 'BETWEEN', data: { from: '2025-01-01', to: '2025-12-31' } }])).toBe(true);
    expect(match([{ field: 'createdAt', operator: 'BETWEEN', data: { from: '2024-01-01', to: '2024-12-31' } }])).toBe(false);
  });
  it('null field is never in range', () => {
    expect(match([{ field: 'deletedAt', operator: 'BETWEEN', data: { from: 'a', to: 'z' } }])).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. dataType: 'field' — field-to-field comparison
// ═══════════════════════════════════════════════════════════════════════════

describe('dataType field — compare two fields', () => {
  it('price > cost', () => {
    expect(match([{ field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' }])).toBe(true);
    expect(match([{ field: 'cost', operator: 'GREATER_THAN', dataType: 'field', data: 'price' }])).toBe(false);
  });
  it('price != cost', () => {
    expect(match([{ field: 'price', operator: 'NOT_EQUAL', dataType: 'field', data: 'cost' }])).toBe(true);
  });
  it('field-to-field on dates needs the date hint', () => {
    // updatedAtMs(2020) < createdAt(2025) — both must be coerced as dates.
    expect(
      match([{ field: 'updatedAtMs', operator: 'LESS_THAN', dataType: 'field', data: 'createdAt' }], {
        fieldTypes: { updatedAtMs: 'date', createdAt: 'date' },
        timestampUnits: { updatedAtMs: 'milliseconds' },
      })
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. dataType: 'date-today' / 'date-relative'
// ═══════════════════════════════════════════════════════════════════════════

describe('dataType date-today / date-relative', () => {
  it('createdAt is before today', () => {
    expect(match([{ field: 'createdAt', operator: 'LESS_THAN', dataType: 'date-today', data: 'TODAY' }])).toBe(true);
  });
  it('createdAt sits inside a very wide relative window', () => {
    expect(
      match([
        { field: 'createdAt', operator: 'GREATER_OR_EQUAL', dataType: 'date-relative', data: { amount: 600, direction: 'previous', unit: 'month' } },
        { field: 'createdAt', operator: 'LESS_OR_EQUAL', dataType: 'date-relative', data: { amount: 600, direction: 'next', unit: 'month' } },
      ])
    ).toBe(true);
  });
  it('an obviously stale "last 7 days" window excludes a 2025 record', () => {
    expect(
      match([{ field: 'createdAt', operator: 'GREATER_OR_EQUAL', dataType: 'date-relative', data: { amount: 7, direction: 'previous', unit: 'day' } }])
    ).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. Type-aware coercion — the "client doesn't know the type" problem
// ═══════════════════════════════════════════════════════════════════════════

describe('type-aware coercion', () => {
  it('ms-timestamp date field auto-coerces when the operand is a date', () => {
    // No schema: dataType date-* makes the field a date → ms kept, compares correctly.
    expect(match(
      [{ field: 'updatedAtMs', operator: 'LESS_OR_EQUAL', dataType: 'date-today', data: 'TODAY' }],
      { timestampUnits: { updatedAtMs: 'milliseconds' } },
    )).toBe(true);
    expect(
      match(
        [{ field: 'updatedAtMs', operator: 'GREATER_OR_EQUAL', dataType: 'date-relative', data: { amount: 1200, direction: 'previous', unit: 'month' } }],
        { timestampUnits: { updatedAtMs: 'milliseconds' } },
      )
    ).toBe(true);
  });

  it('ms timestamp vs ISO literal — Date-like literal still needs the hint', () => {
    expect(
      match([{ field: 'updatedAtMs', operator: 'LESS_THAN', data: '2021-01-01' }], {
        fieldTypes: { updatedAtMs: 'date' },
        timestampUnits: { updatedAtMs: 'milliseconds' },
      })
    ).toBe(true);
  });

  it('SECONDS timestamp requires the fieldTypes hint', () => {
    expect(
      match([{ field: 'seenAtSec', operator: 'LESS_OR_EQUAL', dataType: 'date-today', data: 'TODAY' }], {
        fieldTypes: { seenAtSec: 'date' },
        timestampUnits: { seenAtSec: 'seconds' },
      })
    ).toBe(true);
  });

  it("fieldTypes 'number' makes a numeric-string field compare numerically", () => {
    // sku = '007'; without a hint '007' !== 7, with the hint Number('007') === 7.
    expect(match([{ field: 'sku', operator: 'EQUAL', data: 7 }])).toBe(false);
    expect(match([{ field: 'sku', operator: 'EQUAL', data: 7 }], { fieldTypes: { sku: 'number' } })).toBe(true);
  });

  it("fieldTypes 'string' suppresses date heuristic on a date-looking code", () => {
    // createdAt compared with CONTAIN as a plain string still works either way; here we
    // assert string coercion keeps EQUAL textual.
    expect(match([{ field: 'createdAt', operator: 'EQUAL', data: '2025-01-15' }], { fieldTypes: { createdAt: 'string' } })).toBe(true);
  });

  it('unparseable date on either side → ordering is false, never a throw', () => {
    expect(match([{ field: 'name', operator: 'GREATER_THAN', data: '2020-01-01' }], { fieldTypes: { name: 'date' } })).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. AND / OR composition (incl. deep nesting + options threading)
// ═══════════════════════════════════════════════════════════════════════════

describe('AND / OR composition', () => {
  it('AND requires all children', () => {
    expect(
      match([{ operator: 'AND', data: [
        { field: 'category', operator: 'EQUAL', data: 'electronics' },
        { field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' },
      ] }])
    ).toBe(true);
    expect(
      match([{ operator: 'AND', data: [
        { field: 'category', operator: 'EQUAL', data: 'electronics' },
        { field: 'price', operator: 'GREATER_THAN', data: 9999 },
      ] }])
    ).toBe(false);
  });

  it('OR requires any child', () => {
    expect(
      match([{ operator: 'OR', data: [
        { field: 'category', operator: 'EQUAL', data: 'food' },
        { field: 'price', operator: 'GREATER_THAN', data: 500 },
      ] }])
    ).toBe(true);
    expect(
      match([{ operator: 'OR', data: [
        { field: 'category', operator: 'EQUAL', data: 'food' },
        { field: 'price', operator: 'GREATER_THAN', data: 5000 },
      ] }])
    ).toBe(false);
  });

  it('nested AND inside OR', () => {
    expect(
      match([{ operator: 'OR', data: [
        { operator: 'AND', data: [
          { field: 'category', operator: 'EQUAL', data: 'food' },
          { field: 'price', operator: 'GREATER_THAN', data: 1 },
        ] },
        { operator: 'AND', data: [
          { field: 'category', operator: 'EQUAL', data: 'electronics' },
          { field: 'active', operator: 'EQUAL', data: true },
        ] },
      ] }])
    ).toBe(true);
  });

  it('options propagate into nested groups (seconds timestamp inside an AND)', () => {
    expect(
      match([{ operator: 'AND', data: [
        { field: 'active', operator: 'EQUAL', data: true },
        { field: 'seenAtSec', operator: 'LESS_OR_EQUAL', dataType: 'date-today', data: 'TODAY' },
      ] }], {
        fieldTypes: { seenAtSec: 'date' },
        timestampUnits: { seenAtSec: 'seconds' },
      })
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. Top-level match() semantics
// ═══════════════════════════════════════════════════════════════════════════

describe('match() — list semantics', () => {
  it('top-level array is implicit AND', () => {
    expect(match([
      { field: 'category', operator: 'EQUAL', data: 'electronics' },
      { field: 'name', operator: 'CONTAIN', data: 'phone' },
    ])).toBe(true);
    expect(match([
      { field: 'category', operator: 'EQUAL', data: 'electronics' },
      { field: 'name', operator: 'CONTAIN', data: 'food' },
    ])).toBe(false);
  });

  it('empty / missing filter list matches everything', () => {
    expect(FilterUtilities.match([], product)).toBe(true);
    expect(FilterUtilities.match(undefined as any, product)).toBe(true);
  });

  it('works as an Array.prototype.filter predicate', () => {
    const rows: Product[] = [product, { ...product, category: 'food' }, { ...product, price: 50 }];
    const cheapElectronics = rows.filter(r =>
      FilterUtilities.match([
        { field: 'category', operator: 'EQUAL', data: 'electronics' },
        { field: 'price', operator: 'LESS_THAN', data: 500 },
      ], r)
    );
    expect(cheapElectronics).toHaveLength(1);
    expect(cheapElectronics[0].price).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. Sanity — fixture timestamps really represent the same instant
// ═══════════════════════════════════════════════════════════════════════════

describe('fixture sanity', () => {
  it('ms / sec timestamps and the ISO anchor agree', () => {
    expect(MS_2020).toBe(new Date(ISO_2020).getTime());
    expect(SEC_2020 * 1000).toBe(MS_2020);
    expect(DateUtilities.isDate(ISO_2020)).toBe(true);
  });
});
