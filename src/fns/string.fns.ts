/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  EncryptionAuthenticationError,
  EncryptionFormatError,
  SecureRandomUnavailableError,
  ValidationError,
  WebCryptoUnavailableError,
} from '../errors';
import { decodeBase64Url, decodeUtf8, encodeBase64Url, encodeUtf8 } from '../internal/encoding';
import { getOwnPropertyPath, PropertyPathOptions } from '../internal/property-path';
import { stableStringify } from './serialization.fns';

const REGEX_EMAIL = '^(([^<>()[\\].,;:\\s@"]+(\\.[^<>()[\\].,;:\\s@"]+)*)|(".+"))@(([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{2,})$';
const REGEX_PHONE = '^[+]*[(]{0,1}[+]?[0-9]{1,4}[)]{0,1}[-\\s./0-9]*$';
const REGEX_VN_PHONE = '^(?:\\+84|0|84)(3[2-9]|5[2689]|7[06-9]|8[1-689]|9[0-9])\\d{7}$';
const REGEX_VN_ID = '^\\d{12}$';
const REGEX_PASSPORT = '^[A-Z]\\d{7}$';
const REGEX_VN_ID_OR_PASSPORT = '^(\\d{12}|[A-Z]\\d{7})$';
const REGEX_TIME = '^(?:[01]\\d|2[0-3]):[0-5]\\d$';

const REGEX_URL = '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b[-a-zA-Z0-9()@:%_+.~#?&/=]*$';
const REGEX_DOMAIN = '^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$';
const REGEX_IPV4 = '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$';
const REGEX_IPV6 = '^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}|[0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4})$';
const REGEX_IMAGE_URL = '^https?:\\/\\/.+\\.(jpg|jpeg|png|gif|webp|svg|bmp)(\\?.*)?$';
const REGEX_SLUG = '^[a-z0-9]+(?:-[a-z0-9]+)*$';
const REGEX_NUMBER = '^-?\\d+(\\.\\d+)?$';
const REGEX_INTEGER = '^-?\\d+$';
const REGEX_DECIMAL = '^-?\\d+\\.\\d+$';
const REGEX_POSITIVE_NUMBER = '^\\d+(\\.\\d+)?$';
const REGEX_UUID = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
const REGEX_CODE_16 = '^[A-Za-z0-9]{16}$';
const REGEX_CODE_32 = '^[A-Za-z0-9]{32}$';
const REGEX_HEX_COLOR = '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$';
const REGEX_BASE64 = '^(?=.{4,}$)(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$';


const isNullOrEmpty = (value: any) => value === undefined || value === null || value === '';

const isNullOrWhiteSpace = (value: any) =>
  value === undefined || value === null || typeof value !== 'string' || value.match(/^\s*$/) !== null;

const changeAliasLowerCase = (alias: any) => {
  let str: string = alias?.toString() ?? '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, ' ');
  str = str.replace(/ + /g, ' ');
  return str.trim();
};

const aliasIncludes = (alias: any, searchText: any) =>
  changeAliasLowerCase(alias).includes(changeAliasLowerCase(searchText));

/** Formats numbered placeholders while treating replacement strings literally. */
const format = (template: string, ...arr: any[]) =>
  template.replace(
    /\\(\{(?:0|[1-9]\d*)\})|\{(0|[1-9]\d*)\}/g,
    (placeholder, escaped: string | undefined, indexText: string | undefined) => {
      if (escaped !== undefined) return escaped;
      const index = Number(indexText);
      return Number.isSafeInteger(index) && index < arr.length
        ? String(arr[index])
        : placeholder;
    },
  );

/** Options for template property resolution. */
export type TemplatePathOptions = PropertyPathOptions;

