import { describe, expect, it } from 'vitest';
import { FilterValidationError, UnsafePropertyPathError } from '../errors';
import { Filter } from '../models/filter.model';
import { FilterUtilities } from './filter.fns';

describe('strict filter validation and coercion', () => {
  it('parses only exact boolean literals and rejects malformed definitions', () => {
    expect(FilterUtilities.evaluateFilter(
      { active: false },
      { field: 'active', operator: 'EQUAL', data: 'false' },
      { fieldTypes: { active: 'boolean' } },
    )).toBe(true);

    expect(FilterUtilities.evaluateFilter(
      { active: '0' },
      { field: 'active', operator: 'EQUAL', data: false },
      { fieldTypes: { active: 'boolean' } },
    )).toBe(false);

    expect(() => FilterUtilities.validateFilter(
      { field: 'active', operator: 'EQUAL', data: '0' },
      { fieldTypes: { active: 'boolean' } },
    )).toThrow(FilterValidationError);
  });

  it.each(['', ' ', '0x10'])('treats invalid numeric entity value %j as a non-match', value => {
    expect(FilterUtilities.evaluateFilter(
      { count: value },
      { field: 'count', operator: 'EQUAL', data: 0 },
      { fieldTypes: { count: 'number' } },
    )).toBe(false);
  });

  it.each(['', ' ', '0x10'])('rejects invalid numeric definition operand %j', value => {
    expect(() => FilterUtilities.validateFilter(
      { field: 'count', operator: 'NOT_EQUAL', data: value },
      { fieldTypes: { count: 'number' } },
    )).toThrow(FilterValidationError);
  });

  it.each([NaN, Infinity, -Infinity])('rejects non-finite definition operand %s', value => {
    expect(() => FilterUtilities.validateFilter({ field: 'count', operator: 'EQUAL', data: value }))
      .toThrow(FilterValidationError);
  });

  it('treats an invalid entity date as a non-match and rejects an invalid date operand', () => {
    const options = { fieldTypes: { createdAt: 'date' as const } };
    expect(FilterUtilities.evaluateFilter(
      { createdAt: '2024-02-30' },
      { field: 'createdAt', operator: 'EQUAL', data: '2024-02-29' },
      options,
    )).toBe(false);
    expect(() => FilterUtilities.validateFilter(
      { field: 'createdAt', operator: 'EQUAL', data: '2024-02-30' },
      options,
    )).toThrow(FilterValidationError);
  });

  it('requires explicit units for numeric timestamps, including old and negative values', () => {
    const before2001Ms = Date.UTC(1999, 11, 31);
    const before1970Ms = -86_400_000;

    expect(FilterUtilities.toEpoch(before2001Ms)).toBeNull();
    expect(FilterUtilities.toEpoch(before2001Ms, { timestampUnit: 'milliseconds' })).toBe(before2001Ms);
    expect(FilterUtilities.toEpoch(before1970Ms, { timestampUnit: 'milliseconds' })).toBe(before1970Ms);
    expect(FilterUtilities.toEpoch(-86_400, { timestampUnit: 'seconds' })).toBe(before1970Ms);
    expect(FilterUtilities.toEpoch(before2001Ms, { legacyTimestampInference: true })).toBe(before2001Ms * 1000);

    const filter = { field: 'createdAt', operator: 'EQUAL', data: '1999-12-31T00:00:00.000Z' };
    expect(FilterUtilities.evaluateFilter(
      { createdAt: before2001Ms },
      filter,
      { fieldTypes: { createdAt: 'date' } },
    )).toBe(false);
    expect(FilterUtilities.evaluateFilter(
      { createdAt: before2001Ms },
      filter,
      { fieldTypes: { createdAt: 'date' }, timestampUnits: { createdAt: 'milliseconds' } },
    )).toBe(true);
  });

  it('rejects whitespace around date and numeric timestamp strings', () => {
    expect(FilterUtilities.toEpoch(' 2024-01-01')).toBeNull();
    expect(FilterUtilities.toEpoch('1704067200 ', { timestampUnit: 'seconds' })).toBeNull();
  });

  it.each([1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects unsafe relative-date amount %s during validation',
    amount => {
      expect(() => FilterUtilities.validateFilter({
        field: 'createdAt',
        operator: 'GREATER_OR_EQUAL',
        dataType: 'date-relative',
        data: { amount, direction: 'previous', unit: 'day' },
      })).toThrow(FilterValidationError);
    },
  );
});

describe('filter operand shapes', () => {
  it('keeps membership and scalar operand shapes discriminated at compile time', () => {
    interface Row { value: number; choices: number[] }
    // @ts-expect-error IN with absolute data requires an array.
    const invalidMembership: Filter<Row> = { field: 'value', operator: 'IN', data: 1 };
    // @ts-expect-error EQUAL with absolute data requires a scalar.
    const invalidScalar: Filter<Row> = { field: 'value', operator: 'EQUAL', data: [1] };
    // @ts-expect-error date-relative is scalar and cannot use a membership operator.
    const invalidRelative: Filter<Row> = { field: 'value', operator: 'IN', dataType: 'date-relative', data: { amount: 1, direction: 'previous', unit: 'day' } };
    const validFieldMembership: Filter<Row> = {
      field: 'value',
      operator: 'IN',
      dataType: 'field',
      data: 'choices',
    };

    expect([invalidMembership, invalidScalar, invalidRelative, validFieldMembership]).toHaveLength(4);
  });

  it.each(['IN', 'NOT_IN'] as const)('rejects malformed %s data', operator => {
    expect(() => FilterUtilities.validateFilter({ field: 'status', operator, data: 'active' }))
      .toThrow(FilterValidationError);
  });

  it.each(['IN', 'NOT_IN'] as const)('rejects scalar date data for %s', operator => {
    expect(() => FilterUtilities.validateFilter({
      field: 'createdAt',
      operator,
      dataType: 'date-today',
      data: 'TODAY',
    })).toThrow(FilterValidationError);
    expect(() => FilterUtilities.validateFilter({
      field: 'createdAt',
      operator,
      dataType: 'date-relative',
      data: { amount: 1, direction: 'previous', unit: 'day' },
    })).toThrow(FilterValidationError);
  });

  it('allows IN to resolve an array through an explicit field reference', () => {
    expect(FilterUtilities.evaluateFilter(
      { value: 2, choices: [1, 2] },
      { field: 'value', operator: 'IN', dataType: 'field', data: 'choices' },
      { fieldTypes: { value: 'number' } },
    )).toBe(true);
  });

  it('rejects malformed, non-comparable, and reversed BETWEEN bounds', () => {
    expect(() => FilterUtilities.validateFilter({ field: 'score', operator: 'BETWEEN', data: [1, 2] }))
      .toThrow(FilterValidationError);
    expect(() => FilterUtilities.validateFilter({ field: 'score', operator: 'BETWEEN', data: { from: 2 } }))
      .toThrow(FilterValidationError);
    expect(() => FilterUtilities.validateFilter({ field: 'score', operator: 'BETWEEN', data: { from: 2, to: 1 } }))
      .toThrow(FilterValidationError);
    expect(() => FilterUtilities.validateFilter({ field: 'score', operator: 'BETWEEN', data: { from: '10', to: '2' } }))
      .toThrow(FilterValidationError);
    expect(() => FilterUtilities.validateFilter({ field: 'createdAt', operator: 'BETWEEN', data: { from: '2024-02-30', to: '2024-03-01' } }))
      .toThrow(FilterValidationError);
    expect(() => FilterUtilities.validateFilter({ field: 'enabled', operator: 'BETWEEN', data: { from: false, to: true } }))
      .toThrow(FilterValidationError);
    expect(() => FilterUtilities.validateFilter(
      { field: 'score', operator: 'BETWEEN', data: { from: 'one', to: 2 } },
      { fieldTypes: { score: 'number' } },
    )).toThrow(FilterValidationError);
  });

  it('does not let an invalid NOT_IN entity value become a match', () => {
    expect(FilterUtilities.evaluateFilter(
      { count: 'not-a-number' },
      { field: 'count', operator: 'NOT_IN', data: [1, 2] },
      { fieldTypes: { count: 'number' } },
    )).toBe(false);
  });
});

describe('filter graph validation', () => {
  it('supports nested AND/OR filters within the configured depth', () => {
    const filter: Filter<{ status: string; active: boolean }> = {
      operator: 'AND',
      data: [
        { field: 'active', operator: 'EQUAL', data: true },
        {
          operator: 'OR',
          data: [
            { field: 'status', operator: 'EQUAL', data: 'ready' },
            { field: 'status', operator: 'EQUAL', data: 'pending' },
          ],
        },
      ],
    };
    expect(FilterUtilities.evaluateFilter({ status: 'ready', active: true }, filter)).toBe(true);
  });

  it('rejects excessive logical depth', () => {
    const filter = {
      operator: 'AND',
      data: [{ operator: 'OR', data: [{ field: 'value', operator: 'EQUAL', data: 1 }] }],
    };
    expect(() => FilterUtilities.validateFilter(filter, { maxDepth: 1 })).toThrow(FilterValidationError);
  });

  it('rejects cyclic in-memory filter graphs', () => {
    const filter: { operator: string; data: unknown[] } = { operator: 'AND', data: [] };
    filter.data.push(filter);
    expect(() => FilterUtilities.validateFilter(filter)).toThrow(FilterValidationError);
  });

  it('rejects accessor-based filter definitions without invoking them', () => {
    let calls = 0;
    const filter = { field: 'value', data: 1 } as Record<string, unknown>;
    Object.defineProperty(filter, 'operator', {
      get: () => {
        calls++;
        return 'EQUAL';
      },
    });
    expect(() => FilterUtilities.validateFilter(filter)).toThrow(FilterValidationError);
    expect(calls).toBe(0);
  });

  it('rejects sparse, accessor-backed, and expanded filter arrays without invoking accessors', () => {
    const sparseChildren = new Array(1);
    expect(() => FilterUtilities.validateFilter({ operator: 'AND', data: sparseChildren }))
      .toThrow(FilterValidationError);

    let calls = 0;
    const accessorMembers: unknown[] = [];
    Object.defineProperty(accessorMembers, '0', {
      configurable: true,
      get: () => {
        calls++;
        return 1;
      },
    });
    expect(() => FilterUtilities.validateFilter({ field: 'value', operator: 'IN', data: accessorMembers }))
      .toThrow(FilterValidationError);
    expect(calls).toBe(0);

    const expanded = [1] as number[] & { note?: string };
    expanded.note = 'untrusted metadata';
    expect(() => FilterUtilities.validateFilter({ field: 'value', operator: 'IN', data: expanded }))
      .toThrow(FilterValidationError);
  });

  it('rejects sparse top-level filter lists instead of treating them as match-all', () => {
    const filters = new Array(1) as Filter<{ value: number }>[];
    expect(() => FilterUtilities.match(filters, { value: 1 })).toThrow(FilterValidationError);
  });
});

describe('safe filter field traversal', () => {
  it('does not match inherited fields', () => {
    const entity = Object.create({ role: 'admin' }) as { role?: string };
    expect(FilterUtilities.evaluateFilter(entity, { field: 'role', operator: 'EQUAL', data: 'admin' })).toBe(false);
  });

  it('does not invoke entity getters', () => {
    let calls = 0;
    const entity: Record<string, unknown> = {};
    Object.defineProperty(entity, 'role', {
      get: () => {
        calls++;
        return 'admin';
      },
    });
    expect(FilterUtilities.evaluateFilter(entity, { field: 'role', operator: 'EQUAL', data: 'admin' })).toBe(false);
    expect(calls).toBe(0);
  });

  it.each(['__proto__.polluted', 'constructor.prototype.polluted', 'prototype.value'])(
    'rejects prototype-sensitive path %s',
    field => {
      expect(() => FilterUtilities.validateFilter({ field, operator: 'EQUAL', data: true }))
        .toThrow(UnsafePropertyPathError);
    },
  );

  it('rejects malformed and over-depth paths', () => {
    expect(() => FilterUtilities.validateFilter({ field: 'user..name', operator: 'EQUAL', data: 'Ada' }))
      .toThrow(UnsafePropertyPathError);
    expect(() => FilterUtilities.validateFilter(
      { field: 'user.profile.name', operator: 'EQUAL', data: 'Ada' },
      { maxPathDepth: 2 },
    )).toThrow(UnsafePropertyPathError);
  });

  it('distinguishes missing paths from null when requested', () => {
    expect(FilterUtilities.evaluateFilter({}, { field: 'deletedAt', operator: 'NULL' })).toBe(true);
    expect(FilterUtilities.evaluateFilter(
      {},
      { field: 'deletedAt', operator: 'NULL' },
      { missingValuePolicy: 'distinct' },
    )).toBe(false);
    expect(FilterUtilities.evaluateFilter(
      { deletedAt: null },
      { field: 'deletedAt', operator: 'NULL' },
      { missingValuePolicy: 'distinct' },
    )).toBe(true);
  });
});

describe('filter API compatibility', () => {
  it('distinguishes a valid false result from a malformed definition', () => {
    expect(FilterUtilities.evaluateFilter(
      { count: 1 },
      { field: 'count', operator: 'EQUAL', data: 2 },
    )).toBe(false);
    expect(() => FilterUtilities.evaluateFilter(
      { count: 1 },
      { field: 'count', operator: 'UNKNOWN', data: 1 },
    )).toThrow(FilterValidationError);
  });

  it('retains the historical evaluate(filter, item) argument order', () => {
    const filter: Filter<{ count: number }> = { field: 'count', operator: 'GREATER_THAN', data: 1 };
    expect(FilterUtilities.evaluate(filter, { count: 2 })).toBe(true);
    expect(FilterUtilities.evaluateFilter({ count: 2 }, filter)).toBe(true);
  });
});
