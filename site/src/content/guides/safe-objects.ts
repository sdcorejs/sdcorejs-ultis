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
  title: { en: 'Safe objects and property paths', vi: 'Đối tượng và đường dẫn thuộc tính an toàn' },
  summary: {
    en: 'Keep untrusted keys away from prototypes, accessors, and unbounded traversal.',
    vi: 'Giữ khóa không tin cậy tránh xa prototype, accessor và quá trình duyệt không giới hạn.',
  },
  sections: [
    {
      anchor: 'unsafe-keys',
      title: { en: 'Unsafe keys', vi: 'Khóa không an toàn' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Object-building helpers reject prototype-sensitive keys before creating own data properties. This prevents common prototype-pollution paths from silently changing inherited behavior.',
          vi: 'Helper tạo đối tượng từ chối khóa nhạy cảm với prototype trước khi tạo own data property. Cách này ngăn các đường prototype pollution phổ biến âm thầm thay đổi hành vi kế thừa.',
        })),
        contentTable(
          localized(context.locale, { en: 'Rejected object keys', vi: 'Khóa đối tượng bị từ chối' }),
          localized(context.locale, { en: ['Key', 'Reason'], vi: ['Khóa', 'Lý do'] }),
          [
            [[inlineCode('__proto__')], [localized(context.locale, { en: 'Can target an object prototype', vi: 'Có thể nhắm vào prototype của đối tượng' })]],
            [[inlineCode('prototype')], [localized(context.locale, { en: 'Can expose a constructor prototype path', vi: 'Có thể mở ra đường dẫn constructor prototype' })]],
            [[inlineCode('constructor')], [localized(context.locale, { en: 'Can escape into constructor-owned objects', vi: 'Có thể thoát sang đối tượng thuộc constructor' })]],
          ],
        ),
        paragraph(
          localized(context.locale, { en: 'Rejected keys throw ', vi: 'Khóa bị từ chối sẽ throw ' }),
          inlineCode('UnsafeObjectKeyError'),
          localized(context.locale, { en: ' or ', vi: ' hoặc ' }),
          inlineCode('UnsafePropertyPathError'),
          localized(context.locale, { en: ', depending on the API boundary.', vi: ', tùy biên API.' }),
        ),
      ],
    },
    {
      anchor: 'safe-property-paths',
      title: { en: 'Safe property paths', vi: 'Đường dẫn thuộc tính an toàn' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Path helpers support dot notation, numeric brackets, and quoted brackets with bounded depth. They read own data properties only and skip accessors by default, so a getter is not invoked as a side effect of traversal.',
          vi: 'Helper đường dẫn hỗ trợ dot notation, bracket số và bracket có quote với độ sâu giới hạn. Chúng chỉ đọc own data property và mặc định bỏ qua accessor, vì vậy getter không bị gọi như side effect của việc duyệt.',
        })),
        codeBlock(
          `import {
  ObjectUtilities,
  UnsafePropertyPathError,
} from '@sdcorejs/utils';

const record = Object.create(null) as {
  profile?: { names?: string[] };
};
record.profile = { names: ['Ada'] };

const name = ObjectUtilities.getNestedValue(
  record,
  'profile.names[0]',
);

try {
  ObjectUtilities.getNestedValue(record, 'constructor.prototype');
} catch (error: unknown) {
  if (!(error instanceof UnsafePropertyPathError)) throw error;
}`,
          localized(context.locale, { en: 'Read an own data path', vi: 'Đọc đường dẫn own data property' }),
        ),
      ],
    },
    {
      anchor: 'clone-and-merge',
      title: { en: 'Clone and merge', vi: 'Clone và merge' },
      render: (context) => [
        bulletList([
          [inlineCode('clone'), localized(context.locale, { en: ' deep-clones arrays, plain objects, and null-prototype records while preserving cycles.', vi: ' deep-clone mảng, plain object và record có null prototype đồng thời bảo toàn cycle.' })],
          [localized(context.locale, { en: 'Custom-prototype record-like objects are sanitized into safe own-property records.', vi: 'Đối tượng dạng record có custom prototype được làm sạch thành own-property record an toàn.' })],
          [inlineCode('merge'), localized(context.locale, { en: ' recursively merges record-like objects; arrays and other non-plain values replace the default.', vi: ' merge đệ quy đối tượng dạng record; mảng và giá trị không phải plain object thay thế default.' })],
          [localized(context.locale, { en: 'undefined inherits the default while null explicitly overrides it.', vi: 'undefined kế thừa default còn null ghi đè tường minh.' })],
          [localized(context.locale, { en: 'Date, Map, Set, functions, and class instances remain leaf references for compatibility.', vi: 'Date, Map, Set, function và class instance vẫn là leaf reference để tương thích.' })],
        ]),
        callout(
          'info',
          localized(context.locale, { en: 'Traversal is bounded', vi: 'Quá trình duyệt có giới hạn' }),
          paragraph(localized(context.locale, {
            en: 'Clone and merge default to a maximum nested depth of 1,000. Set a lower maxDepth when your input contract has a smaller known shape.',
            vi: 'Clone và merge mặc định giới hạn độ sâu lồng nhau là 1.000. Hãy đặt maxDepth thấp hơn khi contract input có cấu trúc nhỏ hơn đã biết.',
          })),
        ),
      ],
    },
    {
      anchor: 'boundary-limit',
      title: { en: 'What this boundary does not do', vi: 'Ranh giới này không làm gì' },
      render: (context) => [
        callout(
          'security',
          localized(context.locale, { en: 'Still validate application data', vi: 'Vẫn phải xác thực dữ liệu ứng dụng' }),
          paragraph(localized(context.locale, {
            en: 'Safe keys and paths protect utility output from prototype replacement and accidental accessor execution. They do not prove business validity, ownership, authorization, or schema conformance.',
            vi: 'Khóa và đường dẫn an toàn bảo vệ output của utility khỏi thay prototype và vô tình chạy accessor. Chúng không chứng minh tính hợp lệ nghiệp vụ, quyền sở hữu, phân quyền hoặc tuân thủ schema.',
          })),
        ),
        paragraph(localized(context.locale, {
          en: 'Validate the external payload first, authorize the operation, then use object utilities as an implementation safeguard inside that trusted workflow.',
          vi: 'Hãy xác thực payload bên ngoài trước, kiểm tra quyền thao tác, rồi dùng object utility như biện pháp bảo vệ implementation bên trong luồng đã tin cậy.',
        })),
      ],
    },
  ],
});
