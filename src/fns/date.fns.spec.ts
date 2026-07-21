import { describe, it, expect } from 'vitest';
import { DateParseError } from '../errors';
import { DateUtilities } from './date.fns';

// ─── isDate ──────────────────────────────────────────────────────────────────

describe('DateUtilities.isDate', () => {
  it('returns true for ISO date string yyyy-MM-dd', () => {
    expect(DateUtilities.isDate('2025-01-15')).toBe(true);
  });

  it('returns true for date string with slashes yyyy/MM/dd', () => {
    expect(DateUtilities.isDate('2025/01/15')).toBe(true);
  });

  it('returns true for date string with time component', () => {
    expect(DateUtilities.isDate('2025-01-15 10:30:00')).toBe(true);
  });

  it('returns true for ISO datetime with T separator', () => {
    expect(DateUtilities.isDate('2025-01-15T10:30:00')).toBe(true);
  });

  it('returns true for a Date object', () => {
    expect(DateUtilities.isDate(new Date('2025-01-15'))).toBe(true);
  });

  it('returns true for a timestamp number', () => {
    expect(DateUtilities.isDate(new Date('2025-01-15').getTime())).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(DateUtilities.isDate('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(DateUtilities.isDate(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(DateUtilities.isDate(undefined)).toBe(false);
  });

  it('returns false for a plain word string', () => {
    expect(DateUtilities.isDate('hello')).toBe(false);
  });

  it('returns false for a string that is too short (< 8 chars)', () => {
    expect(DateUtilities.isDate('abc')).toBe(false);
    expect(DateUtilities.isDate('2025-1')).toBe(false);
  });

  it('returns false for "abc" (8+ chars but not a date pattern)', () => {
    expect(DateUtilities.isDate('abcdefgh')).toBe(false);
  });

  it('returns false for an invalid date string like 2025-99-99', () => {
    // Passes regex d4-d2-d2 but produces an Invalid Date
    expect(DateUtilities.isDate('2025-99-99')).toBe(false);
  });
});

// ─── toFormat ────────────────────────────────────────────────────────────────

describe('DateUtilities.toFormat', () => {
  // Use a fixed UTC-epoch-aligned date to keep tests deterministic across TZs.
  // We pass a string that contains explicit time so local TZ padding is consistent.
  const base = '2025-06-20T00:00:00'; // midnight local time

  it('returns empty string for invalid input', () => {
    expect(DateUtilities.toFormat('not-a-date', 'yyyy-MM-dd')).toBe('');
    expect(DateUtilities.toFormat(null, 'yyyy-MM-dd')).toBe('');
    expect(DateUtilities.toFormat(undefined, 'yyyy-MM-dd')).toBe('');
    expect(DateUtilities.toFormat('', 'yyyy-MM-dd')).toBe('');
  });

  it('formats with yyyy-MM-dd pattern', () => {
    const result = DateUtilities.toFormat(base, 'yyyy-MM-dd');
    // Should start with the year and contain the month and day
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toContain('2025');
  });

  it('formats with dd/MM/yyyy pattern', () => {
    const result = DateUtilities.toFormat(base, 'dd/MM/yyyy');
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('formats with HH:mm time pattern for a datetime value', () => {
    const result = DateUtilities.toFormat('2025-06-20T14:30:00', 'HH:mm');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('returns format string with tokens replaced (not raw token names)', () => {
    const result = DateUtilities.toFormat(base, 'yyyy-MM-dd');
    expect(result).not.toContain('yyyy');
    expect(result).not.toContain('MM');
    expect(result).not.toContain('dd');
  });

  it('keeps non-token characters in place', () => {
    const result = DateUtilities.toFormat(base, 'yyyy/MM/dd HH:mm:ss');
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

// ─── addDays ─────────────────────────────────────────────────────────────────

describe('DateUtilities.addDays', () => {
  it('adds positive number of days', () => {
    const result = DateUtilities.addDays('2025-01-15', 5) as Date;
    expect(result).toBeInstanceOf(Date);
    expect(result.getDate()).toBe(20);
  });

  it('subtracts days when negative', () => {
    const result = DateUtilities.addDays('2025-01-15', -5) as Date;
    expect(result).toBeInstanceOf(Date);
    expect(result.getDate()).toBe(10);
  });

  it('adds 0 days — same day', () => {
    const original = DateUtilities.parseLocalDateStrict('2025-01-15');
    const result = DateUtilities.addDays('2025-01-15', 0) as Date;
    expect(result.getDate()).toBe(original.getDate());
  });

  it('rolls over month boundary', () => {
    const result = DateUtilities.addDays('2025-01-30', 3) as Date;
    expect(result.getMonth()).toBe(1); // February (0-indexed)
    expect(result.getDate()).toBe(2);
  });

  it('returns null for invalid date input', () => {
    expect(DateUtilities.addDays(null, 5)).toBeNull();
    expect(DateUtilities.addDays(undefined, 5)).toBeNull();
    expect(DateUtilities.addDays('not-a-date', 5)).toBeNull();
  });
});

// ─── addHours ────────────────────────────────────────────────────────────────

describe('DateUtilities.addHours', () => {
  it('adds positive hours', () => {
    const result = DateUtilities.addHours('2025-01-15T10:00:00', 3) as Date;
    expect(result).toBeInstanceOf(Date);
    expect(result.getHours()).toBe(13);
  });

  it('subtracts hours when negative', () => {
    const result = DateUtilities.addHours('2025-01-15T10:00:00', -4) as Date;
    expect(result.getHours()).toBe(6);
  });

  it('rolls over to next day', () => {
    const result = DateUtilities.addHours('2025-01-15T23:00:00', 2) as Date;
    expect(result.getDate()).toBe(16);
    expect(result.getHours()).toBe(1);
  });

  it('returns null for invalid input', () => {
    expect(DateUtilities.addHours(null, 3)).toBeNull();
    expect(DateUtilities.addHours('invalid', 3)).toBeNull();
  });
});

// ─── addMonths ───────────────────────────────────────────────────────────────

describe('DateUtilities.addMonths', () => {
  it('adds positive months', () => {
    const result = DateUtilities.addMonths('2025-01-15', 3) as Date;
    expect(result).toBeInstanceOf(Date);
    expect(result.getMonth()).toBe(3); // April
  });

  it('subtracts months when negative', () => {
    const result = DateUtilities.addMonths('2025-06-15', -2) as Date;
    expect(result.getMonth()).toBe(3); // April
  });

  it('rolls year forward', () => {
    const result = DateUtilities.addMonths('2025-11-01', 3) as Date;
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1); // February
  });

  it('returns null for invalid input', () => {
    expect(DateUtilities.addMonths(null, 1)).toBeNull();
    expect(DateUtilities.addMonths('not-a-date', 1)).toBeNull();
  });
});

// ─── addMiliseconds ──────────────────────────────────────────────────────────

describe('DateUtilities.addMiliseconds', () => {
  it('adds positive milliseconds', () => {
    const result = DateUtilities.addMiliseconds('2025-01-15T00:00:00.000', 500) as Date;
    expect(result).toBeInstanceOf(Date);
    expect(result.getMilliseconds()).toBe(500);
  });

  it('subtracts milliseconds when negative', () => {
    // 1 second into the day minus 1 ms = 999 ms
    const result = DateUtilities.addMiliseconds('2025-01-15T00:00:01.000', -1) as Date;
    expect(result.getMilliseconds()).toBe(999);
  });

  it('returns null for invalid input', () => {
    expect(DateUtilities.addMiliseconds(null, 100)).toBeNull();
    expect(DateUtilities.addMiliseconds(undefined, 100)).toBeNull();
  });
});

// ─── begin ───────────────────────────────────────────────────────────────────

describe('DateUtilities.begin', () => {
  it('returns midnight (00:00:00.000) local time for a date string', () => {
    const result = DateUtilities.begin('2025-06-20') as Date;
    expect(result).toBeInstanceOf(Date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('strips time component from a datetime string', () => {
    const withTime = DateUtilities.begin('2025-06-20T15:45:00') as Date;
    expect(withTime.getHours()).toBe(0);
    expect(withTime.getSeconds()).toBe(0);
  });

  it('returns null for invalid input', () => {
    expect(DateUtilities.begin(null)).toBeNull();
    expect(DateUtilities.begin('')).toBeNull();
    expect(DateUtilities.begin('not-a-date')).toBeNull();
  });
});

// ─── end ─────────────────────────────────────────────────────────────────────

describe('DateUtilities.end', () => {
  it('returns 23:59:59.999 for a given date (last millisecond of the day)', () => {
    const result = DateUtilities.end('2025-06-20') as Date;
    expect(result).toBeInstanceOf(Date);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it('end is exactly 1ms before start of next day', () => {
    const endOfDay = DateUtilities.end('2025-06-20') as Date;
    const beginNextDay = DateUtilities.begin('2025-06-21') as Date;
    expect(endOfDay.getTime()).toBe(beginNextDay.getTime() - 1);
  });

  it('returns null for invalid input', () => {
    expect(DateUtilities.end(null)).toBeNull();
    expect(DateUtilities.end('bad')).toBeNull();
  });
});

// ─── equal ───────────────────────────────────────────────────────────────────

describe('DateUtilities.equal', () => {
  it('returns true when both dates are identical strings', () => {
    expect(DateUtilities.equal('2025-01-15', '2025-01-15')).toBe(true);
  });

  it('returns true when same date represented as Date objects', () => {
    const d = new Date('2025-01-15');
    expect(DateUtilities.equal(d, d)).toBe(true);
  });

  it('returns false for two different valid dates', () => {
    expect(DateUtilities.equal('2025-01-15', '2025-01-16')).toBe(false);
  });

  it('returns true when BOTH inputs are invalid (both non-dates)', () => {
    // By the source: !isDate(a) && !isDate(b) → true
    expect(DateUtilities.equal(null, null)).toBe(true);
    expect(DateUtilities.equal(undefined, undefined)).toBe(true);
    expect(DateUtilities.equal('', '')).toBe(true);
  });

  it('returns false when only ONE input is invalid', () => {
    expect(DateUtilities.equal(null, '2025-01-15')).toBe(false);
    expect(DateUtilities.equal('2025-01-15', null)).toBe(false);
  });
});

// ─── dayDiff ─────────────────────────────────────────────────────────────────

describe('DateUtilities.dayDiff', () => {
  it('returns positive diff when date2 is after date1', () => {
    expect(DateUtilities.dayDiff('2025-01-10', '2025-01-15')).toBe(5);
  });

  it('returns negative diff when date2 is before date1', () => {
    expect(DateUtilities.dayDiff('2025-01-15', '2025-01-10')).toBe(-5);
  });

  it('returns 0 for the same date', () => {
    expect(DateUtilities.dayDiff('2025-01-15', '2025-01-15')).toBe(0);
  });

  it('handles cross-year boundaries', () => {
    expect(DateUtilities.dayDiff('2024-12-31', '2025-01-01')).toBe(1);
  });

  it('returns null when either input is invalid', () => {
    expect(DateUtilities.dayDiff(null, '2025-01-15')).toBeNull();
    expect(DateUtilities.dayDiff('2025-01-15', null)).toBeNull();
    expect(DateUtilities.dayDiff(null, null)).toBeNull();
  });
});

// ─── monthDiff ───────────────────────────────────────────────────────────────

describe('DateUtilities.monthDiff', () => {
  it('returns positive month count when date2 is later', () => {
    expect(DateUtilities.monthDiff('2025-01-01', '2025-04-01')).toBe(3);
  });

  it('returns negative month count when date2 is earlier', () => {
    expect(DateUtilities.monthDiff('2025-04-01', '2025-01-01')).toBe(-3);
  });

  it('returns 0 for the same month', () => {
    expect(DateUtilities.monthDiff('2025-03-01', '2025-03-31')).toBe(0);
  });

  it('handles cross-year boundaries', () => {
    expect(DateUtilities.monthDiff('2024-11-01', '2025-02-01')).toBe(3);
  });

  it('returns null when either input is invalid', () => {
    expect(DateUtilities.monthDiff(null, '2025-01-01')).toBeNull();
    expect(DateUtilities.monthDiff('2025-01-01', null)).toBeNull();
  });
});

// ─── yearDiff ────────────────────────────────────────────────────────────────

describe('DateUtilities.yearDiff', () => {
  it('returns positive year count when date2 is later', () => {
    expect(DateUtilities.yearDiff('2020-01-01', '2025-01-01')).toBe(5);
  });

  it('returns negative year count when date2 is earlier', () => {
    expect(DateUtilities.yearDiff('2025-01-01', '2020-01-01')).toBe(-5);
  });

  it('returns 0 for dates in the same year', () => {
    expect(DateUtilities.yearDiff('2025-01-01', '2025-12-31')).toBe(0);
  });

  it('returns null when either input is invalid', () => {
    expect(DateUtilities.yearDiff(null, '2025-01-01')).toBeNull();
    expect(DateUtilities.yearDiff('2025-01-01', undefined)).toBeNull();
  });
});

// ─── age ─────────────────────────────────────────────────────────────────────

describe('DateUtilities.age', () => {
  it('returns null when either date is invalid', () => {
    expect(DateUtilities.age(null, '2025-01-01')).toBeNull();
    expect(DateUtilities.age('2000-01-01', null)).toBeNull();
  });

  it('returns ~25 for a birth date 25 years ago (rounded to 2 dp)', () => {
    // 2000-01 to 2025-01 = 300 months => 300/12 = 25.00
    expect(DateUtilities.age('2000-01-01', '2025-01-01')).toBe(25);
  });

  it('rounds fractional months correctly', () => {
    // 2000-01 to 2025-07 = 306 months => 306/12 = 25.5
    expect(DateUtilities.age('2000-01-01', '2025-07-01')).toBe(25.5);
  });

  it('returns 0 for same birth date and reference date', () => {
    expect(DateUtilities.age('2025-01-01', '2025-01-01')).toBe(0);
  });
});

// ─── timeDifference ──────────────────────────────────────────────────────────

describe('DateUtilities.timeDifference', () => {
  // All times fixed to avoid runtime flakiness.
  const current = '2025-06-20T12:00:00';

  it('returns empty string when previous is invalid', () => {
    expect(DateUtilities.timeDifference(null, current)).toBe('');
    expect(DateUtilities.timeDifference('not-a-date', current)).toBe('');
  });

  it('returns empty string when current is invalid', () => {
    expect(DateUtilities.timeDifference('2025-06-20T11:59:30', 'bad')).toBe('');
  });

  it('returns "X seconds ago" when elapsed < 1 minute', () => {
    const previous = '2025-06-20T11:59:30'; // 30 seconds before
    expect(DateUtilities.timeDifference(previous, current)).toBe('30 seconds ago');
  });

  it('returns "X minutes ago" when elapsed is between 1 and 60 minutes', () => {
    const previous = '2025-06-20T11:45:00'; // 15 minutes before
    expect(DateUtilities.timeDifference(previous, current)).toBe('15 minutes ago');
  });

  it('returns "X hours ago" when elapsed is between 1 and 24 hours', () => {
    const previous = '2025-06-20T09:00:00'; // 3 hours before
    expect(DateUtilities.timeDifference(previous, current)).toBe('3 hours ago');
  });

  it('returns "X days ago" when elapsed is between 1 and 30 days', () => {
    const previous = '2025-06-10T12:00:00'; // 10 days before
    expect(DateUtilities.timeDifference(previous, current)).toBe('10 days ago');
  });

  it('returns "X months ago" when elapsed is between 30 and 365 days', () => {
    // ~3 months = 90 days before current
    const previous = '2025-03-21T12:00:00'; // 91 days before — rounds to 3 months
    const result = DateUtilities.timeDifference(previous, current);
    expect(result).toMatch(/^\d+ months ago$/);
  });

  it('returns "X years ago" when elapsed >= 365 days', () => {
    const previous = '2023-06-20T12:00:00'; // 2 years before
    expect(DateUtilities.timeDifference(previous, current)).toBe('2 years ago');
  });
});

describe('DateUtilities strict date contracts', () => {
  it('parses plain dates as local calendar dates without a UTC shift', () => {
    const date = DateUtilities.parseLocalDateStrict('2025-06-20');
    expect([date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours()]).toEqual([2025, 6, 20, 0]);
  });

  it('validates leap years and actual days of month', () => {
    expect(DateUtilities.isValidLocalDate('2024-02-29')).toBe(true);
    expect(DateUtilities.isValidLocalDate('2025-02-29')).toBe(false);
    expect(DateUtilities.isValidLocalDate('2025-02-30')).toBe(false);
    expect(() => DateUtilities.parseLocalDateStrict('02/31/2024', 'MM/dd/yyyy')).toThrow(DateParseError);
  });

  it('rejects booleans, arrays, and coercible objects', () => {
    expect(DateUtilities.isDate(true)).toBe(false);
    expect(DateUtilities.isDate([2025, 1, 1])).toBe(false);
    expect(DateUtilities.isDate({ valueOf: () => 0 })).toBe(false);
  });

  it('distinguishes explicit instants from local date-times', () => {
    expect(DateUtilities.isValidInstant('2025-01-15T10:30:00Z')).toBe(true);
    expect(DateUtilities.isValidInstant('2025-01-15T17:30:00+07:00')).toBe(true);
    expect(DateUtilities.isValidInstant('2025-01-15T10:30:00')).toBe(false);
    expect(DateUtilities.isValidInstant('2025-01-15T10:30:00.1234Z')).toBe(false);
    expect(DateUtilities.parseInstant('2025-01-15T10:30:00Z').getTime())
      .toBe(DateUtilities.parseInstant('2025-01-15T17:30:00+07:00').getTime());
  });

  it('normalizes positive and negative offset instants deterministically', () => {
    expect(DateUtilities.parseInstant('2025-01-15T17:30:00+07:00').toISOString())
      .toBe('2025-01-15T10:30:00.000Z');
    expect(DateUtilities.parseInstant('2025-01-15T05:30:00-05:00').toISOString())
      .toBe('2025-01-15T10:30:00.000Z');
  });

  it('supports instants and calendar dates before 2001 and before 1970', () => {
    expect(DateUtilities.parseInstant(Date.UTC(1999, 0, 1)).getUTCFullYear()).toBe(1999);
    expect(DateUtilities.parseInstant(-1).toISOString()).toBe('1969-12-31T23:59:59.999Z');
    expect(DateUtilities.parseLocalDateStrict('1960-01-02').getDate()).toBe(2);
  });

  it('rejects impossible legacy parseFrom values rather than normalizing', () => {
    expect(DateUtilities.parseFrom('02/31/2025', 'MM/dd/yyyy')).toBeNull();
    expect(DateUtilities.parseFrom('2025-01-01 25:00', 'yyyy-MM-dd HH:mm')).toBeNull();
  });
});

describe('DateUtilities explicit arithmetic contracts', () => {
  it('replaces every repeated formatting token', () => {
    expect(DateUtilities.toFormat('2025-01-15T12:03:04', 'yyyy/yyyy MM-MM dd-dd HH:mm:ss'))
      .toBe('2025/2025 01-01 15-15 12:03:04');
  });

  it('separates calendar-day and elapsed-day calculations', () => {
    const springStart = new Date(2025, 2, 9, 0, 0, 0);
    const springEnd = new Date(2025, 2, 10, 0, 0, 0);
    expect(DateUtilities.calendarDayDifference(springStart, springEnd)).toBe(1);
    expect(DateUtilities.elapsedDayDifference(springStart, springEnd)).toBeGreaterThan(0);
  });

  it('keeps calendar differences stable across spring-forward and fall-back boundaries', () => {
    const springStart = DateUtilities.parseLocalDateStrict('2025-03-09');
    const springEnd = DateUtilities.parseLocalDateStrict('2025-03-10');
    const fallStart = DateUtilities.parseLocalDateStrict('2025-11-02');
    const fallEnd = DateUtilities.parseLocalDateStrict('2025-11-03');

    expect(DateUtilities.calendarDayDifference(springStart, springEnd)).toBe(1);
    expect([23 / 24, 1]).toContain(DateUtilities.elapsedDayDifference(springStart, springEnd));
    expect(DateUtilities.calendarDayDifference(fallStart, fallEnd)).toBe(1);
    expect([1, 25 / 24]).toContain(DateUtilities.elapsedDayDifference(fallStart, fallEnd));
  });

  it('counts the December 31 to January 1 calendar boundary as one day', () => {
    expect(DateUtilities.calendarDayDifference('2024-12-31', '2025-01-01')).toBe(1);
  });

  it('calculates completed and decimal years explicitly', () => {
    expect(DateUtilities.completedYearDifference('2000-06-20', '2025-06-19')).toBe(24);
    expect(DateUtilities.completedYearDifference('2000-06-20', '2025-06-20')).toBe(25);
    expect(DateUtilities.completedYearDifference('2000-02-29', '2025-02-27')).toBe(24);
    expect(DateUtilities.completedYearDifference('2000-02-29', '2025-02-28')).toBe(25);
    expect(DateUtilities.decimalYearDifference('2000-01-01', '2025-07-01')).toBe(25.5);
    expect(DateUtilities.completedAge('2000-06-20', '2025-06-19')).toBe(24);
    expect(DateUtilities.completedAge('2000-02-29', '2025-02-28')).toBe(25);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5, 101])(
    'rejects invalid decimal-year precision %s',
    digits => {
      expect(() => DateUtilities.decimalYearDifference('2000-01-01', '2025-07-01', digits))
        .toThrow(DateParseError);
    },
  );

  it('uses a constrained month overflow by default with explicit alternatives', () => {
    const constrained = DateUtilities.addMonths('2025-01-31T12:00:00', 1);
    const balanced = DateUtilities.addMonths('2025-01-31T12:00:00', 1, { overflow: 'balance' });
    expect([constrained?.getMonth(), constrained?.getDate()]).toEqual([1, 28]);
    expect([balanced?.getMonth(), balanced?.getDate()]).toEqual([2, 3]);
    expect(DateUtilities.addMonths('2025-01-31', 1, { overflow: 'reject' })).toBeNull();
  });

  it('exposes the corrected millisecond spelling and compatibility alias', () => {
    expect(DateUtilities.addMilliseconds('2025-01-01T00:00:00.000', 5)?.getMilliseconds()).toBe(5);
    expect(DateUtilities.addMiliseconds('2025-01-01T00:00:00.000', 5)?.getMilliseconds()).toBe(5);
  });

  it('adds exact elapsed milliseconds across a fall-back DST boundary', () => {
    const before = new Date('2025-11-02T05:59:59.999Z');
    const result = DateUtilities.addMilliseconds(before, 1);

    expect(result?.getTime()).toBe(before.getTime() + 1);
  });

  it('keeps the misspelled compatibility wrapper on its legacy local-clock behavior', () => {
    const before = new Date('2025-11-02T05:59:59.999Z');
    const expected = new Date(before);
    expected.setMilliseconds(expected.getMilliseconds() + 1);

    expect(DateUtilities.addMiliseconds(before, 1)?.getTime()).toBe(expected.getTime());
  });

  it('uses future wording instead of a negative value followed by ago', () => {
    expect(DateUtilities.timeDifference('2025-01-02T00:00:00', '2025-01-01T00:00:00')).toBe('in 1 day');
  });
});
