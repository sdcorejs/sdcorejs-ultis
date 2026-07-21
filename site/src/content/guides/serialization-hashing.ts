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
  title: { en: 'Serialization and hashing', vi: 'Tuần tự hóa và băm' },
  summary: {
    en: 'Start with the data domain: JSON-compatible values, extended JavaScript values, fast buckets, or cryptographic digests.',
    vi: 'Bắt đầu từ miền dữ liệu: giá trị tương thích JSON, giá trị JavaScript mở rộng, bucket nhanh hoặc digest mật mã.',
  },
  sections: [
    {
      anchor: 'choose-a-serializer',
      title: { en: 'Choose a serializer', vi: 'Chọn bộ tuần tự hóa' },
      render: (context) => [
        contentTable(
          localized(context.locale, { en: 'Deterministic serializers', vi: 'Bộ tuần tự hóa xác định' }),
          localized(context.locale, { en: ['API', 'Best for', 'Key boundary'], vi: ['API', 'Phù hợp nhất', 'Ranh giới chính'] }),
          [
            [
              [inlineCode('stableStringify')],
              [localized(context.locale, { en: 'JSON-compatible data plus valid Date values', vi: 'Dữ liệu tương thích JSON và Date hợp lệ' })],
              [localized(context.locale, { en: 'Rejects undefined and extended values', vi: 'Từ chối undefined và giá trị mở rộng' })],
            ],
            [
              [inlineCode('canonicalStringify')],
              [localized(context.locale, { en: 'Typed extended JavaScript data', vi: 'Dữ liệu JavaScript mở rộng có tag kiểu' })],
              [localized(context.locale, { en: 'Produces a library-specific canonical v1 encoding', vi: 'Tạo encoding canonical v1 riêng của thư viện' })],
            ],
          ],
        ),
        paragraph(localized(context.locale, {
          en: 'Both serializers sort supported object data deterministically, reject accessors, enforce safe keys and bounded depth, and throw typed errors instead of silently dropping unsupported values.',
          vi: 'Cả hai serializer sắp xếp dữ liệu object được hỗ trợ một cách xác định, từ chối accessor, thực thi khóa an toàn và độ sâu giới hạn, đồng thời throw typed error thay vì âm thầm bỏ giá trị không hỗ trợ.',
        })),
      ],
    },
    {
      anchor: 'canonical-values',
      title: { en: 'Canonical extended values', vi: 'Giá trị mở rộng chuẩn tắc' },
      render: (context) => [
        paragraph(
          inlineCode('canonicalStringify'),
          localized(context.locale, {
            en: ' uses collision-safe type tags for values that JSON cannot distinguish.',
            vi: ' dùng type tag chống va chạm cho các giá trị JSON không thể phân biệt.',
          }),
        ),
        bulletList([
          [localized(context.locale, { en: 'undefined, non-finite numbers, negative zero, and BigInt', vi: 'undefined, số không hữu hạn, số âm zero và BigInt' })],
          [localized(context.locale, { en: 'Date, RegExp, Map, and Set', vi: 'Date, RegExp, Map và Set' })],
          [localized(context.locale, { en: 'ArrayBuffer, typed arrays, and sparse-array holes', vi: 'ArrayBuffer, typed array và lỗ trống trong sparse array' })],
        ]),
        codeBlock(
          `import { canonicalStringify } from '@sdcorejs/utils/fns';

const first = canonicalStringify(new Map([
  ['role', 'admin'],
  ['active', true],
]));

const second = canonicalStringify({
  missing: undefined,
  limit: Number.POSITIVE_INFINITY,
  createdAt: new Date('2026-07-20T00:00:00Z'),
});`,
          localized(context.locale, { en: 'Canonical extended values', vi: 'Giá trị mở rộng canonical' }),
        ),
      ],
    },
    {
      anchor: 'choose-a-hash',
      title: { en: 'Choose a hash', vi: 'Chọn hàm băm' },
      render: (context) => [
        contentTable(
          localized(context.locale, { en: 'Hash selection', vi: 'Lựa chọn hàm băm' }),
          localized(context.locale, { en: ['API', 'Property', 'Appropriate use'], vi: ['API', 'Đặc tính', 'Cách dùng phù hợp'] }),
          [
            [[inlineCode('hash32')], [localized(context.locale, { en: 'Fast, collision-prone, non-cryptographic', vi: 'Nhanh, dễ va chạm, không phải mật mã' })], [localized(context.locale, { en: 'Compatibility buckets and non-security cache hints', vi: 'Bucket tương thích và cache hint không liên quan bảo mật' })]],
            [[inlineCode('sha256Canonical')], [localized(context.locale, { en: 'Asynchronous SHA-256 over canonical UTF-8', vi: 'SHA-256 bất đồng bộ trên canonical UTF-8' })], [localized(context.locale, { en: 'Cryptographic digest of supported structured values', vi: 'Digest mật mã cho giá trị có cấu trúc được hỗ trợ' })]],
            [[inlineCode('sha256Blob')], [localized(context.locale, { en: 'Asynchronous SHA-256 over bytes', vi: 'SHA-256 bất đồng bộ trên byte' })], [localized(context.locale, { en: 'Blob or File content integrity', vi: 'Tính toàn vẹn nội dung Blob hoặc File' })]],
          ],
        ),
        callout(
          'security',
          localized(context.locale, { en: 'A digest is not a signature', vi: 'Digest không phải chữ ký' }),
          paragraph(localized(context.locale, {
            en: 'SHA-256 does not authenticate who produced a value. Use an appropriate keyed MAC or digital-signature protocol outside this package when authenticity is required.',
            vi: 'SHA-256 không xác thực ai tạo ra giá trị. Hãy dùng keyed MAC hoặc giao thức chữ ký số phù hợp bên ngoài package khi cần tính xác thực.',
          })),
        ),
      ],
    },
    {
      anchor: 'unsupported-values',
      title: { en: 'Unsupported values', vi: 'Giá trị không được hỗ trợ' },
      render: (context) => [
        bulletList([
          [localized(context.locale, { en: 'Functions, symbols, accessors, arbitrary class instances, and circular structures are rejected.', vi: 'Function, symbol, accessor, class instance tùy ý và cấu trúc vòng đều bị từ chối.' })],
          [localized(context.locale, { en: 'Blob and File metadata-only canonical encoding is rejected; hash their actual bytes with sha256Blob.', vi: 'Canonical encoding chỉ dựa trên metadata của Blob và File bị từ chối; hãy băm byte thực bằng sha256Blob.' })],
          [inlineCode('UnsupportedSerializationTypeError'), localized(context.locale, { en: ' identifies an unsupported type and path.', vi: ' xác định kiểu và đường dẫn không được hỗ trợ.' })],
          [inlineCode('CircularReferenceError'), localized(context.locale, { en: ' identifies a cycle.', vi: ' xác định cycle.' })],
          [inlineCode('UnsafeObjectKeyError'), localized(context.locale, { en: ' identifies a prototype-sensitive key.', vi: ' xác định khóa nhạy cảm với prototype.' })],
        ]),
        callout(
          'warning',
          localized(context.locale, { en: 'Do not stringify by accident', vi: 'Không tuần tự hóa một cách vô tình' }),
          paragraph(localized(context.locale, {
            en: 'Choose and document the serialization domain before persisting digests. A canonical format is part of a durable data protocol and should be versioned like one.',
            vi: 'Chọn và tài liệu hóa miền tuần tự hóa trước khi lưu digest. Định dạng canonical là một phần của giao thức dữ liệu lâu dài và cần được quản lý phiên bản tương ứng.',
          })),
        ),
      ],
    },
  ],
});
