import { describe, it, expect } from 'vitest';
import { ValidationUtilities } from './validation.fns';

// ─────────────────────────────────────────────
// validate() — generic dispatcher
// ─────────────────────────────────────────────
describe('ValidationUtilities.validate', () => {
  it('EMAIL hợp lệ trả về true', () => expect(ValidationUtilities.validate('EMAIL', 'user@example.com')).toBe(true));
  it('EMAIL không hợp lệ trả về false', () => expect(ValidationUtilities.validate('EMAIL', 'not-an-email')).toBe(false));
  it('VN_PHONE hợp lệ trả về true', () => expect(ValidationUtilities.validate('VN_PHONE', '0912345678')).toBe(true));
  it('VN_ID hợp lệ trả về true', () => expect(ValidationUtilities.validate('VN_ID', '001234567890')).toBe(true));
  it('UUID hợp lệ trả về true', () => expect(ValidationUtilities.validate('UUID', '550e8400-e29b-41d4-a716-446655440000')).toBe(true));
  it('URL hợp lệ trả về true', () => expect(ValidationUtilities.validate('URL', 'https://example.com')).toBe(true));
  it('chuỗi rỗng luôn false', () => expect(ValidationUtilities.validate('EMAIL', '')).toBe(false));
  it('null luôn false', () => expect(ValidationUtilities.validate('NUMBER', null as unknown as string)).toBe(false));
});

// ─────────────────────────────────────────────
// isVnPhone / isVnId / isPassport / isVnIdOrPassport
// ─────────────────────────────────────────────
describe('ValidationUtilities.isVnPhone', () => {
  it('chấp nhận 0912345678', () => expect(ValidationUtilities.isVnPhone('0912345678')).toBe(true));
  it('chấp nhận +84912345678', () => expect(ValidationUtilities.isVnPhone('+84912345678')).toBe(true));
  it('từ chối đầu số không hợp lệ 0112345678', () => expect(ValidationUtilities.isVnPhone('0112345678')).toBe(false));
  it('từ chối null', () => expect(ValidationUtilities.isVnPhone(null)).toBe(false));
});

describe('ValidationUtilities.isVnId', () => {
  it('chấp nhận CCCD 12 chữ số', () => expect(ValidationUtilities.isVnId('001234567890')).toBe(true));
  it('từ chối 11 chữ số', () => expect(ValidationUtilities.isVnId('01234567890')).toBe(false));
  it('từ chối chứa chữ', () => expect(ValidationUtilities.isVnId('A01234567890')).toBe(false));
});

describe('ValidationUtilities.isPassport', () => {
  it('chấp nhận B1234567', () => expect(ValidationUtilities.isPassport('B1234567')).toBe(true));
  it('từ chối 2 chữ cái đầu AA123456', () => expect(ValidationUtilities.isPassport('AA123456')).toBe(false));
  it('từ chối chữ thường b1234567', () => expect(ValidationUtilities.isPassport('b1234567')).toBe(false));
});

describe('ValidationUtilities.isVnIdOrPassport', () => {
  it('chấp nhận CCCD 12 chữ số', () => expect(ValidationUtilities.isVnIdOrPassport('001234567890')).toBe(true));
  it('chấp nhận hộ chiếu B1234567', () => expect(ValidationUtilities.isVnIdOrPassport('B1234567')).toBe(true));
  it('từ chối chuỗi không khớp cả hai dạng', () => expect(ValidationUtilities.isVnIdOrPassport('INVALID')).toBe(false));
});

// ─────────────────────────────────────────────
// isTime
// ─────────────────────────────────────────────
describe('ValidationUtilities.isTime', () => {
  it('chấp nhận 09:30', () => expect(ValidationUtilities.isTime('09:30')).toBe(true));
  it('chấp nhận 00:00', () => expect(ValidationUtilities.isTime('00:00')).toBe(true));
  it('chấp nhận 23:59', () => expect(ValidationUtilities.isTime('23:59')).toBe(true));
  it('từ chối 24:00', () => expect(ValidationUtilities.isTime('24:00')).toBe(false));
  it('từ chối thiếu phút', () => expect(ValidationUtilities.isTime('9')).toBe(false));
  it('từ chối chuỗi rỗng', () => expect(ValidationUtilities.isTime('')).toBe(false));
});

