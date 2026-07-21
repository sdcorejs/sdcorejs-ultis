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
  title: { en: 'Strict filters', vi: 'Filter nghiêm ngặt' },
  summary: {
    en: 'Validate filter shape, paths, operands, depth, and cycles before evaluating application data.',
    vi: 'Xác thực shape, đường dẫn, operand, độ sâu và cycle của filter trước khi đánh giá dữ liệu ứng dụng.',
  },
  sections: [
    {
      anchor: 'validate-first',
      title: { en: 'Validate first', vi: 'Xác thực trước' },
      render: (context) => [
        paragraph(
          inlineCode('validateFilter'),
          localized(context.locale, {
            en: ' validates and safely clones one filter tree. ',
            vi: ' xác thực và clone an toàn một cây filter. ',
          }),
          inlineCode('evaluateFilter'),
          localized(context.locale, {
            en: ' performs that validation before evaluating an item. Malformed definitions throw ',
            vi: ' thực hiện bước xác thực đó trước khi đánh giá item. Definition sai sẽ throw ',
          }),
          inlineCode('FilterValidationError'),
          '.',
        ),
        codeBlock(
          `import { FilterUtilities } from '@sdcorejs/utils/fns';
import type { Filter } from '@sdcorejs/utils/models';

type Product = { price: number; status: string };

const filter: Filter<Product> = {
  field: 'price',
  operator: 'GREATER_OR_EQUAL',
  data: 100,
};

const validated = FilterUtilities.validateFilter(filter, {
  fieldTypes: { price: 'number' },
});

const matches = FilterUtilities.evaluateFilter(
  { price: 125, status: 'active' },
  validated,
  { fieldTypes: { price: 'number' } },
);`,
          localized(context.locale, { en: 'Validate and evaluate', vi: 'Xác thực và đánh giá' }),
        ),
        callout(
          'security',
          localized(context.locale, { en: 'Filtering is not authorization', vi: 'Filter không phải phân quyền' }),
          paragraph(localized(context.locale, {
            en: 'Client-side filtering chooses data already available to the client. Enforce access control before returning the data.',
            vi: 'Filter phía client chỉ chọn trong dữ liệu client đã có. Hãy thực thi kiểm soát truy cập trước khi trả dữ liệu.',
          })),
        ),
      ],
    },
    {
      anchor: 'typed-comparison',
      title: { en: 'Typed comparison', vi: 'So sánh có kiểu' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Pass fieldTypes when your application knows a field type. This avoids guessing across string, number, boolean, and date representations, especially for field-to-field comparisons.',
          vi: 'Truyền fieldTypes khi ứng dụng biết kiểu của field. Cách này tránh suy đoán giữa string, number, boolean và date, đặc biệt với so sánh field-to-field.',
        })),
        contentTable(
          localized(context.locale, { en: 'Evaluation outcomes', vi: 'Kết quả đánh giá' }),
          localized(context.locale, { en: ['Input state', 'Outcome'], vi: ['Trạng thái input', 'Kết quả'] }),
          [
            [[localized(context.locale, { en: 'Malformed filter definition', vi: 'Definition filter sai' })], [inlineCode('FilterValidationError')]],
            [[localized(context.locale, { en: 'Valid filter, invalid entity value', vi: 'Filter hợp lệ, giá trị entity sai' })], [localized(context.locale, { en: 'Deterministic non-match', vi: 'Không match một cách xác định' })]],
            [[localized(context.locale, { en: 'Top-level empty filter list', vi: 'Danh sách filter top-level rỗng' })], [localized(context.locale, { en: 'Matches all items', vi: 'Match mọi item' })]],
          ],
        ),
      ],
    },
    {
      anchor: 'timestamp-units',
      title: { en: 'Timestamp units', vi: 'Đơn vị timestamp' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Numeric dates are ambiguous. Declare seconds or milliseconds at the filter, field, or evaluator boundary. Without a unit, numeric values are not inferred to be dates.',
          vi: 'Ngày dạng số có tính mơ hồ. Hãy khai báo seconds hoặc milliseconds tại filter, field hoặc biên evaluator. Nếu không có đơn vị, giá trị số không bị suy đoán là ngày.',
        })),
        bulletList([
          [inlineCode('filter.timestampUnit'), localized(context.locale, { en: ' overrides the unit for that filter.', vi: ' ghi đè đơn vị cho filter đó.' })],
          [inlineCode('options.timestampUnits'), localized(context.locale, { en: ' configures units by field.', vi: ' cấu hình đơn vị theo field.' })],
          [inlineCode('options.timestampUnit'), localized(context.locale, { en: ' supplies a default unit.', vi: ' cung cấp đơn vị mặc định.' })],
          [inlineCode('legacyTimestampInference'), localized(context.locale, { en: ' is deprecated and should be enabled only during a controlled migration.', vi: ' đã deprecated và chỉ nên bật trong migration có kiểm soát.' })],
        ]),
        callout(
          'warning',
          localized(context.locale, { en: 'Magnitude is not a reliable unit', vi: 'Độ lớn không phải đơn vị đáng tin cậy' }),
          paragraph(localized(context.locale, {
            en: 'The legacy magnitude heuristic can reinterpret valid millisecond dates before 2001. Replace it with explicit units.',
            vi: 'Heuristic độ lớn legacy có thể diễn giải sai ngày mili giây hợp lệ trước năm 2001. Hãy thay bằng đơn vị tường minh.',
          })),
        ),
      ],
    },
    {
      anchor: 'missing-values',
      title: { en: 'Missing values', vi: 'Giá trị bị thiếu' },
      render: (context) => [
        paragraph(
          localized(context.locale, { en: 'The default ', vi: 'Policy mặc định ' }),
          inlineCode("missingValuePolicy: 'nullish'"),
          localized(context.locale, {
            en: ' makes a missing path satisfy NULL. Use ',
            vi: ' cho phép đường dẫn bị thiếu thỏa NULL. Dùng ',
          }),
          inlineCode("'distinct'"),
          localized(context.locale, {
            en: ' when missing and explicit null must be different states.',
            vi: ' khi missing và null tường minh phải là hai trạng thái khác nhau.',
          }),
        ),
        bulletList([
          [localized(context.locale, { en: 'Safe own-property traversal prevents inherited values and getters from becoming filter data.', vi: 'Duyệt own property an toàn ngăn giá trị kế thừa và getter trở thành dữ liệu filter.' })],
          [localized(context.locale, { en: 'Logical AND/OR trees have bounded depth and cycle detection.', vi: 'Cây logic AND/OR có giới hạn độ sâu và phát hiện cycle.' })],
          [localized(context.locale, { en: 'BETWEEN validates ordered inclusive bounds.', vi: 'BETWEEN xác thực khoảng đóng có thứ tự.' })],
        ]),
      ],
    },
  ],
});