/** Replaces unescaped `${path}` placeholders using own data properties only. */
const templateToDisplay = (
  template: string,
  entity: Record<string, any>,
  options: TemplatePathOptions = {},
) => {
  if (!template) return template;
  return template.replace(
    /\\(\$\{[A-Za-z0-9._\-\[\]'\"]+\})|\$\{([A-Za-z0-9._\-\[\]'\"]+)\}/g,
    (_match, escaped: string | undefined, key: string | undefined) => {
      if (escaped !== undefined) return escaped;
      if (key === undefined) return _match;
      const value = getOwnPropertyPath(entity, key, options);
      return value === null || value === undefined ? '' : String(value);
    },
  );
};

const EXACT_TEMPLATE_REGEX = /^\$\{([A-Za-z0-9._-]*)\}$/;
const NUMBER_LITERAL_REGEX = /^-?\d+(\.\d+)?$/;

const parseExpression = (
  template: string,
  entity: Record<string, any>,
  options: TemplatePathOptions = {},
) => {
  if (!template) return undefined;
  const trimmed = template.trim();
  const exactMatch = trimmed.match(EXACT_TEMPLATE_REGEX);
  if (exactMatch?.[1]) return getOwnPropertyPath(entity, exactMatch[1], options);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  if (NUMBER_LITERAL_REGEX.test(trimmed)) return Number(trimmed);
  return templateToDisplay(template, entity, options);
};

const SALT = 'cb9f4b2a-d26c-4787-a66e-e7130ee00f95';

const legacyObfuscate = (obj: any) => {
  const chars = JSON.stringify(obj).split('');
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '{') chars[i] = '}';
    else if (chars[i] === '}') chars[i] = '{';
  }
  return encodeURI(SALT + chars.join(''));
};

const legacyDeobfuscate = (encripted: string) => {
  encripted = decodeURI(encripted);
  if (encripted.indexOf(SALT) !== 0) throw new Error('object cannot be decrypted');
  const strs = encripted.substring(SALT.length).split('');
  for (let i = 0; i < strs.length; i++) {
    if (strs[i] === '{') strs[i] = '}';
    else if (strs[i] === '}') strs[i] = '{';
  }
  return JSON.parse(strs.join(''));
};

/**
 * Reversibly obfuscates a JSON value using the exact v1.1.x wire format.
 * This provides no confidentiality, integrity, or authentication and must not be
 * used for secrets, authorization, tokens, signed state, or PII protection.
 */
export const obfuscate = legacyObfuscate;

/** Decodes values produced by {@link obfuscate} and legacy v1.1.x `encrypt`. */
export const deobfuscate = legacyDeobfuscate;

/**
 * Legacy compatibility alias for {@link obfuscate}. Behavior and wire format are
 * unchanged in v1.2.0; existing persisted values do not need rewriting.
 *
 * It provides no confidentiality, integrity, or authentication and must not be
 * used for secrets, authorization, tokens, signed state, or PII protection.
 *
 * @deprecated Use {@link obfuscate} for legacy naming or {@link encryptAesGcm}
 * for authenticated encryption. Do not silently migrate persisted payloads.
 */
export const encrypt = legacyObfuscate;

/**
 * Legacy compatibility alias for {@link deobfuscate}. Behavior and wire format
 * are unchanged in v1.2.0.
 *
 * It provides no confidentiality, integrity, or authentication and must not be
 * used for secrets, authorization, tokens, signed state, or PII protection.
 *
 * @deprecated Use {@link deobfuscate} for legacy values or {@link decryptAesGcm}
 * for authenticated AES-GCM tokens.
 */
export const decrypt = legacyDeobfuscate;

/** Options for authenticated AES-GCM encryption. */
export interface AesGcmEncryptOptions {
  /** Optional additional authenticated data; the same bytes/string are required for decryption. */
  additionalData?: Uint8Array | string;
}

/** Options for authenticated AES-GCM decryption. */
export interface AesGcmDecryptOptions {
  /** Additional authenticated data used during encryption. */
  additionalData?: Uint8Array | string;
}

interface AesGcmEnvelopeV1 {
  version: 1;
  algorithm: 'AES-GCM';
  iv: string;
  ciphertext: string;
  hasAdditionalData: boolean;
}

const AES_GCM_TOKEN_PREFIX = 'sdcore.aesgcm.v1.';

const getCryptoApi = (): Crypto => {
  if (!globalThis.crypto?.subtle) throw new WebCryptoUnavailableError();
  return globalThis.crypto;
};

const normalizeAdditionalData = (value?: Uint8Array | string): Uint8Array | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return encodeUtf8(value);
  if (value instanceof Uint8Array) return value;
  throw new ValidationError('additionalData must be a string or Uint8Array');
};

const validateCryptoKey = (key: CryptoKey, usage: KeyUsage): CryptoKey => {
  try {
    if (
      key?.type !== 'secret' ||
      key.algorithm?.name !== 'AES-GCM' ||
      !Array.isArray(key.usages) ||
      !key.usages.includes(usage)
    ) {
      throw new ValidationError(`A secret AES-GCM CryptoKey with ${usage} usage is required`);
    }
  } catch (cause) {
    if (cause instanceof ValidationError) throw cause;
    throw new ValidationError(`A secret AES-GCM CryptoKey with ${usage} usage is required`, { cause });
  }
  return key;
};

