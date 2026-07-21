import {
  bulletList,
  callout,
  codeBlock,
  contentTable,
  createPageContent,
  inlineCode,
  localized,
  paragraph,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Guide', vi: 'Hướng dẫn' },
  title: { en: 'Validation and numbers', vi: 'Xác thực và số' },
  summary: {
    en: 'Validate syntax and policy explicitly, then keep display formatting separate from data parsing.',
    vi: 'Xác thực syntax và policy một cách tường minh, rồi tách định dạng hiển thị khỏi việc parse dữ liệu.',
  },
  sections: [
    {
      anchor: 'strict-validation',
      title: { en: 'Strict validation', vi: 'Xác thực nghiêm ngặt' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Dedicated validators return booleans for expected input mismatch. The generic validate(type, value) entry point throws ValidationError when the requested pattern type is unknown.',
          vi: 'Validator chuyên biệt trả boolean cho trường hợp input không khớp dự kiến. Entry point validate(type, value) tổng quát throw ValidationError khi pattern type không tồn tại.',
        })),
        contentTable(
          localized(context.locale, { en: 'Validation responsibilities', vi: 'Trách nhiệm xác thực' }),
          localized(context.locale, { en: ['Question', 'Approach'], vi: ['Câu hỏi', 'Cách làm'] }),
          [
            [[localized(context.locale, { en: 'Does text match a known syntax?', vi: 'Text có khớp syntax đã biết?' })], [localized(context.locale, { en: 'Use a focused ValidationUtilities method', vi: 'Dùng method chuyên biệt của ValidationUtilities' })]],
            [[localized(context.locale, { en: 'Is a remote resource trusted or safe?', vi: 'Tài nguyên remote có đáng tin hoặc an toàn?' })], [localized(context.locale, { en: 'Validate server-side content and application policy', vi: 'Xác thực nội dung phía server và policy ứng dụng' })]],
            [[localized(context.locale, { en: 'Should user input become a number?', vi: 'Input người dùng có nên thành số?' })], [inlineCode('parseFiniteNumber')]],
            [[localized(context.locale, { en: 'How should a number be displayed?', vi: 'Số nên hiển thị thế nào?' })], [inlineCode('toVN'), localized(context.locale, { en: ' or ', vi: ' hoặc ' }), inlineCode('toISO')]],
          ],
        ),
      ],
    },
    {
      anchor: 'url-and-uuid',
      title: { en: 'URLs and UUIDs', vi: 'URL và UUID' },
      render: (context) => [
        paragraph(
          inlineCode('isUrl'),
          localized(context.locale, {
            en: ' parses a URL and applies explicit protocol, relative-path, credential, and host policies. HTTP and HTTPS are the defaults; relative paths and embedded credentials are denied by default.',
            vi: ' parse URL và áp dụng policy tường minh cho giao thức, đường dẫn tương đối, credential và host. HTTP và HTTPS là mặc định; đường dẫn tương đối và credential nhúng bị từ chối mặc định.',
          }),
        ),
        paragraph(
          inlineCode('isUuid'),
          localized(context.locale, {
            en: ' checks generic UUID shape and accepts optional version and RFC-variant rules. Use ',
            vi: ' kiểm tra shape UUID tổng quát và nhận rule optional cho version và RFC variant. Dùng ',
          }),
          inlineCode('isUuidV4'),
          localized(context.locale, { en: ' when version 4 plus RFC variant bits are required.', vi: ' khi cần version 4 cùng bit RFC variant.' }),
        ),
        callout(
          'warning',
          localized(context.locale, { en: 'Syntax does not prove trust', vi: 'Syntax không chứng minh độ tin cậy' }),
          paragraph(localized(context.locale, {
            en: 'A valid URL does not prove that its remote content is safe. A valid UUID does not prove that an entity exists or belongs to the caller.',
            vi: 'URL hợp lệ không chứng minh nội dung remote an toàn. UUID hợp lệ không chứng minh entity tồn tại hoặc thuộc về caller.',
          })),
        ),
      ],
    },
    {
      anchor: 'number-formatting',
      title: { en: 'Number formatting', vi: 'Định dạng số' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Use strict numeric APIs for data decisions. isFiniteNumber accepts only finite primitive numbers. isNumericString and parseFiniteNumber expose explicit whitespace, hexadecimal, exponent, decimal, plus-sign, and boolean options.',
          vi: 'Dùng API số nghiêm ngặt cho quyết định dữ liệu. isFiniteNumber chỉ nhận primitive number hữu hạn. isNumericString và parseFiniteNumber cung cấp option tường minh cho khoảng trắng, hexadecimal, exponent, decimal, dấu cộng và boolean.',
        })),
        codeBlock(
          `import { NumberUtilities } from '@sdcorejs/utils/fns';

const amount = NumberUtilities.parseFiniteNumber('1250.50');
const trimmed = NumberUtilities.parseFiniteNumber(' 42 ', { trim: true });
const rejectedBoolean = NumberUtilities.parseFiniteNumber(true);

const viDisplay = NumberUtilities.toVN(amount);
const enDisplay = NumberUtilities.toISO(amount);`,
          localized(context.locale, { en: 'Parse first, format second', vi: 'Parse trước, định dạng sau' }),
        ),
        callout(
          'warning',
          localized(context.locale, { en: 'Legacy coercion is broader', vi: 'Cơ chế coercion legacy rộng hơn' }),
          paragraph(
            inlineCode('isNumber'),
            localized(context.locale, {
              en: ' is deprecated because arrays and booleans may pass its v1.x coercion behavior. Migrate deliberately to a strict numeric API.',
              vi: ' đã deprecated vì mảng và boolean có thể vượt qua hành vi coercion v1.x. Hãy chủ động chuyển sang API số nghiêm ngặt.',
            }),
          ),
        ),
      ],
    },
    {
      anchor: 'handle-validation-errors',
      title: { en: 'Handle validation errors', vi: 'Xử lý lỗi xác thực' },
      render: (context) => [
        bulletList([
          [localized(context.locale, { en: 'Use boolean validators for routine field feedback.', vi: 'Dùng boolean validator cho phản hồi field thông thường.' })],
          [localized(context.locale, { en: 'Catch typed errors at configuration and structural boundaries, not around every boolean check.', vi: 'Catch typed error tại biên cấu hình và cấu trúc, không bọc mọi boolean check.' })],
          [localized(context.locale, { en: 'Do not show raw internal error messages when they reveal implementation detail or untrusted input.', vi: 'Không hiển thị raw internal error message nếu chúng làm lộ chi tiết implementation hoặc input không tin cậy.' })],
          [localized(context.locale, { en: 'Preserve the typed error or cause in diagnostic logging while presenting localized user guidance.', vi: 'Giữ typed error hoặc cause trong log chẩn đoán, đồng thời hiển thị hướng dẫn người dùng đã localized.' })],
        ]),
      ],
    },
  ],
});
