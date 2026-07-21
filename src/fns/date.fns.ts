import { DateParseError } from '../errors';
import { NumberUtilities } from './number.fns';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const FORMAT_TOKENS = ['yyyy', 'MM', 'dd', 'HH', 'mm', 'ss'] as const;
type FormatToken = (typeof FORMAT_TOKENS)[number];

/** Controls how adding calendar months handles a day absent from the target month. */
export interface AddMonthsOptions {
  /** `constrain` clamps to month end, `balance` rolls forward, and `reject` returns `null`. */
  overflow?: 'constrain' | 'balance' | 'reject';
}

const isLeapYear = (year: number): boolean => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const daysInMonth = (year: number, month: number): number => {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

const validOrNull = (value: Date): Date | null => Number.isFinite(value.getTime()) ? value : null;

const utcCalendarEpoch = (value: Date): number => {
  const result = new Date(0);
  result.setUTCHours(0, 0, 0, 0);
  result.setUTCFullYear(value.getFullYear(), value.getMonth(), value.getDate());
  return result.getTime();
};

const isValidDateParts = (year: number, month: number, day: number): boolean =>
  Number.isSafeInteger(year) &&
  year >= 0 &&
  year <= 9999 &&
  Number.isSafeInteger(month) &&
  month >= 1 &&
  month <= 12 &&
  Number.isSafeInteger(day) &&
  day >= 1 &&
  day <= daysInMonth(year, month);

const isValidTimeParts = (hour: number, minute: number, second: number): boolean =>
  Number.isSafeInteger(hour) &&
  hour >= 0 &&
  hour <= 23 &&
  Number.isSafeInteger(minute) &&
  minute >= 0 &&
  minute <= 59 &&
  Number.isSafeInteger(second) &&
  second >= 0 &&
  second <= 59;

const makeLocalDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
): Date => {
  const result = new Date(0);
  result.setHours(0, 0, 0, 0);
  result.setFullYear(year, month - 1, day);
  result.setHours(hour, minute, second, millisecond);
  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day ||
    result.getHours() !== hour ||
    result.getMinutes() !== minute ||
    result.getSeconds() !== second ||
    result.getMilliseconds() !== millisecond
  ) {
    throw new DateParseError('Local date-time falls outside the supported calendar range');
  }
  return result;
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseByFormat = (value: string, format: string, allowTimeOnly = false): Date => {
  if (!value || !format) throw new DateParseError('Date value and format are required');

  const tokens: FormatToken[] = [];
  let pattern = '^';
  for (let index = 0; index < format.length;) {
    const token = FORMAT_TOKENS.find(candidate => format.startsWith(candidate, index));
    if (token) {
      if (tokens.includes(token)) throw new DateParseError(`Duplicate date format token: ${token}`);
      tokens.push(token);
      pattern += token === 'yyyy' ? '(\\d{4})' : '(\\d{2})';
      index += token.length;
    } else {
      pattern += escapeRegex(format[index]);
      index++;
    }
  }
  pattern += '$';

  const match = new RegExp(pattern).exec(value);
  if (!match) throw new DateParseError(`Date does not match format ${format}`);

  const parts = new Map<FormatToken, number>();
  tokens.forEach((token, index) => parts.set(token, Number(match[index + 1])));
  const hasAnyDate = ['yyyy', 'MM', 'dd'].some(token => parts.has(token as FormatToken));
  const hasCompleteDate = ['yyyy', 'MM', 'dd'].every(token => parts.has(token as FormatToken));
  if (hasAnyDate && !hasCompleteDate) throw new DateParseError('Date formats must include yyyy, MM, and dd together');
  if (!hasCompleteDate && !allowTimeOnly) throw new DateParseError('A complete local date is required');

  const today = new Date();
  const year = parts.get('yyyy') ?? today.getFullYear();
  const month = parts.get('MM') ?? today.getMonth() + 1;
  const day = parts.get('dd') ?? today.getDate();
  const hour = parts.get('HH') ?? 0;
  const minute = parts.get('mm') ?? 0;
  const second = parts.get('ss') ?? 0;

  if (!isValidDateParts(year, month, day)) throw new DateParseError('Invalid local calendar date');
  if (!isValidTimeParts(hour, minute, second)) throw new DateParseError('Invalid local time');
  return makeLocalDate(year, month, day, hour, minute, second);
};