const importAesKey = async (
  key: CryptoKey | Uint8Array,
  usage: 'encrypt' | 'decrypt',
): Promise<CryptoKey> => {
  const cryptoApi = getCryptoApi();
  if (key instanceof Uint8Array) {
    if (![16, 24, 32].includes(key.byteLength)) {
      throw new ValidationError('Raw AES-GCM keys must contain 16, 24, or 32 bytes');
    }
    try {
      return await cryptoApi.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [usage]);
    } catch (cause) {
      throw new ValidationError('Raw AES-GCM key material could not be imported', { cause });
    }
  }
  return validateCryptoKey(key, usage);
};

const parseAesGcmEnvelope = (token: string): AesGcmEnvelopeV1 => {
  if (typeof token !== 'string' || !token.startsWith(AES_GCM_TOKEN_PREFIX)) {
    if (typeof token === 'string' && token.startsWith('sdcore.aesgcm.')) {
      throw new EncryptionFormatError('Unsupported AES-GCM token version');
    }
    throw new EncryptionFormatError('Malformed AES-GCM token');
  }
  const encoded = token.slice(AES_GCM_TOKEN_PREFIX.length);
  try {
    const parsed = JSON.parse(decodeUtf8(decodeBase64Url(encoded))) as Partial<AesGcmEnvelopeV1>;
    if (
      !parsed ||
      parsed.version !== 1 ||
      parsed.algorithm !== 'AES-GCM' ||
      typeof parsed.iv !== 'string' ||
      typeof parsed.ciphertext !== 'string' ||
      typeof parsed.hasAdditionalData !== 'boolean'
    ) {
      throw new EncryptionFormatError('Malformed AES-GCM envelope');
    }
    const iv = decodeBase64Url(parsed.iv);
    const ciphertext = decodeBase64Url(parsed.ciphertext);
    if (iv.byteLength !== 12 || ciphertext.byteLength < 16) {
      throw new EncryptionFormatError('Malformed AES-GCM envelope');
    }
    return parsed as AesGcmEnvelopeV1;
  } catch (error) {
    if (error instanceof EncryptionFormatError) throw error;
    throw new EncryptionFormatError('Malformed AES-GCM envelope', { cause: error });
  }
};

/**
 * Authentically encrypts a supported JSON-domain value with AES-GCM.
 * A fresh random 96-bit IV is generated for every token. Raw keys must be
 * 128, 192, or 256 bits; password strings are intentionally unsupported.
 */
export const encryptAesGcm = async <T>(
  value: T,
  key: CryptoKey | Uint8Array,
  options: AesGcmEncryptOptions = {},
): Promise<string> => {
  const cryptoApi = getCryptoApi();
  if (typeof cryptoApi.getRandomValues !== 'function') throw new SecureRandomUnavailableError();
  const cryptoKey = await importAesKey(key, 'encrypt');
  let iv: Uint8Array;
  try {
    iv = cryptoApi.getRandomValues(new Uint8Array(12));
  } catch (cause) {
    throw new SecureRandomUnavailableError({ cause });
  }
  const additionalData = normalizeAdditionalData(options.additionalData);
  const algorithm: AesGcmParams = { name: 'AES-GCM', iv, tagLength: 128 };
  if (additionalData) algorithm.additionalData = additionalData;
  const plaintext = encodeUtf8(stableStringify(value));
  let ciphertext: ArrayBuffer;
  try {
    ciphertext = await cryptoApi.subtle.encrypt(algorithm, cryptoKey, plaintext);
  } catch (cause) {
    throw new ValidationError('The supplied AES-GCM key is not valid for encryption', { cause });
  }
  const envelope: AesGcmEnvelopeV1 = {
    version: 1,
    algorithm: 'AES-GCM',
    iv: encodeBase64Url(iv),
    ciphertext: encodeBase64Url(new Uint8Array(ciphertext)),
    hasAdditionalData: additionalData !== undefined,
  };
  return AES_GCM_TOKEN_PREFIX + encodeBase64Url(encodeUtf8(JSON.stringify(envelope)));
};

