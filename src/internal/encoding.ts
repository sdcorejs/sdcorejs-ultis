const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Encodes bytes as unpadded RFC 4648 base64url without relying on Node `Buffer`. */
export const encodeBase64Url = (bytes: Uint8Array): string => {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const hasB = index + 1 < bytes.length;
    const hasC = index + 2 < bytes.length;
    const b = hasB ? bytes[index + 1] : 0;
    const c = hasC ? bytes[index + 2] : 0;
    const value = (a << 16) | (b << 8) | c;
    output += BASE64_ALPHABET[(value >>> 18) & 63];
    output += BASE64_ALPHABET[(value >>> 12) & 63];
    if (hasB) output += BASE64_ALPHABET[(value >>> 6) & 63];
    if (hasC) output += BASE64_ALPHABET[value & 63];
  }
  return output.replace(/\+/g, '-').replace(/\//g, '_');
};

/** Decodes strict, unpadded base64url bytes without relying on Node `Buffer`. */
export const decodeBase64Url = (value: string): Uint8Array => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]*$/.test(value) || value.length % 4 === 1) {
    throw new TypeError('Invalid base64url encoding');
  }
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const bytes: number[] = [];
  for (let index = 0; index < normalized.length; index += 4) {
    const chars = normalized.slice(index, index + 4);
    const values = [...chars].map(char => BASE64_ALPHABET.indexOf(char));
    if (values.some(item => item < 0)) throw new TypeError('Invalid base64url encoding');
    const a = values[0];
    const b = values[1];
    const c = values[2] ?? 0;
    const d = values[3] ?? 0;
    const combined = (a << 18) | (b << 12) | (c << 6) | d;
    bytes.push((combined >>> 16) & 255);
    if (chars.length >= 3) bytes.push((combined >>> 8) & 255);
    if (chars.length === 4) bytes.push(combined & 255);
  }
  const decoded = Uint8Array.from(bytes);
  if (encodeBase64Url(decoded) !== value) throw new TypeError('Invalid base64url encoding');
  return decoded;
};

/** Encodes a JavaScript string as UTF-8 bytes. */
export const encodeUtf8 = (value: string): Uint8Array => new TextEncoder().encode(value);

/** Decodes UTF-8 bytes and rejects malformed byte sequences. */
export const decodeUtf8 = (value: Uint8Array): string => new TextDecoder('utf-8', { fatal: true }).decode(value);

/** Converts bytes to lowercase hexadecimal. */
export const encodeHex = (bytes: Uint8Array): string =>
  [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