/** Strictly parses a plain calendar date at local midnight without a UTC date shift. */
export const parseLocalDateStrict = (value: unknown, format = 'yyyy-MM-dd'): Date => {
  if (typeof value !== 'string') throw new DateParseError('Local date must be a string');
  if (FORMAT_TOKENS.some(token => ['HH', 'mm', 'ss'].includes(token) && format.includes(token))) {
    throw new DateParseError('Local date format cannot contain time tokens');
  }
  return parseByFormat(value, format);
};

/** Strictly parses a local date-time with no timezone conversion. */
export const parseLocalDateTimeStrict = (value: unknown, format = 'yyyy-MM-ddTHH:mm:ss'): Date => {
  if (typeof value !== 'string') throw new DateParseError('Local date-time must be a string');
  return parseByFormat(value, format);
};

const INSTANT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/;

/** Strictly parses an epoch-millisecond value, `Date`, or millisecond-precision ISO instant carrying `Z`/an offset. */
export const parseInstant = (value: unknown): Date => {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) throw new DateParseError('Invalid Date instance');
    return new Date(value.getTime());
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new DateParseError('Instant timestamp must be finite');
    const result = new Date(value);
    if (!Number.isFinite(result.getTime())) throw new DateParseError('Instant timestamp is outside the Date range');
    return result;
  }
  if (typeof value !== 'string') throw new DateParseError('Instant must be a Date, finite timestamp, or ISO string');

  const match = INSTANT_PATTERN.exec(value);
  if (!match) throw new DateParseError('ISO instant must include a Z or numeric timezone offset');
  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '0', , zone] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (!isValidDateParts(year, month, day) || !isValidTimeParts(hour, minute, second)) {
    throw new DateParseError('Invalid ISO instant components');
  }
  if (zone !== 'Z') {
    const offsetHour = Number(zone.slice(1, 3));
    const offsetMinute = Number(zone.slice(4, 6));
    if (offsetHour > 23 || offsetMinute > 59) throw new DateParseError('Invalid timezone offset');
  }
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch)) throw new DateParseError('Invalid ISO instant');
  return new Date(epoch);
};

/** Returns whether `value` is a valid plain calendar date in `format`. */
export const isValidLocalDate = (value: unknown, format = 'yyyy-MM-dd'): boolean => {
  try {
    parseLocalDateStrict(value, format);
    return true;
  } catch {
    return false;
  }
};

/** Returns whether `value` is a valid instant with explicit timezone semantics. */
export const isValidInstant = (value: unknown): boolean => {
  try {
    parseInstant(value);
    return true;
  } catch {
    return false;
  }
};

