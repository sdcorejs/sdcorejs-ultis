import { ValidationError } from '../errors';
import { ValidationPatternType } from '../models/pattern.model';
import { StringUtilities } from './string.fns';
import { isFiniteNumber, isNumericString, parseFiniteNumber } from './number.fns';

const PATTERN_MAP: Record<ValidationPatternType, RegExp> = {
  EMAIL: new RegExp(StringUtilities.REGEX_EMAIL),
  PHONE: new RegExp(StringUtilities.REGEX_PHONE),
  VN_PHONE: new RegExp(StringUtilities.REGEX_VN_PHONE),
  VN_ID: new RegExp(StringUtilities.REGEX_VN_ID),
  PASSPORT: new RegExp(StringUtilities.REGEX_PASSPORT),
  VN_ID_OR_PASSPORT: new RegExp(StringUtilities.REGEX_VN_ID_OR_PASSPORT),
  TIME: new RegExp(StringUtilities.REGEX_TIME),
  URL: new RegExp(StringUtilities.REGEX_URL),
  DOMAIN: new RegExp(StringUtilities.REGEX_DOMAIN),
  IPV4: new RegExp(StringUtilities.REGEX_IPV4),
  IPV6: new RegExp(StringUtilities.REGEX_IPV6),
  IMAGE_URL: new RegExp(StringUtilities.REGEX_IMAGE_URL, 'i'),
  SLUG: new RegExp(StringUtilities.REGEX_SLUG),
  NUMBER: new RegExp(StringUtilities.REGEX_NUMBER),
  INTEGER: new RegExp(StringUtilities.REGEX_INTEGER),
  DECIMAL: new RegExp(StringUtilities.REGEX_DECIMAL),
  POSITIVE_NUMBER: new RegExp(StringUtilities.REGEX_POSITIVE_NUMBER),
  UUID: new RegExp(StringUtilities.REGEX_UUID, 'i'),
  CODE_16: new RegExp(StringUtilities.REGEX_CODE_16),
  CODE_32: new RegExp(StringUtilities.REGEX_CODE_32),
  HEX_COLOR: new RegExp(StringUtilities.REGEX_HEX_COLOR),
  BASE64: new RegExp(StringUtilities.REGEX_BASE64),
};

const test = (regex: RegExp, value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  return regex.test(String(value));
};

/** Validates a value against a named built-in syntax pattern. Unknown runtime names throw. */
const validate = (type: ValidationPatternType, value: unknown): boolean => {
  if (!Object.hasOwn(PATTERN_MAP, type)) throw new ValidationError(`Unknown validation pattern: ${String(type)}`);
  if (type === 'URL') return isUrl(value);
  if (type === 'IMAGE_URL') return isImageUrl(value);
  if (type === 'UUID') return isUuid(value);
  if (type === 'BASE64') return isBase64(value);
  return test(PATTERN_MAP[type], value);
};

/** URL syntax/policy options. This validates syntax, not remote content or trust. */
export interface UrlValidationOptions {
  /** Allowed protocols. Defaults to `http:` and `https:`. */
  protocols?: readonly string[];
  /** Permit relative paths. Defaults to `false`. */
  allowRelative?: boolean;
  /** Permit embedded username/password credentials. Defaults to `false`. */
  allowCredentials?: boolean;
  /** Require a non-empty hostname for absolute URLs. Defaults to `true`. */
  requireHost?: boolean;
  /** Base used only to parse relative paths. Defaults to `http://localhost`. */
  baseUrl?: string;
}

/** UUID syntax options. */
export interface UuidValidationOptions {
  /** Require a specific UUID version nibble. */
  version?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  /** Require the RFC variant (`8`, `9`, `a`, or `b`). Defaults to `false`. */
  requireRfcVariant?: boolean;
  /** Accept uppercase hexadecimal. Defaults to `true`. */
  allowUppercase?: boolean;
}

const isEmail = (value: unknown) => test(PATTERN_MAP.EMAIL, value);
const isPhone = (value: unknown) => test(PATTERN_MAP.PHONE, value);
const isVnPhone = (value: unknown) => test(PATTERN_MAP.VN_PHONE, value);
const isVnId = (value: unknown) => test(PATTERN_MAP.VN_ID, value);
const isPassport = (value: unknown) => test(PATTERN_MAP.PASSPORT, value);
const isVnIdOrPassport = (value: unknown) => test(PATTERN_MAP.VN_ID_OR_PASSPORT, value);
const isTime = (value: unknown) => test(PATTERN_MAP.TIME, value);

