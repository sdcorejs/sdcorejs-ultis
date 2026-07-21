import {
  bulletList,
  callout,
  createPageContent,
  externalLink,
  inlineCode,
  localized,
  paragraph,
  routeLink,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Resources', vi: 'Tài nguyên' },
  title: { en: 'Security', vi: 'Bảo mật' },
  summary: {
    en: 'Use defensive primitives within an application threat model, and report suspected vulnerabilities privately.',
    vi: 'Dùng primitive phòng vệ trong threat model của ứng dụng và báo cáo riêng tư các lỗ hổng nghi ngờ.',
  },
  sections: [
    {
      anchor: 'reporting',
      title: { en: 'Responsible reporting', vi: 'Báo cáo có trách nhiệm' },
      render: (context) => [
        callout(
          'security',
          localized(context.locale, { en: 'Do not open a public vulnerability issue', vi: 'Không mở issue lỗ hổng công khai' }),
          paragraph(
            localized(context.locale, { en: 'Use GitHub’s private ', vi: 'Dùng luồng riêng tư ' }),
            externalLink(
              localized(context.locale, { en: 'Report a vulnerability flow', vi: 'Báo cáo lỗ hổng' }),
              'https://github.com/sdcorejs/sdcorejs-utils/security/advisories/new',
            ),
            localized(context.locale, { en: ' so validation, remediation, and disclosure can be coordinated safely.', vi: ' của GitHub để phối hợp xác minh, khắc phục và công bố an toàn.' }),
          ),
        ),
        bulletList([
          [localized(context.locale, { en: 'Include the affected version, runtime, and package entry point.', vi: 'Bao gồm phiên bản, runtime và package entry point bị ảnh hưởng.' })],
          [localized(context.locale, { en: 'Provide a minimal reproduction, expected impact, and known mitigations.', vi: 'Cung cấp reproduction tối thiểu, tác động dự kiến và biện pháp giảm thiểu đã biết.' })],
          [localized(context.locale, { en: 'Never include real secrets, keys, tokens, or personal data.', vi: 'Không bao gồm secret, khóa, token hoặc dữ liệu cá nhân thật.' })],
        ]),
        paragraph(localized(context.locale, {
          en: 'Security fixes are provided on the latest published minor release. Upgrade to its latest patch after reviewing the migration guide.',
          vi: 'Bản vá bảo mật được cung cấp trên minor release mới nhất đã phát hành. Hãy nâng lên patch mới nhất sau khi review hướng dẫn migration.',
        })),
      ],
    },
    {
      anchor: 'threat-boundaries',
      title: { en: 'Threat boundaries', vi: 'Ranh giới đe dọa' },
      render: (context) => [
        bulletList([
          [localized(context.locale, { en: 'Client-side filters are data-selection helpers, never authorization.', vi: 'Filter phía client là helper chọn dữ liệu, không bao giờ là phân quyền.' })],
          [localized(context.locale, { en: 'URL, extension, MIME, and file-size checks cannot prove remote or uploaded content is safe.', vi: 'Kiểm tra URL, extension, MIME và kích thước file không thể chứng minh nội dung remote hoặc upload an toàn.' })],
          [localized(context.locale, { en: 'A generated UUID is an identifier, not an authentication credential.', vi: 'UUID được tạo là định danh, không phải credential xác thực.' })],
          [localized(context.locale, { en: 'Safe object traversal is not HTML, SQL, shell, or template sanitization.', vi: 'Duyệt đối tượng an toàn không phải cơ chế sanitize HTML, SQL, shell hoặc template.' })],
          [localized(context.locale, { en: 'A SHA-256 digest is not a MAC or digital signature.', vi: 'Digest SHA-256 không phải MAC hoặc chữ ký số.' })],
        ]),
      ],
    },
    {
      anchor: 'cryptography',
      title: { en: 'Cryptography', vi: 'Mật mã' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'AES-GCM operations use Web Crypto, a fresh 96-bit IV, and 128-, 192-, or 256-bit raw AES keys. Applications own key generation or derivation, storage, rotation, access, backup, deletion, and trust-domain separation.',
          vi: 'Thao tác AES-GCM dùng Web Crypto, IV 96-bit mới và khóa AES raw 128, 192 hoặc 256-bit. Ứng dụng sở hữu việc tạo hoặc dẫn xuất khóa, lưu trữ, rotation, truy cập, backup, xóa và tách trust domain.',
        })),
        bulletList([
          [localized(context.locale, { en: 'Use additional authenticated data to bind a token to context when appropriate.', vi: 'Dùng additional authenticated data để gắn token với ngữ cảnh khi phù hợp.' })],
          [localized(context.locale, { en: 'Supply identical additional data during decryption.', vi: 'Cung cấp additional data giống hệt khi giải mã.' })],
          [localized(context.locale, { en: 'Treat token metadata and length as public.', vi: 'Xem metadata và độ dài token là dữ liệu công khai.' })],
          [localized(context.locale, { en: 'Handle typed Web Crypto and authentication failures; never substitute weak randomness or legacy obfuscation.', vi: 'Xử lý typed failure của Web Crypto và xác thực; không thay bằng randomness yếu hoặc cơ chế làm rối legacy.' })],
        ]),
        paragraph(
          localized(context.locale, { en: 'Implementation guidance: ', vi: 'Hướng dẫn implementation: ' }),
          routeLink(context, localized(context.locale, { en: 'Encryption and obfuscation', vi: 'Mã hóa và làm rối dữ liệu' }), { routeId: 'guides/encryption' }),
          '.',
        ),
      ],
    },
    {
      anchor: 'data-handling',
      title: { en: 'Data handling', vi: 'Xử lý dữ liệu' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Object builders and shared path traversal reject __proto__, prototype, and constructor at every level. They read own data properties, skip accessors by default, reject malformed or excessively deep paths, and use safe property definition for output.',
          vi: 'Object builder và path traversal dùng chung từ chối __proto__, prototype và constructor ở mọi cấp. Chúng đọc own data property, mặc định bỏ qua accessor, từ chối đường dẫn sai hoặc quá sâu và dùng định nghĩa property an toàn cho output.',
        })),
        callout(
          'warning',
          localized(context.locale, { en: 'Safe structure is not trusted content', vi: 'Cấu trúc an toàn không có nghĩa là nội dung đáng tin' }),
          paragraph(localized(context.locale, {
            en: 'Continue to validate business schema, ownership, and authorization, and encode data for the interpreter where it will be used.',
            vi: 'Vẫn phải xác thực schema nghiệp vụ, quyền sở hữu và phân quyền, đồng thời encode dữ liệu cho interpreter tại nơi sử dụng.',
          })),
        ),
      ],
    },
    {
      anchor: 'browser-signals',
      title: { en: 'Browser signals', vi: 'Tín hiệu trình duyệt' },
      render: (context) => [
        callout(
          'security',
          localized(context.locale, { en: 'Private mode is not reliably detectable', vi: 'Không thể phát hiện private mode một cách đáng tin cậy' }),
          paragraph(
            inlineCode('detectIncognito'),
            localized(context.locale, {
              en: ' is deprecated. Its bounded completion does not make the heuristic trustworthy. It must not affect access, authentication, fraud, or privacy decisions.',
              vi: ' đã deprecated. Việc có giới hạn thời gian không làm heuristic trở nên đáng tin. Kết quả không được ảnh hưởng quyết định truy cập, xác thực, gian lận hoặc quyền riêng tư.',
            }),
          ),
        ),
        paragraph(localized(context.locale, {
          en: 'Browser capability and permission failures are ordinary runtime outcomes. Handle rejected promises at the feature boundary and provide an accessible fallback when the feature is optional.',
          vi: 'Lỗi capability và quyền trình duyệt là kết quả runtime bình thường. Hãy xử lý rejected promise tại biên tính năng và cung cấp fallback accessible khi tính năng là tùy chọn.',
        })),
      ],
    },
  ],
});