const parseLegacyString = (value: string): Date => {
  if (INSTANT_PATTERN.test(value)) return parseInstant(value);

  let match = /^(\d{4})([-/])(\d{1,2})\2(\d{1,2})$/.exec(value);
  if (match) return makeLocalDate(Number(match[1]), Number(match[3]), Number(match[4]));
  match = /^(\d{1,2})([-/])(\d{1,2})\2(\d{4})$/.exec(value);
  if (match) return makeLocalDate(Number(match[4]), Number(match[1]), Number(match[3]));

  match = /^(\d{4})([-/])(\d{1,2})\2(\d{1,2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (match) {
    const [, year, , month, day, hour, minute, second = '0', millisecond = '0'] = match;
    if (!isValidDateParts(+year, +month, +day) || !isValidTimeParts(+hour, +minute, +second)) {
      throw new DateParseError('Invalid local date-time');
    }
    return makeLocalDate(+year, +month, +day, +hour, +minute, +second, +millisecond.padEnd(3, '0'));
  }
  match = /^(\d{1,2})([-/])(\d{1,2})\2(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (match) {
    const [, month, , day, year, hour, minute, second = '0', millisecond = '0'] = match;
    if (!isValidDateParts(+year, +month, +day) || !isValidTimeParts(+hour, +minute, +second)) {
      throw new DateParseError('Invalid local date-time');
    }
    return makeLocalDate(+year, +month, +day, +hour, +minute, +second, +millisecond.padEnd(3, '0'));
  }
  throw new DateParseError('Unsupported date string');
};

const parseDateInput = (value: unknown): Date => {
  if (value instanceof Date || typeof value === 'number') return parseInstant(value);
  if (typeof value === 'string' && value.length > 0) return parseLegacyString(value);
  throw new DateParseError('Unsupported date input');
};

/** Legacy broad date guard, now rejecting coercible objects and impossible calendar values. */
export const isDate = (value: unknown): boolean => {
  try {
    parseDateInput(value);
    return true;
  } catch {
    return false;
  }
};

/** Formats a supported date value in the local timezone; every token occurrence is replaced. */
export const toFormat = (value: unknown, format: string): string => {
  if (typeof format !== 'string') return '';
  let date: Date;
  try {
    date = parseDateInput(value);
  } catch {
    return '';
  }
  const values: Record<FormatToken, string> = {
    yyyy: date.getFullYear().toString().padStart(4, '0'),
    MM: (date.getMonth() + 1).toString().padStart(2, '0'),
    dd: date.getDate().toString().padStart(2, '0'),
    HH: date.getHours().toString().padStart(2, '0'),
    mm: date.getMinutes().toString().padStart(2, '0'),
    ss: date.getSeconds().toString().padStart(2, '0'),
  };
  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, token => values[token as FormatToken]);
};

/** Adds elapsed milliseconds to a supported date value. */
export const addMilliseconds = (value: unknown, milliseconds: number): Date | null => {
  if (!Number.isFinite(milliseconds)) return null;
  try {
    const date = parseDateInput(value);
    date.setTime(date.getTime() + milliseconds);
    return validOrNull(date);
  } catch {
    return null;
  }
};

/**
 * @deprecated Misspelled compatibility alias. Use {@link addMilliseconds}.
 * Its legacy local-clock setter behavior is unchanged in v1.2. Migrating to
 * `addMilliseconds` intentionally changes results across a DST offset transition
 * because the replacement adds exact elapsed milliseconds.
 */
export const addMiliseconds = (value: unknown, milliseconds: number): Date | null => {
  if (!Number.isFinite(milliseconds)) return null;
  try {
    const date = parseDateInput(value);
    date.setMilliseconds(date.getMilliseconds() + milliseconds);
    return validOrNull(date);
  } catch {
    return null;
  }
};

/** Adds local calendar days while preserving the local time-of-day. */
export const addDays = (value: unknown, days: number): Date | null => {
  if (!Number.isFinite(days)) return null;
  try {
    const date = parseDateInput(value);
    date.setDate(date.getDate() + days);
    return validOrNull(date);
  } catch {
    return null;
  }
};

/** Adds local clock hours. Across DST this may represent fewer or more elapsed milliseconds. */
export const addHours = (value: unknown, hours: number): Date | null => {
  if (!Number.isFinite(hours)) return null;
  try {
    const date = parseDateInput(value);
    date.setHours(date.getHours() + hours);
    return validOrNull(date);
  } catch {
    return null;
  }
};

/** Adds calendar months, constraining to the last valid target-month day by default. */
export const addMonths = (value: unknown, months: number, options: AddMonthsOptions = {}): Date | null => {
  if (!Number.isSafeInteger(months)) return null;
  let date: Date;
  try {
    date = parseDateInput(value);
  } catch {
    return null;
  }
  const overflow = options.overflow ?? 'constrain';
  if (!['constrain', 'balance', 'reject'].includes(overflow)) return null;
  if (overflow === 'balance') {
    date.setMonth(date.getMonth() + months);
    return validOrNull(date);
  }

  const originalDay = date.getDate();
  const absoluteMonth = date.getFullYear() * 12 + date.getMonth() + months;
  const targetYear = Math.floor(absoluteMonth / 12);
  const targetMonthIndex = ((absoluteMonth % 12) + 12) % 12;
  const maximumDay = daysInMonth(targetYear, targetMonthIndex + 1);
  if (overflow === 'reject' && originalDay > maximumDay) return null;
  date.setDate(1);
  date.setFullYear(targetYear, targetMonthIndex, Math.min(originalDay, maximumDay));
  return validOrNull(date);
};

/** Returns local midnight at the beginning of the value's local calendar day. */
export const begin = (value: unknown): Date | null => {
  try {
    const date = parseDateInput(value);
    return makeLocalDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  } catch {
    return null;
  }
};

/** Returns the final millisecond of the value's local calendar day. */
export const end = (value: unknown): Date | null => {
  const date = begin(value);
  if (!date) return null;
  date.setDate(date.getDate() + 1);
  date.setMilliseconds(-1);
  return date;
};

/** Legacy instant equality; two unsupported values remain equal for compatibility. */
export const equal = (date1: unknown, date2: unknown): boolean => {
  const valid1 = isDate(date1);
  const valid2 = isDate(date2);
  if (!valid1 && !valid2) return true;
  if (!valid1 || !valid2) return false;
  return parseDateInput(date1).getTime() === parseDateInput(date2).getTime();
};

/** Returns fractional elapsed 24-hour periods between two instants. */
export const elapsedDayDifference = (date1: unknown, date2: unknown): number =>
  (parseDateInput(date2).getTime() - parseDateInput(date1).getTime()) / MILLISECONDS_PER_DAY;

/** Returns local calendar-day boundaries crossed, independent of DST elapsed hours. */
export const calendarDayDifference = (date1: unknown, date2: unknown): number => {
  const first = parseDateInput(date1);
  const second = parseDateInput(date2);
  const firstDay = utcCalendarEpoch(first);
  const secondDay = utcCalendarEpoch(second);
  return Math.round((secondDay - firstDay) / MILLISECONDS_PER_DAY);
};

/**
 * @deprecated The name does not distinguish elapsed time from calendar boundaries.
 * Its legacy elapsed-day flooring behavior is unchanged in v1.2. Use
 * `elapsedDayDifference` or `calendarDayDifference`; negative fractional results may differ.
 */
export const dayDiff = (date1: unknown, date2: unknown): number | null => {
  try {
    return Math.floor(elapsedDayDifference(date1, date2));
  } catch {
    return null;
  }
};

/** Legacy calendar-month boundary difference, ignoring day-of-month. */
export const monthDiff = (date1: unknown, date2: unknown): number | null => {
  try {
    const first = parseDateInput(date1);
    const second = parseDateInput(date2);
    return second.getMonth() + 12 * second.getFullYear() - (first.getMonth() + 12 * first.getFullYear());
  } catch {
    return null;
  }
};

/**
 * Legacy calendar-year boundary difference, ignoring anniversary completion.
 * @deprecated Use {@link completedYearDifference}. The v1.x year-number subtraction
 * and `null`-on-invalid behavior remain unchanged; anniversary-boundary results can differ.
 */
export const yearDiff = (date1: unknown, date2: unknown): number | null => {
  try {
    return parseDateInput(date2).getFullYear() - parseDateInput(date1).getFullYear();
  } catch {
    return null;
  }
};

/**
 * Returns whole anniversaries completed between two local calendar dates.
 * A February 29 anniversary is February 28 in a non-leap year.
 */
export const completedYearDifference = (date1: unknown, date2: unknown): number => {
  const first = parseDateInput(date1);
  const second = parseDateInput(date2);
  const sign = second.getTime() >= first.getTime() ? 1 : -1;
  const earlier = sign === 1 ? first : second;
  const later = sign === 1 ? second : first;
  let years = later.getFullYear() - earlier.getFullYear();
  const anniversaryDay = Math.min(earlier.getDate(), daysInMonth(later.getFullYear(), earlier.getMonth() + 1));
  const anniversary = makeLocalDate(later.getFullYear(), earlier.getMonth() + 1, anniversaryDay);
  if (later.getTime() < anniversary.getTime()) years--;
  return sign * years;
};

/** Returns the month-based decimal-year difference rounded to 0-100 `digits`. */
export const decimalYearDifference = (date1: unknown, date2: unknown, digits = 2): number => {
  if (!Number.isSafeInteger(digits) || digits < 0 || digits > 100) {
    throw new DateParseError('digits must be a safe integer between 0 and 100');
  }
  const months = monthDiff(date1, date2);
  if (months === null) throw new DateParseError('Both dates must be valid');
  const result = NumberUtilities.round(months / 12, digits);
  if (result === null) throw new DateParseError('Decimal year difference could not be calculated');
  return result;
};

/**
 * Returns completed age at a reference date and rejects a reference before birth.
 * A February 29 birthday reaches its non-leap-year anniversary on February 28.
 */
export const completedAge = (dateOfBirth: unknown, atDate: unknown = new Date()): number => {
  const result = completedYearDifference(dateOfBirth, atDate);
  if (result < 0) throw new DateParseError('Reference date cannot precede date of birth');
  return result;
};

/**
 * @deprecated The ambiguous legacy decimal month-based behavior is unchanged in v1.2.
 * Use `completedAge` for completed birthdays or `decimalYearDifference` for decimal years;
 * migrating legal/business age checks can change boundary results.
 */
export const age = (date1: unknown, date2: unknown): number | null => {
  try {
    return decimalYearDifference(date1, date2);
  } catch {
    return null;
  }
};

/** Legacy format parser, now strict and locale-independent; invalid values return `null`. */
export const parseFrom = (value: unknown, format: string): Date | null => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !format) return null;
  try {
    return parseByFormat(String(value), format, true);
  } catch {
    return null;
  }
};

