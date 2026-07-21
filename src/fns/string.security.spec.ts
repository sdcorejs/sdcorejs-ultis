import { describe, expect, it } from 'vitest';
import {
  EncryptionAuthenticationError,
  EncryptionFormatError,
  UnsupportedSerializationTypeError,
  UnsafePropertyPathError,
  ValidationError,
} from '../errors';
import { StringUtilities } from './string.fns';

const decodeBase64Url = (value: string): Uint8Array => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0));
};

const encodeBase64Url = (value: Uint8Array): string => {
  let binary = '';
  value.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const mutateEnvelope = (token: string, key: 'iv' | 'ciphertext'): string => {
  const prefix = 'sdcore.aesgcm.v1.';
  const envelope = JSON.parse(new TextDecoder().decode(decodeBase64Url(token.slice(prefix.length))));
  const bytes = decodeBase64Url(envelope[key]);
  bytes[0] ^= 1;
  envelope[key] = encodeBase64Url(bytes);
  return prefix + encodeBase64Url(new TextEncoder().encode(JSON.stringify(envelope)));
};

const makeNonCanonicalBase64Url = (value: string): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  if (value.length % 4 !== 2 && value.length % 4 !== 3) throw new Error('Test value has no pad bits');
  const index = alphabet.indexOf(value.at(-1) as string);
  return value.slice(0, -1) + alphabet[index | 1];
};

const mutateEnvelopePadBits = (token: string, key: 'iv' | 'ciphertext'): string => {
  const prefix = 'sdcore.aesgcm.v1.';
  const envelope = JSON.parse(new TextDecoder().decode(decodeBase64Url(token.slice(prefix.length))));
  envelope[key] = makeNonCanonicalBase64Url(envelope[key]);
  return prefix + encodeBase64Url(new TextEncoder().encode(JSON.stringify(envelope)));
};

describe('legacy obfuscation compatibility', () => {
  it('preserves fixed v1.1.x payload vectors and accurate aliases', () => {
    const token = 'cb9f4b2a-d26c-4787-a66e-e7130ee00f95%7D%22id%22:1,%22name%22:%22Alice%22,%22active%22:true%7B';
    expect(StringUtilities.encrypt({ id: 1, name: 'Alice', active: true })).toBe(token);
    expect(StringUtilities.obfuscate({ id: 1, name: 'Alice', active: true })).toBe(token);
    expect(StringUtilities.decrypt(token)).toEqual({ id: 1, name: 'Alice', active: true });
    expect(StringUtilities.deobfuscate(token)).toEqual({ id: 1, name: 'Alice', active: true });
  });
});

