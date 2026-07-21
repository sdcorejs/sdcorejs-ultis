/* eslint-disable @typescript-eslint/no-explicit-any */

/** Options for strict numeric-string recognition and parsing. */
export interface NumericStringOptions {
  /** Permit surrounding whitespace by trimming first. Defaults to `false`. */
  trim?: boolean;
  /** Permit hexadecimal syntax such as `0xff`. Defaults to `false`. */
  allowHex?: boolean;
  /** Permit exponent notation such as `1e3`. Defaults to `true`. */
  allowExponent?: boolean;
  /** Permit decimal fractions. Defaults to `true`. */
  allowDecimal?: boolean;
  /** Permit a leading plus sign. Defaults to `true`. */
  allowLeadingPlus?: boolean;
}

/** Options for finite-number parsing. */
export interface ParseFiniteNumberOptions extends NumericStringOptions {
  /** Permit boolean `true`/`false` as `1`/`0`. Disabled by default. */
  allowBoolean?: boolean;
}

const toVNCurrency = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) return null;
  const val = +value;
  return !Number.isNaN(val) ? val.toLocaleString('vi-VN', { maximumFractionDigits: 10 }) : null;
};

const toVN = toVNCurrency;

const toISO = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) return null;
  const val = +value;
  return !Number.isNaN(val) ? val.toLocaleString('en-US', { maximumFractionDigits: 10 }) : null;
};

const isPositiveInteger = (value: any) => {
  if (!value) return false;
  return /^([0-9]*)$/.test(value) && +value > 0;
};

const isPositiveNumber = (value: any) => {
  if (!value) return false;
  return /^([0-9]*)(\.[0-9]+$){0,1}$/.test(value) && +value > 0;
};

/** Returns true only for primitive, finite JavaScript numbers. */
export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Validates an explicitly configured decimal/exponent/hex numeric string. */
export const isNumericString = (value: unknown, options: NumericStringOptions = {}): value is string => {
  if (typeof value !== 'string' || value.length === 0) return false;
  const normalized = options.trim ? value.trim() : value;
  if (!normalized || (!options.trim && normalized !== value)) return false;
  if (options.allowHex && /^0[xX][0-9a-fA-F]+$/.test(normalized)) return true;
  const sign = options.allowLeadingPlus === false ? '-?' : '[+-]?';
  const unsigned = options.allowDecimal === false
    ? '\\d+'
    : '(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
  const exponent = options.allowExponent === false ? '' : '(?:[eE][+-]?\\d+)?';
  return new RegExp(`^${sign}${unsigned}${exponent}$`).test(normalized);
};

/** Parses a finite primitive number under explicit coercion options, otherwise returns `null`. */
export const parseFiniteNumber = (
  value: unknown,
  options: ParseFiniteNumberOptions = {},
): number | null => {
  if (isFiniteNumber(value)) return value;
  if (typeof value === 'boolean') return options.allowBoolean ? Number(value) : null;
  if (!isNumericString(value, options)) return null;
  const parsed = Number(options.trim ? value.trim() : value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Broad v1.x coercion check retained unchanged for compatibility.
 *
 * @deprecated Use {@link isFiniteNumber}, {@link isNumericString}, or
 * {@link parseFiniteNumber}. Arrays and booleans may be accepted by this legacy API.
 */
export const isNumber = (value: any) => {
  if (value === undefined || value === null || value === '') return false;
  return !Number.isNaN(+value);
};

const round = (value: any, digits = 2): number | null => {
  if (!isNumber(value)) return null;
  const val = Math.pow(10, digits);
  return Math.round(value * val) / val;
};

export const NumberUtilities = {
  toVNCurrency,
  toVN,
  toISO,
  isPositiveInteger,
  isPositiveNumber,
  /**
   * Broad v1.x coercion check retained unchanged; arrays and booleans may match.
   * @deprecated Use `isFiniteNumber`, `isNumericString`, or `parseFiniteNumber`.
   * Replacing it can intentionally reject values accepted through legacy coercion.
   */
  isNumber,
  /** Checks for a primitive finite number without coercion. */
  isFiniteNumber,
  /** Checks numeric string syntax under explicit whitespace/hex/exponent options. */
  isNumericString,
  /** Parses a primitive number or allowed numeric string to a finite number. */
  parseFiniteNumber,
  round,
};