/** Parses a URL and applies an explicit protocol/relative/credential/host policy. */
const isUrl = (value: unknown, options: UrlValidationOptions = {}): boolean => {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) return false;
  const hasScheme = /^[A-Za-z][A-Za-z\d+.-]*:/.test(value);
  if (!hasScheme && !options.allowRelative) return false;
  try {
    const base = new URL(options.baseUrl ?? 'http://localhost');
    const parsed = new URL(value, base);
    if (!hasScheme && parsed.origin !== base.origin) return false;
    const protocols = (options.protocols ?? ['http:', 'https:']).map(protocol =>
      protocol.endsWith(':') ? protocol.toLowerCase() : `${protocol.toLowerCase()}:`);
    if (!protocols.includes(parsed.protocol.toLowerCase())) return false;
    if (!options.allowCredentials && (parsed.username || parsed.password)) return false;
    if ((options.requireHost ?? true) && hasScheme && !parsed.hostname) return false;
    return true;
  } catch {
    return false;
  }
};

const isDomain = (value: unknown) => test(PATTERN_MAP.DOMAIN, value);
const isIpv4 = (value: unknown) => test(PATTERN_MAP.IPV4, value);
const isIpv6 = (value: unknown) => test(PATTERN_MAP.IPV6, value);

/** Checks only a path/URL filename extension; it does not validate remote content. */
const hasImageFileExtension = (value: unknown): boolean => {
  if (typeof value !== 'string' || !value) return false;
  const path = value.split(/[?#]/, 1)[0];
  return /\.(?:jpe?g|png|gif|webp|svg|bmp)$/i.test(path);
};

/**
 * Checks HTTP(S) URL syntax plus a known image filename extension. It does not
 * prove that the remote response is an image.
 *
 * @deprecated Use {@link hasImageFileExtension} for filename syntax and validate
 * downloaded content independently on a trusted server. The high-level
 * URL-plus-extension role remains, but v1.2 URL parsing rejects embedded credentials
 * and malformed values more strictly. The replacement checks only extension syntax,
 * so call {@link isUrl} separately when URL policy is also required.
 */
const isImageUrl = (value: unknown): boolean =>
  isUrl(value) && hasImageFileExtension(value);

const isSlug = (value: unknown) => test(PATTERN_MAP.SLUG, value);
const isNumberSyntax = (value: unknown) => test(PATTERN_MAP.NUMBER, value);
const isInteger = (value: unknown) => test(PATTERN_MAP.INTEGER, value);
const isDecimal = (value: unknown) => test(PATTERN_MAP.DECIMAL, value);
const isPositiveNumber = (value: unknown) => test(PATTERN_MAP.POSITIVE_NUMBER, value);

/** Validates generic UUID shape with optional version and RFC-variant checks. */
const isUuid = (value: unknown, options: UuidValidationOptions = {}): boolean => {
  if (typeof value !== 'string') return false;
  if (options.allowUppercase === false && value !== value.toLowerCase()) return false;
  const match = value.match(/^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i);
  if (!match) return false;
  if (options.version !== undefined && match[3][0].toLowerCase() !== String(options.version)) return false;
  if (options.requireRfcVariant && !/^[89ab]/i.test(match[4])) return false;
  return true;
};

/** Validates a UUID v4 with the RFC variant bits. */
const isUuidV4 = (value: unknown): boolean => isUuid(value, { version: 4, requireRfcVariant: true });

const isCode16 = (value: unknown) => test(PATTERN_MAP.CODE_16, value);
const isCode32 = (value: unknown) => test(PATTERN_MAP.CODE_32, value);
const isHexColor = (value: unknown) => test(PATTERN_MAP.HEX_COLOR, value);
const isBase64 = (value: unknown): boolean => test(PATTERN_MAP.BASE64, value);

/** Alphanumeric code, 2-20 characters (letters, digits, `@`, `_`, `-`). */
const isCode = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  return /^[a-zA-Z0-9@_-]{2,20}$/.test(String(value));
};

export const ValidationUtilities = {
  validate,
  isEmail,
  isPhone,
  isVnPhone,
  isVnId,
  isPassport,
  isVnIdOrPassport,
  isTime,
  isUrl,
  isDomain,
  isIpv4,
  isIpv6,
  /**
   * Retains the v1.x HTTP(S)-URL-plus-extension role with stricter URL/credential policy.
   * @deprecated Use `hasImageFileExtension` and apply `isUrl` separately when needed.
   * Neither helper validates downloaded content; migration may accept relative filenames.
   */
  isImageUrl,
  /** Checks only whether a filename/path ends in a known image extension. */
  hasImageFileExtension,
  isSlug,
  /**
   * Retains the v1.x decimal-string syntax check unchanged.
   * @deprecated Use `isNumericString` for explicit syntax options. The replacement
   * can intentionally accept configured exponent/hex forms or reject whitespace.
   */
  isNumber: isNumberSyntax,
  isInteger,
  isDecimal,
  isPositiveNumber,
  /** Checks for a primitive finite number without coercion. */
  isFiniteNumber,
  /** Checks numeric string syntax under explicit options. */
  isNumericString,
  /** Parses a finite number under explicit coercion options. */
  parseFiniteNumber,
  /** Validates UUID syntax with optional casing, version, and variant policies. */
  isUuid,
  /** Validates an RFC-compatible version-4 UUID. */
  isUuidV4,
  isCode16,
  isCode32,
  isHexColor,
  isBase64,
  isCode,
};