// ─────────────────────────────────────────────
// isUrl / isDomain / isIpv4 / isImageUrl / isSlug
// ─────────────────────────────────────────────
describe('ValidationUtilities.isUrl', () => {
  it('chấp nhận https://example.com', () => expect(ValidationUtilities.isUrl('https://example.com')).toBe(true));
  it('chấp nhận http://sub.domain.org/path', () => expect(ValidationUtilities.isUrl('http://sub.domain.org/path')).toBe(true));
  it('từ chối thiếu scheme', () => expect(ValidationUtilities.isUrl('example.com')).toBe(false));
  it('từ chối null', () => expect(ValidationUtilities.isUrl(null)).toBe(false));

  it('accepts same-origin relative paths but rejects network-path and backslash origin changes', () => {
    const options = { allowRelative: true, baseUrl: 'https://app.example/base/' } as const;

    expect(ValidationUtilities.isUrl('../reports/1', options)).toBe(true);
    expect(ValidationUtilities.isUrl('/reports/1', options)).toBe(true);
    expect(ValidationUtilities.isUrl('//evil.example/reports/1', options)).toBe(false);
    expect(ValidationUtilities.isUrl('\\\\evil.example\\reports\\1', options)).toBe(false);
  });
});

describe('ValidationUtilities.isDomain', () => {
  it('chấp nhận example.com', () => expect(ValidationUtilities.isDomain('example.com')).toBe(true));
  it('chấp nhận sub.example.co.uk', () => expect(ValidationUtilities.isDomain('sub.example.co.uk')).toBe(true));
  it('từ chối localhost', () => expect(ValidationUtilities.isDomain('localhost')).toBe(false));
});

describe('ValidationUtilities.isIpv4', () => {
  it('chấp nhận 192.168.1.1', () => expect(ValidationUtilities.isIpv4('192.168.1.1')).toBe(true));
  it('chấp nhận 255.255.255.255', () => expect(ValidationUtilities.isIpv4('255.255.255.255')).toBe(true));
  it('từ chối 256.0.0.1', () => expect(ValidationUtilities.isIpv4('256.0.0.1')).toBe(false));
  it('từ chối thiếu octet', () => expect(ValidationUtilities.isIpv4('192.168.1')).toBe(false));
});

describe('ValidationUtilities.isImageUrl', () => {
  it('chấp nhận https://cdn.example.com/img.png', () => expect(ValidationUtilities.isImageUrl('https://cdn.example.com/img.png')).toBe(true));
  it('chấp nhận đuôi .webp', () => expect(ValidationUtilities.isImageUrl('https://cdn.example.com/photo.webp')).toBe(true));
  it('từ chối đuôi .pdf', () => expect(ValidationUtilities.isImageUrl('https://cdn.example.com/file.pdf')).toBe(false));
});

describe('ValidationUtilities.isSlug', () => {
  it('chấp nhận hello-world', () => expect(ValidationUtilities.isSlug('hello-world')).toBe(true));
  it('từ chối chứa chữ hoa', () => expect(ValidationUtilities.isSlug('Hello')).toBe(false));
  it('từ chối dấu gạch đầu -hello', () => expect(ValidationUtilities.isSlug('-hello')).toBe(false));
  it('từ chối dấu gạch đôi hello--world', () => expect(ValidationUtilities.isSlug('hello--world')).toBe(false));
});

// ─────────────────────────────────────────────
// Numeric validators
// ─────────────────────────────────────────────
describe('ValidationUtilities.isNumber', () => {
  it('chấp nhận 42', () => expect(ValidationUtilities.isNumber('42')).toBe(true));
  it('chấp nhận -3.14', () => expect(ValidationUtilities.isNumber('-3.14')).toBe(true));
  it('từ chối chữ', () => expect(ValidationUtilities.isNumber('abc')).toBe(false));
  it('từ chối rỗng', () => expect(ValidationUtilities.isNumber('')).toBe(false));
});

