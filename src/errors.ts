/** Options shared by all public `@sdcorejs/utils` errors. */
export interface SdcoreUtilsErrorOptions {
  /** The lower-level error that caused this failure, when available. */
  cause?: unknown;
}

const ERROR_BRANDS = Symbol.for('@sdcorejs/utils/error-brands');

interface BrandedError {
  readonly [ERROR_BRANDS]?: readonly string[];
}

/** Base class for errors intentionally raised by `@sdcorejs/utils`. */
export class SdcoreUtilsError extends Error {
  /** The lower-level error that caused this failure, when available. */
  readonly cause?: unknown;

  /**
   * Preserves `instanceof` across independently bundled public entry points.
   * Native prototype-chain checks remain the fast path; the global-symbol brand
   * handles the same public error class loaded from another package subpath.
   */
  static [Symbol.hasInstance](value: unknown): boolean {
    if (Function.prototype[Symbol.hasInstance].call(this, value)) return true;
    if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
    const brands = (value as BrandedError)[ERROR_BRANDS];
    return Array.isArray(brands) && brands.includes(this.name);
  }

  constructor(message: string, options: SdcoreUtilsErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
    const brands: string[] = [];
    let constructor: object | null = new.target;
    while (typeof constructor === 'function' && constructor !== Error) {
      brands.push(constructor.name);
      constructor = Object.getPrototypeOf(constructor) as object | null;
    }
    Object.defineProperty(this, ERROR_BRANDS, {
      configurable: false,
      enumerable: false,
      value: Object.freeze(brands),
      writable: false,
    });
    if (options.cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        configurable: true,
        enumerable: false,
        value: options.cause,
        writable: false,
      });
    }
  }
}

/** Base class for rejected operations that would cross a security boundary. */
export class SecurityError extends SdcoreUtilsError {}

/** Base class for invalid caller input. */
export class ValidationError extends SdcoreUtilsError {}

/** Base class for deterministic serialization failures. */
export class SerializationError extends SdcoreUtilsError {}

/** Raised when an object key could alter or expose a JavaScript prototype. */
export class UnsafeObjectKeyError extends SecurityError {
  /** The rejected key. */
  readonly key: string;

  constructor(key: string) {
    super(`Unsafe object key rejected: ${JSON.stringify(key)}`);
    this.key = key;
  }
}

/** Raised when a property path is malformed, too deep, or prototype-sensitive. */
export class UnsafePropertyPathError extends SecurityError {
  /** The rejected path. */
  readonly path: string;

  constructor(path: string, reason: string) {
    super(`Unsafe property path rejected: ${reason}`);
    this.path = path;
  }
}

/** Raised when a recursive input graph contains a cycle that the API cannot encode. */
export class CircularReferenceError extends ValidationError {
  constructor(path?: string) {
    super(path ? `Circular reference detected at ${path}` : 'Circular reference detected');
  }
}

/** Raised when a value is outside a serializer's documented value domain. */
export class UnsupportedSerializationTypeError extends SerializationError {
  /** A stable description of the unsupported JavaScript type. */
  readonly valueType: string;

  constructor(valueType: string, path?: string) {
    super(`Unsupported serialization type${path ? ` at ${path}` : ''}: ${valueType}`);
    this.valueType = valueType;
  }
}

/** Raised when the Web Crypto API required by an operation is unavailable. */
export class WebCryptoUnavailableError extends SecurityError {
  constructor() {
    super('The Web Crypto API is unavailable in this runtime');
  }
}

/** Raised when cryptographically secure randomness is unavailable. */
export class SecureRandomUnavailableError extends SecurityError {
  constructor(options: SdcoreUtilsErrorOptions = {}) {
    super('Cryptographically secure randomness is unavailable in this runtime', options);
  }
}

/** Raised when an authenticated-encryption token is malformed or unsupported. */
export class EncryptionFormatError extends ValidationError {}

/** Raised when authenticated decryption fails without exposing secret material. */
export class EncryptionAuthenticationError extends SecurityError {
  constructor(options: SdcoreUtilsErrorOptions = {}) {
    super('Authenticated decryption failed', options);
  }
}

/** Raised when a filter definition is malformed or exceeds safety limits. */
export class FilterValidationError extends ValidationError {}

/** Raised when a strict date or instant cannot be parsed. */
export class DateParseError extends ValidationError {}

/** Raised when a paginated endpoint returns a malformed or non-progressing page. */
export class PagingResponseError extends ValidationError {}

/** Raised when pagination reaches its configured page limit. */
export class PagingLimitError extends ValidationError {}

/** Raised when a native file picker closes without a selection. */
export class FilePickerCancelledError extends ValidationError {
  constructor() {
    super('File selection was cancelled');
  }
}

/** Raised when a navigation or download URL uses a disallowed protocol. */
export class UnsafeUrlProtocolError extends SecurityError {
  /** The rejected URL protocol. */
  readonly protocol: string;

  constructor(protocol: string) {
    super(`URL protocol is not allowed: ${protocol || '(missing)'}`);
    this.protocol = protocol;
  }
}

/** Raised when a subscribable completes before producing a value. */
export class EmptySubscribableError extends ValidationError {
  constructor() {
    super('The subscribable completed without emitting a value');
  }
}