describe('StringUtilities AES-GCM', () => {
  const key = new Uint8Array(32).fill(7);

  it('round-trips and uses a unique random IV for each token', async () => {
    const first = await StringUtilities.encryptAesGcm({ role: 'user' }, key);
    const second = await StringUtilities.encryptAesGcm({ role: 'user' }, key);
    expect(first).toMatch(/^sdcore\.aesgcm\.v1\.[A-Za-z0-9_-]+$/);
    expect(second).not.toBe(first);
    await expect(StringUtilities.decryptAesGcm(first, key)).resolves.toEqual({ role: 'user' });
  });

  it('accepts a valid AES-GCM CryptoKey', async () => {
    const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt', 'decrypt']);
    const token = await StringUtilities.encryptAesGcm('secret', cryptoKey);
    await expect(StringUtilities.decryptAesGcm(token, cryptoKey)).resolves.toBe('secret');
  });

  it('rejects wrong keys, ciphertext changes, IV changes, and AAD changes', async () => {
    const token = await StringUtilities.encryptAesGcm({ ok: true }, key, { additionalData: 'tenant-a' });
    await expect(StringUtilities.decryptAesGcm(token, new Uint8Array(32).fill(8), { additionalData: 'tenant-a' }))
      .rejects.toBeInstanceOf(EncryptionAuthenticationError);
    await expect(StringUtilities.decryptAesGcm(mutateEnvelope(token, 'ciphertext'), key, { additionalData: 'tenant-a' }))
      .rejects.toBeInstanceOf(EncryptionAuthenticationError);
    await expect(StringUtilities.decryptAesGcm(mutateEnvelope(token, 'iv'), key, { additionalData: 'tenant-a' }))
      .rejects.toBeInstanceOf(EncryptionAuthenticationError);
    await expect(StringUtilities.decryptAesGcm(token, key, { additionalData: 'tenant-b' }))
      .rejects.toBeInstanceOf(EncryptionAuthenticationError);
  });

  it('rejects malformed and unsupported token versions with typed errors', async () => {
    await expect(StringUtilities.decryptAesGcm('not-a-token', key)).rejects.toBeInstanceOf(EncryptionFormatError);
    await expect(StringUtilities.decryptAesGcm('sdcore.aesgcm.v2.abc', key)).rejects.toBeInstanceOf(EncryptionFormatError);
  });

  it('rejects noncanonical base64url pad bits and fake CryptoKeys', async () => {
    const token = await StringUtilities.encryptAesGcm('x', key);
    await expect(StringUtilities.decryptAesGcm(mutateEnvelopePadBits(token, 'ciphertext'), key))
      .rejects.toBeInstanceOf(EncryptionFormatError);

    const fakeKey = {
      type: 'secret',
      algorithm: { name: 'AES-GCM' },
      usages: ['encrypt', 'decrypt'],
    } as unknown as CryptoKey;
    await expect(StringUtilities.encryptAesGcm('secret', fakeKey)).rejects.toBeInstanceOf(ValidationError);
    await expect(StringUtilities.decryptAesGcm(token, fakeKey)).rejects.toBeInstanceOf(ValidationError);
  });

  it('does not misclassify unsupported plaintext as a key failure', async () => {
    await expect(StringUtilities.encryptAesGcm(undefined, key))
      .rejects.toBeInstanceOf(UnsupportedSerializationTypeError);
  });
});

describe('safe literal string replacement', () => {
  it.each(['$&', '$1', '$`', "$'"])('inserts replacement %s literally', replacement => {
    expect(StringUtilities.format('x{0}y', replacement)).toBe(`x${replacement}y`);
    expect(StringUtilities.templateToDisplay('x${value}y', { value: replacement })).toBe(`x${replacement}y`);
  });

  it('does not re-evaluate or unescape placeholders introduced by a replacement', () => {
    expect(StringUtilities.format(
      'user={0}; secret={1}',
      '{1}',
      'TOP-SECRET',
    )).toBe('user={1}; secret=TOP-SECRET');
    expect(StringUtilities.format('value={0}', '\\{1}')).toBe('value=\\{1}');
    expect(StringUtilities.templateToDisplay('value=${value}', {
      value: '\\${secret}',
      secret: 'TOP-SECRET',
    })).toBe('value=\\${secret}');
  });

  it('does not read inherited properties or invoke getters', () => {
    const inherited = Object.create({ secret: 'no' });
    expect(StringUtilities.templateToDisplay('${secret}', inherited)).toBe('');
    let called = false;
    const getter = Object.defineProperty({}, 'secret', { get: () => { called = true; return 'no'; } });
    expect(StringUtilities.templateToDisplay('${secret}', getter)).toBe('');
    expect(called).toBe(false);
  });

  it('rejects prototype-sensitive paths', () => {
    expect(() => StringUtilities.templateToDisplay('${constructor.prototype}', {}))
      .toThrow(UnsafePropertyPathError);
  });

  it('leaves escaped placeholders literal', () => {
    expect(StringUtilities.format('\\{0} {0}', 'value')).toBe('{0} value');
    expect(StringUtilities.templateToDisplay('\\${value} ${value}', { value: 'ok' })).toBe('${value} ok');
  });
});
