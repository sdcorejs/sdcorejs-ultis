/**
 * Identifies a built-in validation pattern available in `VALIDATION_PATTERNS`.
 *
 * **Vietnamese formats**
 * - `'VN_PHONE'` — Vietnamese mobile phone number
 * - `'VN_ID'` — Vietnamese national ID card (CCCD / CMND, 12 digits)
 * - `'VN_ID_OR_PASSPORT'` — accepts either VN_ID or PASSPORT
 *
 * **Common formats**
 * - `'EMAIL'` — standard email address
 * - `'PHONE'` — generic international phone number
 * - `'PASSPORT'` — international passport number (letter + 7 digits)
 * - `'TIME'` — time string in `HH:mm` format
 *
 * **Web / network formats**
 * - `'URL'` — HTTP/HTTPS URL
 * - `'DOMAIN'` — bare domain name (e.g. `example.com`)
 * - `'IPV4'` — IPv4 address
 * - `'IPV6'` — IPv6 address
 * - `'IMAGE_URL'` — HTTP/HTTPS URL ending with a common image extension
 * - `'SLUG'` — URL-friendly slug (lowercase letters, digits, hyphens)
 *
 * **Numeric formats**
 * - `'NUMBER'` — integer or decimal, optionally negative
 * - `'INTEGER'` — whole number, optionally negative
 * - `'DECIMAL'` — number that must include a decimal point
 * - `'POSITIVE_NUMBER'` — non-negative integer or decimal
 *
 * **Identifier formats**
 * - `'UUID'` — generic UUID syntax (hyphen-separated hexadecimal groups)
 * - `'CODE_16'` — 16-character alphanumeric code
 * - `'CODE_32'` — 32-character alphanumeric code
 * - `'HEX_COLOR'` — CSS hex color (`#RGB` or `#RRGGBB`)
 * - `'BASE64'` — Base64-encoded string
 *
 * @example
 * const t: ValidationPatternType = 'VN_PHONE';
 */
export type ValidationPatternType =
  | 'EMAIL'
  | 'PHONE'
  | 'VN_PHONE'
  | 'VN_ID'
  | 'PASSPORT'
  | 'VN_ID_OR_PASSPORT'
  | 'TIME'
  | 'URL'
  | 'DOMAIN'
  | 'IPV4'
  | 'IPV6'
  | 'IMAGE_URL'
  | 'SLUG'
  | 'NUMBER'
  | 'INTEGER'
  | 'DECIMAL'
  | 'POSITIVE_NUMBER'
  | 'UUID'
  | 'CODE_16'
  | 'CODE_32'
  | 'HEX_COLOR'
  | 'BASE64';

/**
 * Metadata for a single built-in validation pattern, used by form validators and
 * pattern-picker UI components.
 *
 * All `name` and `errorMessage` values are i18n keys resolved at runtime by `I18nService`.
 * The `pattern` field is a regex string compatible with `Angular Validators.pattern()` and
 * the native `RegExp` constructor.
 *
 * @example
 * const emailPattern: ValidationPattern = {
 *   type: 'EMAIL',
 *   name: 'core.validator.email.name',
 *   pattern: '^[\\w.+-]+@[\\w-]+\\.[\\w.]+$',
 *   errorMessage: 'core.validator.email.error',
 * };
 *
 * // Use with Angular reactive forms:
 * const control = new FormControl('', Validators.pattern(emailPattern.pattern));
 */
export interface ValidationPattern {
  /** Pattern identifier — matches a `ValidationPatternType` member. */
  type: ValidationPatternType;
  /** i18n key for the human-readable pattern name shown in the UI. */
  name: string;
  /** Regex string used to validate the input. Pass directly to `Validators.pattern()` or `new RegExp(pattern)`. */
  pattern: string;
  /** i18n key for the validation error message shown when the pattern does not match. */
  errorMessage: string;
}
