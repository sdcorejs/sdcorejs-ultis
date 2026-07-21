import { describe, it, expect } from 'vitest';
import { StringUtilities } from './string.fns';
import { ValidationUtilities } from './validation.fns';

// ─────────────────────────────────────────────
// isValidEmail
// ─────────────────────────────────────────────
describe('ValidationUtilities.isEmail', () => {
  it('chấp nhận email hợp lệ đơn giản', () => {
    expect(ValidationUtilities.isEmail('test@example.com')).toBe(true);
  });

  it('chấp nhận email có subdomain', () => {
    expect(ValidationUtilities.isEmail('user@mail.example.co.uk')).toBe(true);
  });

  it('chấp nhận email có dấu chấm trong local-part', () => {
    expect(ValidationUtilities.isEmail('first.last@example.org')).toBe(true);
  });

  it('chấp nhận email có dấu + trong local-part', () => {
    expect(ValidationUtilities.isEmail('user+tag@example.com')).toBe(true);
  });

  it('từ chối thiếu ký tự @', () => {
    expect(ValidationUtilities.isEmail('notanemail.com')).toBe(false);
  });

  it('từ chối thiếu domain sau @', () => {
    expect(ValidationUtilities.isEmail('user@')).toBe(false);
  });

  it('từ chối thiếu local-part trước @', () => {
    expect(ValidationUtilities.isEmail('@example.com')).toBe(false);
  });

  it('từ chối domain không có TLD', () => {
    expect(ValidationUtilities.isEmail('user@localhost')).toBe(false);
  });

  it('từ chối chuỗi rỗng', () => {
    expect(ValidationUtilities.isEmail('')).toBe(false);
  });

  it('từ chối null', () => {
    expect(ValidationUtilities.isEmail(null)).toBe(false);
  });

  it('từ chối undefined', () => {
    expect(ValidationUtilities.isEmail(undefined)).toBe(false);
  });

  it('từ chối hai ký tự @', () => {
    expect(ValidationUtilities.isEmail('a@@b.com')).toBe(false);
  });

  it('từ chối khoảng trắng bên trong', () => {
    expect(ValidationUtilities.isEmail('user @example.com')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// isValidPhone
// ─────────────────────────────────────────────
describe('ValidationUtilities.isPhone', () => {
  it('chấp nhận số quốc tế +84', () => {
    expect(ValidationUtilities.isPhone('+84901234567')).toBe(true);
  });

  it('chấp nhận số Việt Nam bắt đầu bằng 0', () => {
    expect(ValidationUtilities.isPhone('0901234567')).toBe(true);
  });

  it('chấp nhận số quốc tế dạng +1 (US)', () => {
    expect(ValidationUtilities.isPhone('+12025551234')).toBe(true);
  });

  it('chấp nhận số có dấu gạch nối', () => {
    expect(ValidationUtilities.isPhone('+1-202-555-1234')).toBe(true);
  });

  it('chấp nhận số có khoảng trắng', () => {
    expect(ValidationUtilities.isPhone('+1 202 555 1234')).toBe(true);
  });

  it('chấp nhận số có ngoặc đơn', () => {
    expect(ValidationUtilities.isPhone('(028) 3812-3456')).toBe(true);
  });

  it('từ chối chuỗi rỗng', () => {
    expect(ValidationUtilities.isPhone('')).toBe(false);
  });

  it('từ chối null', () => {
    expect(ValidationUtilities.isPhone(null)).toBe(false);
  });

  it('từ chối undefined', () => {
    expect(ValidationUtilities.isPhone(undefined)).toBe(false);
  });

  it('từ chối chuỗi chỉ có chữ', () => {
    expect(ValidationUtilities.isPhone('abcdef')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// isValidCode
// ─────────────────────────────────────────────
describe('ValidationUtilities.isCode', () => {
  it('chấp nhận mã tối thiểu 2 ký tự', () => {
    expect(ValidationUtilities.isCode('ab')).toBe(true);
  });

  it('chấp nhận mã tối đa 20 ký tự', () => {
    expect(ValidationUtilities.isCode('a'.repeat(20))).toBe(true);
  });

  it('chấp nhận chữ hoa và chữ thường trộn nhau', () => {
    expect(ValidationUtilities.isCode('ABCabc123')).toBe(true);
  });

  it('chấp nhận ký tự đặc biệt @ _ -', () => {
    expect(ValidationUtilities.isCode('code@_-name')).toBe(true);
  });

  it('từ chối mã chỉ 1 ký tự (dưới tối thiểu)', () => {
    expect(ValidationUtilities.isCode('a')).toBe(false);
  });

  it('từ chối mã 21 ký tự (trên tối đa)', () => {
    expect(ValidationUtilities.isCode('a'.repeat(21))).toBe(false);
  });

  it('từ chối chuỗi rỗng', () => {
    expect(ValidationUtilities.isCode('')).toBe(false);
  });

  it('từ chối null', () => {
    expect(ValidationUtilities.isCode(null)).toBe(false);
  });

  it('từ chối undefined', () => {
    expect(ValidationUtilities.isCode(undefined)).toBe(false);
  });

  it('từ chối ký tự đặc biệt không được phép như !, #, $', () => {
    expect(ValidationUtilities.isCode('code!')).toBe(false);
    expect(ValidationUtilities.isCode('co#de')).toBe(false);
    expect(ValidationUtilities.isCode('co$de')).toBe(false);
  });

  it('từ chối khoảng trắng', () => {
    expect(ValidationUtilities.isCode('my code')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// isNullOrEmpty
// ─────────────────────────────────────────────
describe('StringUtilities.isNullOrEmpty', () => {
  it('trả về true cho null', () => {
    expect(StringUtilities.isNullOrEmpty(null)).toBe(true);
  });

  it('trả về true cho undefined', () => {
    expect(StringUtilities.isNullOrEmpty(undefined)).toBe(true);
  });

  it('trả về true cho chuỗi rỗng', () => {
    expect(StringUtilities.isNullOrEmpty('')).toBe(true);
  });

  // Khoảng trắng KHÔNG phải rỗng theo định nghĩa isNullOrEmpty
  it('trả về false cho chuỗi chỉ có khoảng trắng (không phải rỗng)', () => {
    expect(StringUtilities.isNullOrEmpty(' ')).toBe(false);
  });

  it('trả về false cho chuỗi có nội dung', () => {
    expect(StringUtilities.isNullOrEmpty('hello')).toBe(false);
  });

  it('trả về false cho số 0', () => {
    expect(StringUtilities.isNullOrEmpty(0)).toBe(false);
  });

  it('trả về false cho false (boolean)', () => {
    expect(StringUtilities.isNullOrEmpty(false)).toBe(false);
  });

  it('trả về false cho mảng rỗng (không phải chuỗi rỗng)', () => {
    expect(StringUtilities.isNullOrEmpty([])).toBe(false);
  });
});

// ─────────────────────────────────────────────
// isNullOrWhiteSpace
// ─────────────────────────────────────────────
describe('StringUtilities.isNullOrWhiteSpace', () => {
  it('trả về true cho null', () => {
    expect(StringUtilities.isNullOrWhiteSpace(null)).toBe(true);
  });

  it('trả về true cho undefined', () => {
    expect(StringUtilities.isNullOrWhiteSpace(undefined)).toBe(true);
  });

  it('trả về true cho chuỗi rỗng', () => {
    expect(StringUtilities.isNullOrWhiteSpace('')).toBe(true);
  });

  it('trả về true cho chuỗi chỉ có khoảng trắng', () => {
    expect(StringUtilities.isNullOrWhiteSpace('   ')).toBe(true);
  });

  it('trả về true cho chuỗi chỉ có tab', () => {
    expect(StringUtilities.isNullOrWhiteSpace('\t')).toBe(true);
  });

  it('trả về true cho chuỗi chỉ có newline', () => {
    expect(StringUtilities.isNullOrWhiteSpace('\n')).toBe(true);
  });

  it('trả về true cho kiểu không phải string (number) — không phải string nên coi như whitespace', () => {
    expect(StringUtilities.isNullOrWhiteSpace(42 as any)).toBe(true);
  });

  it('trả về true cho kiểu object', () => {
    expect(StringUtilities.isNullOrWhiteSpace({} as any)).toBe(true);
  });

  it('trả về false cho chuỗi có nội dung', () => {
    expect(StringUtilities.isNullOrWhiteSpace('hello')).toBe(false);
  });

  it('trả về false cho chuỗi có ký tự lẫn khoảng trắng', () => {
    expect(StringUtilities.isNullOrWhiteSpace('  a  ')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// changeAliasLowerCase
// ─────────────────────────────────────────────
describe('StringUtilities.changeAliasLowerCase', () => {
  it('loại bỏ dấu nguyên âm a (à á ạ ả ã â ầ ấ ậ ẩ ẫ ă ằ ắ ặ ẳ ẵ)', () => {
    expect(StringUtilities.changeAliasLowerCase('àáạảãâầấậẩẫăằắặẳẵ')).toBe('aaaaaaaaaaaaaaaa'.padEnd(17, 'a').slice(0, 17));
    // Kiểm tra cụ thể từng nhóm
    expect(StringUtilities.changeAliasLowerCase('à')).toBe('a');
    expect(StringUtilities.changeAliasLowerCase('á')).toBe('a');
    expect(StringUtilities.changeAliasLowerCase('ạ')).toBe('a');
    expect(StringUtilities.changeAliasLowerCase('ẵ')).toBe('a');
  });

  it('loại bỏ dấu nguyên âm e (è é ẹ ẻ ẽ ê ề ế ệ ể ễ)', () => {
    expect(StringUtilities.changeAliasLowerCase('è')).toBe('e');
    expect(StringUtilities.changeAliasLowerCase('ê')).toBe('e');
    expect(StringUtilities.changeAliasLowerCase('ệ')).toBe('e');
  });

  it('loại bỏ dấu nguyên âm i (ì í ị ỉ ĩ)', () => {
    expect(StringUtilities.changeAliasLowerCase('ì')).toBe('i');
    expect(StringUtilities.changeAliasLowerCase('ị')).toBe('i');
  });

  it('loại bỏ dấu nguyên âm o (ò ó ọ ỏ õ ô ồ ố ộ ổ ỗ ơ ờ ớ ợ ở ỡ)', () => {
    expect(StringUtilities.changeAliasLowerCase('ò')).toBe('o');
    expect(StringUtilities.changeAliasLowerCase('ơ')).toBe('o');
    expect(StringUtilities.changeAliasLowerCase('ợ')).toBe('o');
  });

  it('loại bỏ dấu nguyên âm u (ù ú ụ ủ ũ ư ừ ứ ự ử ữ)', () => {
    expect(StringUtilities.changeAliasLowerCase('ù')).toBe('u');
    expect(StringUtilities.changeAliasLowerCase('ư')).toBe('u');
    expect(StringUtilities.changeAliasLowerCase('ự')).toBe('u');
  });

  it('loại bỏ dấu nguyên âm y (ỳ ý ỵ ỷ ỹ)', () => {
    expect(StringUtilities.changeAliasLowerCase('ỳ')).toBe('y');
    expect(StringUtilities.changeAliasLowerCase('ý')).toBe('y');
  });

  it('chuyển đ/Đ thành d', () => {
    expect(StringUtilities.changeAliasLowerCase('đ')).toBe('d');
    expect(StringUtilities.changeAliasLowerCase('Đ')).toBe('d');
  });

  it('chuyển tên tiếng Việt đầy đủ thành chuỗi ASCII', () => {
    expect(StringUtilities.changeAliasLowerCase('Nguyễn Văn A')).toBe('nguyen van a');
    expect(StringUtilities.changeAliasLowerCase('Đội Kỹ Thuật')).toBe('doi ky thuat');
  });

  it('thay thế ký tự đặc biệt bằng khoảng trắng', () => {
    // !, @, %, ^, *, (, ), +, =, <, >, ?, /, , ., :, ;, \', \", &, #, [, ], ~, $, _, `, -, {, }, |, \
    const result = StringUtilities.changeAliasLowerCase('hello!world');
    expect(result).toBe('hello world');
  });

  it('xử lý null/undefined không ném lỗi', () => {
    expect(StringUtilities.changeAliasLowerCase(null)).toBe('');
    expect(StringUtilities.changeAliasLowerCase(undefined)).toBe('');
  });

  it('cắt khoảng trắng đầu cuối', () => {
    expect(StringUtilities.changeAliasLowerCase('  hello  ')).toBe('hello');
  });

  it('chuyển thành chữ thường', () => {
    expect(StringUtilities.changeAliasLowerCase('HELLO')).toBe('hello');
  });
});

// ─────────────────────────────────────────────
// aliasIncludes
// ─────────────────────────────────────────────
describe('StringUtilities.aliasIncludes', () => {
  it('tìm thấy khi alias có dấu, search không dấu', () => {
    expect(StringUtilities.aliasIncludes('Nguyễn', 'nguyen')).toBe(true);
  });

  it('tìm thấy khi cả hai đều có dấu', () => {
    expect(StringUtilities.aliasIncludes('Nguyễn Văn A', 'văn')).toBe(true);
  });

  it('tìm thấy dạng khớp một phần', () => {
    expect(StringUtilities.aliasIncludes('Trần Thị Bích', 'thi')).toBe(true);
  });

  it('không tìm thấy khi không khớp', () => {
    expect(StringUtilities.aliasIncludes('Nguyễn', 'Trần')).toBe(false);
  });

  it('tìm thấy khi search rỗng (mọi chuỗi đều chứa chuỗi rỗng)', () => {
    expect(StringUtilities.aliasIncludes('Nguyễn', '')).toBe(true);
  });

  it('không tìm thấy khi alias rỗng và search có giá trị', () => {
    expect(StringUtilities.aliasIncludes('', 'abc')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// format
// ─────────────────────────────────────────────
describe('StringUtilities.format', () => {
  it('thay thế placeholder {0} và {1}', () => {
    expect(StringUtilities.format('{0} and {1}', 'foo', 'bar')).toBe('foo and bar');
  });

  it('thay thế nhiều placeholder cùng loại', () => {
    expect(StringUtilities.format('{0} + {0} = {1}', 'A', 'B')).toBe('A + A = B');
  });

  it('không thay thế placeholder thiếu giá trị (giữ nguyên)', () => {
    // Khi chỉ truyền 1 tham số, {1} không được thay thế
    const result = StringUtilities.format('{0} and {1}', 'only-one');
    expect(result).toBe('only-one and {1}');
  });

  it('xử lý template không có placeholder', () => {
    expect(StringUtilities.format('no placeholders')).toBe('no placeholders');
  });

  it('thay thế placeholder với số', () => {
    expect(StringUtilities.format('Value: {0}', 42)).toBe('Value: 42');
  });

  it('xử lý thứ tự placeholder không liên tiếp', () => {
    expect(StringUtilities.format('{1} before {0}', 'second', 'first')).toBe('first before second');
  });
});

// ─────────────────────────────────────────────
// templateToDisplay
// ─────────────────────────────────────────────
describe('StringUtilities.templateToDisplay', () => {
  it('thay thế ${field} bằng giá trị entity', () => {
    expect(StringUtilities.templateToDisplay('Hello ${name}', { name: 'World' })).toBe('Hello World');
  });

  it('thay thế field lồng nhau ${user.name}', () => {
    expect(StringUtilities.templateToDisplay('${user.name}', { user: { name: 'Alice' } })).toBe('Alice');
  });

  it('thay thế nhiều placeholder trong cùng template', () => {
    const result = StringUtilities.templateToDisplay('${first} ${last}', { first: 'Nguyen', last: 'Van A' });
    expect(result).toBe('Nguyen Van A');
  });

  it('trả về chuỗi rỗng cho key không tồn tại trong entity', () => {
    expect(StringUtilities.templateToDisplay('${missing}', {})).toBe('');
  });

  it('trả về nguyên template khi template falsy', () => {
    expect(StringUtilities.templateToDisplay('', { name: 'x' })).toBe('');
    expect(StringUtilities.templateToDisplay(null as any, {})).toBe(null as any);
  });

  it('giữ nguyên văn bản không phải template', () => {
    expect(StringUtilities.templateToDisplay('plain text', { name: 'x' })).toBe('plain text');
  });

  it('thay thế field có giá trị số', () => {
    expect(StringUtilities.templateToDisplay('Count: ${count}', { count: 5 })).toBe('Count: 5');
  });
});

// ─────────────────────────────────────────────
// parseExpression
// ─────────────────────────────────────────────
describe('StringUtilities.parseExpression', () => {
  it('trả về giá trị field khi template là ${field}', () => {
    expect(StringUtilities.parseExpression('${name}', { name: 'Alice' })).toBe('Alice');
  });

  it('trả về giá trị field lồng nhau ${user.name}', () => {
    expect(StringUtilities.parseExpression('${user.name}', { user: { name: 'Bob' } })).toBe('Bob');
  });

  it("trả về true cho literal 'true'", () => {
    expect(StringUtilities.parseExpression('true', {})).toBe(true);
  });

  it("trả về false cho literal 'false'", () => {
    expect(StringUtilities.parseExpression('false', {})).toBe(false);
  });

  it("trả về null cho literal 'null'", () => {
    expect(StringUtilities.parseExpression('null', {})).toBeNull();
  });

  it("trả về undefined cho literal 'undefined'", () => {
    expect(StringUtilities.parseExpression('undefined', {})).toBeUndefined();
  });

  it("trả về number cho literal số nguyên '42'", () => {
    expect(StringUtilities.parseExpression('42', {})).toBe(42);
  });

  it("trả về number cho literal số âm '-3'", () => {
    expect(StringUtilities.parseExpression('-3', {})).toBe(-3);
  });

  it("trả về number cho literal thập phân '-3.5'", () => {
    expect(StringUtilities.parseExpression('-3.5', {})).toBe(-3.5);
  });

  it('fallback về templateToDisplay khi không khớp các literal', () => {
    // Chuỗi thuần không phải literal — đi qua templateToDisplay
    const result = StringUtilities.parseExpression('hello ${name}!', { name: 'World' });
    expect(result).toBe('hello World!');
  });

  it('trả về undefined khi template falsy (null/undefined/empty)', () => {
    expect(StringUtilities.parseExpression('', {})).toBeUndefined();
    expect(StringUtilities.parseExpression(null as any, {})).toBeUndefined();
  });

  it('trả về undefined khi field không tồn tại trong entity', () => {
    expect(StringUtilities.parseExpression('${missing}', {})).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// encrypt / decrypt
// ─────────────────────────────────────────────
describe('StringUtilities.encrypt / decrypt', () => {
  it('roundtrip với chuỗi đơn giản', () => {
    const original = 'hello world';
    expect(StringUtilities.decrypt(StringUtilities.encrypt(original))).toBe(original);
  });

  it('roundtrip với object', () => {
    const original = { id: 1, name: 'Alice', active: true };
    expect(StringUtilities.decrypt(StringUtilities.encrypt(original))).toEqual(original);
  });

  it('roundtrip với mảng', () => {
    const original = [1, 'two', { three: 3 }];
    expect(StringUtilities.decrypt(StringUtilities.encrypt(original))).toEqual(original);
  });

  it('roundtrip với object lồng nhau', () => {
    const original = { a: { b: { c: 'deep' } }, arr: [1, 2, 3] };
    expect(StringUtilities.decrypt(StringUtilities.encrypt(original))).toEqual(original);
  });

  it('roundtrip với số nguyên', () => {
    expect(StringUtilities.decrypt(StringUtilities.encrypt(42))).toBe(42);
  });

  it('roundtrip với null', () => {
    expect(StringUtilities.decrypt(StringUtilities.encrypt(null))).toBeNull();
  });

  it('encrypt tạo ra chuỗi khác với input gốc', () => {
    const val = { key: 'value' };
    const enc = StringUtilities.encrypt(val);
    expect(enc).not.toEqual(JSON.stringify(val));
  });

  it('decrypt ném lỗi khi chuỗi không có SALT hợp lệ', () => {
    expect(() => StringUtilities.decrypt('tampered_string')).toThrow('object cannot be decrypted');
  });
});

// ─────────────────────────────────────────────
// convertToSnakeCaseCode
// ─────────────────────────────────────────────
describe('StringUtilities.convertToSnakeCaseCode', () => {
  it("'Nguyễn Văn A' → 'nguyen_van_a'", () => {
    expect(StringUtilities.convertToSnakeCaseCode('Nguyễn Văn A')).toBe('nguyen_van_a');
  });

  it("'Hello World' → 'hello_world'", () => {
    expect(StringUtilities.convertToSnakeCaseCode('Hello World')).toBe('hello_world');
  });

  it("'đội kỹ thuật' → 'doi_ky_thuat'", () => {
    expect(StringUtilities.convertToSnakeCaseCode('đội kỹ thuật')).toBe('doi_ky_thuat');
  });

  it("'Đội Kỹ Thuật' → 'doi_ky_thuat'", () => {
    expect(StringUtilities.convertToSnakeCaseCode('Đội Kỹ Thuật')).toBe('doi_ky_thuat');
  });

  it('xử lý nhiều khoảng trắng liên tiếp thành một _', () => {
    expect(StringUtilities.convertToSnakeCaseCode('hello   world')).toBe('hello_world');
  });

  it('loại bỏ dấu _ ở đầu và cuối kết quả', () => {
    expect(StringUtilities.convertToSnakeCaseCode('  hello  ')).toBe('hello');
  });

  it('xử lý chuỗi chỉ có ASCII', () => {
    expect(StringUtilities.convertToSnakeCaseCode('simple')).toBe('simple');
  });

  it('xử lý chuỗi có ký tự đặc biệt bị bỏ', () => {
    expect(StringUtilities.convertToSnakeCaseCode('hello-world!')).toBe('hello_world');
  });

  it('ném lỗi khi input không phải string (number)', () => {
    expect(() => StringUtilities.convertToSnakeCaseCode(123 as any)).toThrow('Invalid name');
  });

  it('ném lỗi khi input là null', () => {
    expect(() => StringUtilities.convertToSnakeCaseCode(null as any)).toThrow('Invalid name');
  });

  it('ném lỗi khi input là object', () => {
    expect(() => StringUtilities.convertToSnakeCaseCode({} as any)).toThrow('Invalid name');
  });
});

// ─────────────────────────────────────────────
// generateUniqueCode
// ─────────────────────────────────────────────
describe('StringUtilities.generateUniqueCode', () => {
  it('trả về base code khi không có conflict', () => {
    expect(StringUtilities.generateUniqueCode('test', [])).toBe('test');
  });

  it('thêm _1 khi base code đã tồn tại', () => {
    expect(StringUtilities.generateUniqueCode('test', ['test'])).toBe('test_1');
  });

  it('thêm _2 khi cả base và _1 đã tồn tại', () => {
    expect(StringUtilities.generateUniqueCode('test', ['test', 'test_1'])).toBe('test_2');
  });

  it('tăng suffix cho đến khi tìm được code duy nhất', () => {
    const existing = ['test', 'test_1', 'test_2', 'test_3'];
    expect(StringUtilities.generateUniqueCode('test', existing)).toBe('test_4');
  });

  it('tự động chuyển tên tiếng Việt sang snake_case trước khi kiểm tra conflict', () => {
    expect(StringUtilities.generateUniqueCode('Nguyễn Văn A', [])).toBe('nguyen_van_a');
  });

  it('thêm suffix khi tên tiếng Việt đã convert trùng với existing', () => {
    expect(StringUtilities.generateUniqueCode('Hello World', ['hello_world'])).toBe('hello_world_1');
  });
});

// ─────────────────────────────────────────────
// sha256
// ─────────────────────────────────────────────
describe('StringUtilities.sha256', () => {
  it('cùng input → cùng hash (deterministic)', async () => {
    const h1 = await StringUtilities.sha256('hello');
    const h2 = await StringUtilities.sha256('hello');
    expect(h1).toBe(h2);
  });

  it('trả về chuỗi không rỗng', async () => {
    const hash = await StringUtilities.sha256('test');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('input khác nhau → hash khác nhau', async () => {
    const h1 = await StringUtilities.sha256('abc');
    const h2 = await StringUtilities.sha256('def');
    expect(h1).not.toBe(h2);
  });

  it('hash là URL-safe base64 (không chứa +, /, =)', async () => {
    const hash = await StringUtilities.sha256('url safe check');
    expect(hash).not.toMatch(/[+/=]/);
  });

  it('chuỗi rỗng vẫn cho ra hash hợp lệ', async () => {
    const hash = await StringUtilities.sha256('');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('hash SHA-256 của "hello" khớp với giá trị đã biết (URL-safe base64)', async () => {
    // SHA-256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
    // base64url = LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ
    const hash = await StringUtilities.sha256('hello');
    expect(hash).toBe('LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ');
  });
});

// ─────────────────────────────────────────────
// Regex patterns — REGEX_VN_PHONE / REGEX_VN_ID / REGEX_VN_ID_OR_PASSPORT
// ─────────────────────────────────────────────
describe('StringUtilities REGEX_VN_PHONE', () => {
  const re = () => new RegExp(StringUtilities.REGEX_VN_PHONE);
  it('chấp nhận SĐT Viettel 0912345678', () => expect(re().test('0912345678')).toBe(true));
  it('chấp nhận SĐT đầu 84 → 84912345678', () => expect(re().test('84912345678')).toBe(true));
  it('chấp nhận SĐT đầu +84 → +84912345678', () => expect(re().test('+84912345678')).toBe(true));
  it('từ chối đầu số không hợp lệ 0112345678', () => expect(re().test('0112345678')).toBe(false));
  it('từ chối số quốc tế không phải VN +12025550100', () => expect(re().test('+12025550100')).toBe(false));
  it('từ chối chuỗi không phải số', () => expect(re().test('abcdefghij')).toBe(false));
});

describe('StringUtilities REGEX_VN_ID', () => {
  const re = () => new RegExp(StringUtilities.REGEX_VN_ID);
  it('chấp nhận CCCD 12 chữ số', () => expect(re().test('001234567890')).toBe(true));
  it('từ chối 11 chữ số', () => expect(re().test('01234567890')).toBe(false));
  it('từ chối 13 chữ số', () => expect(re().test('0012345678901')).toBe(false));
  it('từ chối chứa chữ cái', () => expect(re().test('A01234567890')).toBe(false));
});

describe('StringUtilities REGEX_VN_ID_OR_PASSPORT', () => {
  const re = () => new RegExp(StringUtilities.REGEX_VN_ID_OR_PASSPORT);
  it('chấp nhận CCCD 12 chữ số', () => expect(re().test('001234567890')).toBe(true));
  it('chấp nhận hộ chiếu B1234567', () => expect(re().test('B1234567')).toBe(true));
  it('từ chối 11 chữ số', () => expect(re().test('01234567890')).toBe(false));
  it('từ chối hộ chiếu 2 chữ cái AA123456', () => expect(re().test('AA123456')).toBe(false));
});

// ─────────────────────────────────────────────
// Regex patterns — web / network
// ─────────────────────────────────────────────
describe('StringUtilities REGEX_URL', () => {
  const re = () => new RegExp(StringUtilities.REGEX_URL);
  it('chấp nhận https://example.com', () => expect(re().test('https://example.com')).toBe(true));
  it('chấp nhận http://sub.domain.org/path?q=1', () => expect(re().test('http://sub.domain.org/path?q=1')).toBe(true));
  it('từ chối thiếu scheme example.com', () => expect(re().test('example.com')).toBe(false));
  it('từ chối ftp:// (chỉ http/https)', () => expect(re().test('ftp://files.example.com')).toBe(false));
  it('từ chối chuỗi rỗng', () => expect(re().test('')).toBe(false));
});

describe('StringUtilities REGEX_DOMAIN', () => {
  const re = () => new RegExp(StringUtilities.REGEX_DOMAIN);
  it('chấp nhận example.com', () => expect(re().test('example.com')).toBe(true));
  it('chấp nhận sub.example.co.uk', () => expect(re().test('sub.example.co.uk')).toBe(true));
  it('từ chối domain không có TLD localhost', () => expect(re().test('localhost')).toBe(false));
  it('từ chối bắt đầu bằng dấu chấm .example.com', () => expect(re().test('.example.com')).toBe(false));
});

describe('StringUtilities REGEX_IPV4', () => {
  const re = () => new RegExp(StringUtilities.REGEX_IPV4);
  it('chấp nhận 192.168.1.1', () => expect(re().test('192.168.1.1')).toBe(true));
  it('chấp nhận 0.0.0.0', () => expect(re().test('0.0.0.0')).toBe(true));
  it('chấp nhận 255.255.255.255', () => expect(re().test('255.255.255.255')).toBe(true));
  it('từ chối octet vượt 255 → 256.0.0.1', () => expect(re().test('256.0.0.1')).toBe(false));
  it('từ chối thiếu octet → 192.168.1', () => expect(re().test('192.168.1')).toBe(false));
});

describe('StringUtilities REGEX_IMAGE_URL', () => {
  const re = () => new RegExp(StringUtilities.REGEX_IMAGE_URL);
  it('chấp nhận https://cdn.example.com/img.jpg', () => expect(re().test('https://cdn.example.com/img.jpg')).toBe(true));
  it('chấp nhận đuôi .webp', () => expect(re().test('https://cdn.example.com/photo.webp')).toBe(true));
  it('chấp nhận URL có query string .png?v=2', () => expect(re().test('https://cdn.example.com/a.png?v=2')).toBe(true));
  it('từ chối đuôi .pdf', () => expect(re().test('https://cdn.example.com/file.pdf')).toBe(false));
  it('từ chối URL không có scheme', () => expect(re().test('cdn.example.com/img.jpg')).toBe(false));
});

describe('StringUtilities REGEX_SLUG', () => {
  const re = () => new RegExp(StringUtilities.REGEX_SLUG);
  it('chấp nhận hello-world', () => expect(re().test('hello-world')).toBe(true));
  it('chấp nhận slug chỉ có chữ cái abc', () => expect(re().test('abc')).toBe(true));
  it('chấp nhận slug có số 2024-release', () => expect(re().test('2024-release')).toBe(true));
  it('từ chối chứa chữ hoa Hello', () => expect(re().test('Hello')).toBe(false));
  it('từ chối dấu gạch đầu -hello', () => expect(re().test('-hello')).toBe(false));
  it('từ chối dấu gạch cuối hello-', () => expect(re().test('hello-')).toBe(false));
  it('từ chối dấu gạch đôi hello--world', () => expect(re().test('hello--world')).toBe(false));
});

// ─────────────────────────────────────────────
// Regex patterns — numeric
// ─────────────────────────────────────────────
describe('StringUtilities REGEX_NUMBER', () => {
  const re = () => new RegExp(StringUtilities.REGEX_NUMBER);
  it('chấp nhận số nguyên dương 42', () => expect(re().test('42')).toBe(true));
  it('chấp nhận số thập phân 3.14', () => expect(re().test('3.14')).toBe(true));
  it('chấp nhận số âm -10', () => expect(re().test('-10')).toBe(true));
  it('chấp nhận số âm thập phân -0.5', () => expect(re().test('-0.5')).toBe(true));
  it('từ chối chứa chữ cái 12a', () => expect(re().test('12a')).toBe(false));
  it('từ chối chuỗi rỗng', () => expect(re().test('')).toBe(false));
});

describe('StringUtilities REGEX_INTEGER', () => {
  const re = () => new RegExp(StringUtilities.REGEX_INTEGER);
  it('chấp nhận 0', () => expect(re().test('0')).toBe(true));
  it('chấp nhận số âm -99', () => expect(re().test('-99')).toBe(true));
  it('từ chối số thập phân 1.5', () => expect(re().test('1.5')).toBe(false));
  it('từ chối chuỗi rỗng', () => expect(re().test('')).toBe(false));
});

describe('StringUtilities REGEX_DECIMAL', () => {
  const re = () => new RegExp(StringUtilities.REGEX_DECIMAL);
  it('chấp nhận 3.14', () => expect(re().test('3.14')).toBe(true));
  it('chấp nhận -2.5', () => expect(re().test('-2.5')).toBe(true));
  it('từ chối số nguyên 5', () => expect(re().test('5')).toBe(false));
  it('từ chối dấu chấm đuôi 5.', () => expect(re().test('5.')).toBe(false));
});

describe('StringUtilities REGEX_POSITIVE_NUMBER', () => {
  const re = () => new RegExp(StringUtilities.REGEX_POSITIVE_NUMBER);
  it('chấp nhận 0', () => expect(re().test('0')).toBe(true));
  it('chấp nhận 1.5', () => expect(re().test('1.5')).toBe(true));
  it('từ chối số âm -1', () => expect(re().test('-1')).toBe(false));
  it('từ chối chuỗi rỗng', () => expect(re().test('')).toBe(false));
});

// ─────────────────────────────────────────────
// Regex patterns — identifiers
// ─────────────────────────────────────────────
describe('StringUtilities REGEX_UUID', () => {
  const re = () => new RegExp(StringUtilities.REGEX_UUID);
  it('chấp nhận UUID hợp lệ', () => expect(re().test('550e8400-e29b-41d4-a716-446655440000')).toBe(true));
  it('từ chối UUID viết hoa', () => expect(re().test('550E8400-E29B-41D4-A716-446655440000')).toBe(false));
  it('từ chối thiếu dấu gạch ngang', () => expect(re().test('550e8400e29b41d4a716446655440000')).toBe(false));
  it('từ chối chuỗi quá ngắn', () => expect(re().test('550e8400-e29b-41d4')).toBe(false));
});

describe('StringUtilities REGEX_CODE_16', () => {
  const re = () => new RegExp(StringUtilities.REGEX_CODE_16);
  it('chấp nhận chuỗi 16 ký tự alphanumeric', () => expect(re().test('ABCDEF1234567890')).toBe(true));
  it('từ chối 15 ký tự', () => expect(re().test('ABCDEF123456789')).toBe(false));
  it('từ chối 17 ký tự', () => expect(re().test('ABCDEF12345678901')).toBe(false));
  it('từ chối ký tự đặc biệt', () => expect(re().test('ABCDEF123456789!')).toBe(false));
});

describe('StringUtilities REGEX_CODE_32', () => {
  const re = () => new RegExp(StringUtilities.REGEX_CODE_32);
  it('chấp nhận chuỗi 32 ký tự alphanumeric', () => expect(re().test('ABCDEF1234567890abcdef1234567890')).toBe(true));
  it('từ chối 31 ký tự', () => expect(re().test('ABCDEF1234567890abcdef123456789')).toBe(false));
  it('từ chối chứa khoảng trắng', () => expect(re().test('ABCDEF1234567890 abcdef12345678')).toBe(false));
});

describe('StringUtilities REGEX_HEX_COLOR', () => {
  const re = () => new RegExp(StringUtilities.REGEX_HEX_COLOR);
  it('chấp nhận 6 ký tự #1A2B3C', () => expect(re().test('#1A2B3C')).toBe(true));
  it('chấp nhận 3 ký tự #F0A', () => expect(re().test('#F0A')).toBe(true));
  it('từ chối không có dấu #', () => expect(re().test('1A2B3C')).toBe(false));
  it('từ chối 4 ký tự hex #1A2B', () => expect(re().test('#1A2B')).toBe(false));
  it('từ chối ký tự ngoài hex #GGGGGG', () => expect(re().test('#GGGGGG')).toBe(false));
});

describe('StringUtilities REGEX_BASE64', () => {
  const re = () => new RegExp(StringUtilities.REGEX_BASE64);
  it.each(['TQ==', 'TWE=', 'SGVsbG8=', 'SGVsbG8h'])(
    'accepts padded or complete-quartet Base64 %s',
    value => expect(re().test(value)).toBe(true),
  );
  it.each(['TQ', 'TWE', 'SGVsbG8', 'A===', 'TW=E', 'SGVs!G8=', ''])(
    'rejects unpadded or malformed Base64 %j',
    value => expect(re().test(value)).toBe(false),
  );
});