const relativeUnit = (milliseconds: number): { amount: number; unit: string } => {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;
  if (milliseconds < minute) return { amount: Math.round(milliseconds / 1000), unit: 'second' };
  if (milliseconds < hour) return { amount: Math.round(milliseconds / minute), unit: 'minute' };
  if (milliseconds < day) return { amount: Math.round(milliseconds / hour), unit: 'hour' };
  if (milliseconds < month) return { amount: Math.round(milliseconds / day), unit: 'day' };
  if (milliseconds < year) return { amount: Math.round(milliseconds / month), unit: 'month' };
  return { amount: Math.round(milliseconds / year), unit: 'year' };
};

/** Returns approximate human-readable relative time using 30-day months and 365-day years. */
export const timeDifference = (previous: unknown, current: unknown = new Date()): string => {
  let elapsed: number;
  try {
    elapsed = parseDateInput(current).getTime() - parseDateInput(previous).getTime();
  } catch {
    return '';
  }
  const { amount, unit } = relativeUnit(Math.abs(elapsed));
  const label = amount === 1 ? unit : `${unit}s`;
  return elapsed >= 0 ? `${amount} ${label} ago` : `in ${amount} ${label}`;
};

/** Date parsing, calendar arithmetic, elapsed-time, and formatting utilities. */
export const DateUtilities = {
  equal,
  /**
   * Retains the ambiguous v1.x elapsed-day flooring behavior unchanged.
   * @deprecated Use `elapsedDayDifference` or `calendarDayDifference`. Negative
   * fractional results and DST-spanning calendar results may intentionally differ.
   */
  dayDiff,
  /** Counts local calendar-date boundaries, independent of DST day length. */
  calendarDayDifference,
  /** Returns exact elapsed 24-hour units between two instants. */
  elapsedDayDifference,
  monthDiff,
  /**
   * Retains v1.x calendar-year subtraction and null-on-invalid behavior unchanged.
   * @deprecated Use `completedYearDifference`; anniversary-boundary results can differ.
   */
  yearDiff,
  /** Returns whole anniversaries; February 29 clamps to February 28 in non-leap years. */
  completedYearDifference,
  /** Returns a month-based decimal-year difference rounded to 0-100 digits. */
  decimalYearDifference,
  /**
   * Retains the ambiguous v1.x decimal month-based behavior unchanged.
   * @deprecated Use `completedAge` or `decimalYearDifference`; legal/business age
   * checks can change at birthday boundaries during migration.
   */
  age,
  /** Returns completed birthdays; February 29 clamps to February 28 in non-leap years. */
  completedAge,
  parseFrom,
  /** Strictly parses `YYYY-MM-DD` as a local calendar date without UTC shifting. */
  parseLocalDateStrict,
  /** Strictly parses a local date-time without an offset. */
  parseLocalDateTimeStrict,
  /** Strictly parses a timestamp carrying an explicit `Z` or numeric offset. */
  parseInstant,
  isDate,
  isValidLocalDate,
  isValidInstant,
  toFormat,
  /** Adds elapsed milliseconds. */
  addMilliseconds,
  /**
   * Misspelled wrapper whose legacy local-clock behavior is unchanged in v1.2.
   * @deprecated Use `addMilliseconds`; review DST-transition results because the
   * replacement adds exact elapsed milliseconds.
   */
  addMiliseconds,
  addHours,
  addDays,
  addMonths,
  begin,
  end,
  timeDifference,
};