describe('ValidationUtilities.isInteger', () => {
  it('chấp nhận -99', () => expect(ValidationUtilities.isInteger('-99')).toBe(true));
  it('từ chối 1.5', () => expect(ValidationUtilities.isInteger('1.5')).toBe(false));
});

describe('ValidationUtilities.isDecimal', () => {
  it('chấp nhận 3.14', () => expect(ValidationUtilities.isDecimal('3.14')).toBe(true));
  it('từ chối số nguyên 5', () => expect(ValidationUtilities.isDecimal('5')).toBe(false));
});

describe('ValidationUtilities.isPositiveNumber', () => {
  it('chấp nhận 0', () => expect(ValidationUtilities.isPositiveNumber('0')).toBe(true));
  it('từ chối -1', () => expect(ValidationUtilities.isPositiveNumber('-1')).toBe(false));
});

// ─────────────────────────────────────────────
// Identifier validators
// ─────────────────────────────────────────────
describe('ValidationUtilities.isUuid', () => {
  it('chấp nhận UUID lowercase', () => expect(ValidationUtilities.isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true));
  it('chấp nhận UUID chữ hoa', () => expect(ValidationUtilities.isUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true));
  it('từ chối thiếu dấu gạch ngang', () => expect(ValidationUtilities.isUuid('550e8400e29b41d4a716446655440000')).toBe(false));
});

describe('ValidationUtilities.isCode16', () => {
  it('chấp nhận 16 ký tự', () => expect(ValidationUtilities.isCode16('ABCDEF1234567890')).toBe(true));
  it('từ chối 15 ký tự', () => expect(ValidationUtilities.isCode16('ABCDEF123456789')).toBe(false));
  it('từ chối ký tự đặc biệt', () => expect(ValidationUtilities.isCode16('ABCDEF12345678!!')).toBe(false));
});

describe('ValidationUtilities.isCode32', () => {
  it('chấp nhận 32 ký tự', () => expect(ValidationUtilities.isCode32('ABCDEF1234567890abcdef1234567890')).toBe(true));
  it('từ chối 31 ký tự', () => expect(ValidationUtilities.isCode32('ABCDEF1234567890abcdef123456789')).toBe(false));
});

describe('ValidationUtilities.isHexColor', () => {
  it('chấp nhận #1A2B3C', () => expect(ValidationUtilities.isHexColor('#1A2B3C')).toBe(true));
  it('chấp nhận #F0A (short form)', () => expect(ValidationUtilities.isHexColor('#F0A')).toBe(true));
  it('từ chối thiếu #', () => expect(ValidationUtilities.isHexColor('1A2B3C')).toBe(false));
  it('từ chối ký tự ngoài hex', () => expect(ValidationUtilities.isHexColor('#GGGGGG')).toBe(false));
});

describe('ValidationUtilities.isBase64', () => {
  it('chấp nhận SGVsbG8=', () => expect(ValidationUtilities.isBase64('SGVsbG8=')).toBe(true));
  it('từ chối ký tự đặc biệt SGVs!G8=', () => expect(ValidationUtilities.isBase64('SGVs!G8=')).toBe(false));
  it('từ chối rỗng', () => expect(ValidationUtilities.isBase64('')).toBe(false));
});

describe('ValidationUtilities.isCode', () => {
  it('chấp nhận code@_-name (2–20 chars)', () => expect(ValidationUtilities.isCode('code@_-name')).toBe(true));
  it('từ chối 1 ký tự', () => expect(ValidationUtilities.isCode('a')).toBe(false));
  it('từ chối 21 ký tự', () => expect(ValidationUtilities.isCode('a'.repeat(21))).toBe(false));
  it('từ chối khoảng trắng', () => expect(ValidationUtilities.isCode('my code')).toBe(false));
  it('từ chối null', () => expect(ValidationUtilities.isCode(null)).toBe(false));
});