/** Authenticates and decrypts an `sdcore.aesgcm.v1` token before parsing plaintext JSON. */
export const decryptAesGcm = async <T>(
  token: string,
  key: CryptoKey | Uint8Array,
  options: AesGcmDecryptOptions = {},
): Promise<T> => {
  const envelope = parseAesGcmEnvelope(token);
  const additionalData = normalizeAdditionalData(options.additionalData);
  if (envelope.hasAdditionalData && additionalData === undefined) {
    throw new EncryptionAuthenticationError();
  }
  const algorithm: AesGcmParams = {
    name: 'AES-GCM',
    iv: decodeBase64Url(envelope.iv),
    tagLength: 128,
  };
  if (additionalData) algorithm.additionalData = additionalData;
  try {
    const keyForDecryption = await importAesKey(key, 'decrypt');
    const plaintext = await getCryptoApi().subtle.decrypt(
      algorithm,
      keyForDecryption,
      decodeBase64Url(envelope.ciphertext),
    );
    try {
      return JSON.parse(decodeUtf8(new Uint8Array(plaintext))) as T;
    } catch (error) {
      throw new EncryptionFormatError('Authenticated plaintext is not valid JSON', { cause: error });
    }
  } catch (error) {
    if (error instanceof EncryptionFormatError || error instanceof ValidationError) throw error;
    const errorName = typeof error === 'object' && error !== null && 'name' in error
      ? String((error as { name: unknown }).name)
      : '';
    if (error instanceof TypeError || ['InvalidAccessError', 'DataError', 'SyntaxError', 'NotSupportedError'].includes(errorName)) {
      throw new ValidationError('The supplied AES-GCM key is not valid for decryption', { cause: error });
    }
    throw new EncryptionAuthenticationError({ cause: error });
  }
};

const convertToSnakeCaseCode = (name: string): string => {
  if (typeof name !== 'string') throw new Error('Invalid name');
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
};

const generateUniqueCode = (name: string, existingCodes: string[]): string => {
  const baseCode = convertToSnakeCaseCode(name);
  if (!existingCodes.includes(baseCode)) return baseCode;
  let index = 1;
  let newCode = `${baseCode}_${index}`;
  while (existingCodes.includes(newCode)) { index++; newCode = `${baseCode}_${index}`; }
  return newCode;
};

const sha256 = async (input: string): Promise<string> => {
  const buffer = new TextEncoder().encode(input);
  const hash = await getCryptoApi().subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hash);
  return encodeBase64Url(bytes);
};

export const StringUtilities = {
  REGEX_EMAIL, REGEX_PHONE, REGEX_VN_PHONE, REGEX_VN_ID, REGEX_PASSPORT, REGEX_VN_ID_OR_PASSPORT, REGEX_TIME,
  REGEX_URL, REGEX_DOMAIN, REGEX_IPV4, REGEX_IPV6, REGEX_IMAGE_URL, REGEX_SLUG,
  REGEX_NUMBER, REGEX_INTEGER, REGEX_DECIMAL, REGEX_POSITIVE_NUMBER,
  REGEX_UUID, REGEX_CODE_16, REGEX_CODE_32, REGEX_HEX_COLOR, REGEX_BASE64,
  changeAliasLowerCase, aliasIncludes,
  format, templateToDisplay, parseExpression,
  /** Reversibly obfuscates JSON using the legacy wire format; it is not a security control. */
  obfuscate,
  /** Decodes values produced by `obfuscate` or the legacy `encrypt` alias. */
  deobfuscate,
  /**
   * Legacy obfuscation with unchanged v1.1.x bytes and no confidentiality, integrity,
   * or authentication. Never use it for secrets, authorization, tokens, signed state, or PII.
   * @deprecated Use `obfuscate` for legacy naming or `encryptAesGcm` for authenticated
   * encryption. Existing payloads must not be passed directly to the AES-GCM API.
   */
  encrypt,
  /**
   * Decodes the unchanged v1.1.x obfuscation format; it provides no authentication.
   * @deprecated Use `deobfuscate` for legacy payloads or `decryptAesGcm` for AES-GCM
   * tokens. The two wire formats are intentionally not interchangeable.
   */
  decrypt,
  /** Encrypts a supported JSON-domain value with a fresh-IV, versioned AES-GCM token. */
  encryptAesGcm,
  /** Authenticates and decrypts a versioned AES-GCM token before parsing its JSON. */
  decryptAesGcm,
  isNullOrEmpty, isNullOrWhiteSpace,
  convertToSnakeCaseCode, generateUniqueCode, sha256,
};
