import {
  bulletList,
  callout,
  codeBlock,
  contentTable,
  createPageContent,
  inlineCode,
  localized,
  paragraph,
  routeLink,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Guide', vi: 'Hướng dẫn' },
  title: { en: 'Encryption and obfuscation', vi: 'Mã hóa và làm rối dữ liệu' },
  summary: {
    en: 'Use authenticated AES-GCM for confidentiality and integrity. Legacy obfuscation is only reversible encoding compatibility.',
    vi: 'Dùng AES-GCM có xác thực cho tính bí mật và toàn vẹn. Cơ chế làm rối cũ chỉ là encoding đảo ngược để tương thích.',
  },
  sections: [
    {
      anchor: 'choose-the-right-tool',
      title: { en: 'Choose the right tool', vi: 'Chọn đúng công cụ' },
      render: (context) => [
        contentTable(
          localized(context.locale, { en: 'Data-protection choices', vi: 'Lựa chọn bảo vệ dữ liệu' }),
          localized(context.locale, { en: ['Need', 'Use', 'Do not use'], vi: ['Nhu cầu', 'Nên dùng', 'Không dùng'] }),
          [
            [[localized(context.locale, { en: 'Authenticated confidentiality', vi: 'Tính bí mật có xác thực' })], [inlineCode('encryptAesGcm')], [inlineCode('encrypt')]],
            [[localized(context.locale, { en: 'Read an existing legacy payload', vi: 'Đọc payload legacy hiện có' })], [inlineCode('deobfuscate')], [inlineCode('decryptAesGcm')]],
            [[localized(context.locale, { en: 'Non-secret display transformation', vi: 'Biến đổi hiển thị không bí mật' })], [inlineCode('obfuscate')], [localized(context.locale, { en: 'Any security decision', vi: 'Bất kỳ quyết định bảo mật nào' })]],
          ],
        ),
        callout(
          'security',
          localized(context.locale, { en: 'Obfuscation is not encryption', vi: 'Làm rối không phải mã hóa' }),
          paragraph(localized(context.locale, {
            en: 'The legacy format provides no confidentiality, integrity, or authentication. Never use it for secrets, tokens, authorization state, signed state, or PII protection.',
            vi: 'Định dạng legacy không cung cấp tính bí mật, toàn vẹn hoặc xác thực. Không dùng cho secret, token, trạng thái phân quyền, trạng thái cần chữ ký hoặc bảo vệ PII.',
          })),
        ),
      ],
    },
    {
      anchor: 'authenticated-aes-gcm',
      title: { en: 'Authenticated AES-GCM', vi: 'AES-GCM có xác thực' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Each encryption creates a fresh random 96-bit IV and emits a versioned sdcore.aesgcm.v1 token. Raw keys must contain 16, 24, or 32 bytes. Password strings are intentionally not accepted as keys.',
          vi: 'Mỗi lần mã hóa tạo IV ngẫu nhiên 96-bit mới và phát sinh token sdcore.aesgcm.v1 có phiên bản. Khóa raw phải dài 16, 24 hoặc 32 byte. Chuỗi mật khẩu cố ý không được nhận làm khóa.',
        })),
        codeBlock(
          `import { StringUtilities } from '@sdcorejs/utils/fns';

const key = crypto.getRandomValues(new Uint8Array(32));
const additionalData = 'tenant:example';

const token = await StringUtilities.encryptAesGcm(
  { userId: 42 },
  key,
  { additionalData },
);

const value = await StringUtilities.decryptAesGcm<{ userId: number }>(
  token,
  key,
  { additionalData },
);`,
          localized(context.locale, { en: 'Authenticated round trip', vi: 'Mã hóa và giải mã có xác thực' }),
        ),
        bulletList([
          [localized(context.locale, { en: 'Store and distribute keys through a reviewed key-management design.', vi: 'Lưu trữ và phân phối khóa qua thiết kế quản lý khóa đã được review.' })],
          [localized(context.locale, { en: 'Use the same additional authenticated data during encryption and decryption.', vi: 'Dùng cùng additional authenticated data khi mã hóa và giải mã.' })],
          [localized(context.locale, { en: 'Derive password-based key material outside this library with a reviewed KDF and policy.', vi: 'Dẫn xuất key material từ mật khẩu bên ngoài thư viện bằng KDF và policy đã được review.' })],
        ]),
      ],
    },
    {
      anchor: 'legacy-obfuscation',
      title: { en: 'Legacy obfuscation', vi: 'Cơ chế làm rối cũ' },
      render: (context) => [
        paragraph(
          inlineCode('encrypt'),
          localized(context.locale, { en: ' and ', vi: ' và ' }),
          inlineCode('decrypt'),
          localized(context.locale, {
            en: ' are deprecated aliases that keep the v1.1.x obfuscation wire format unchanged. Prefer the accurately named ',
            vi: ' là alias deprecated giữ nguyên wire format làm rối của v1.1.x. Ưu tiên tên chính xác hơn là ',
          }),
          inlineCode('obfuscate'),
          localized(context.locale, { en: ' and ', vi: ' và ' }),
          inlineCode('deobfuscate'),
          localized(context.locale, { en: ' when compatibility is required.', vi: ' khi cần tương thích.' }),
        ),
        callout(
          'warning',
          localized(context.locale, { en: 'Wire formats are not interchangeable', vi: 'Các wire format không thể dùng thay nhau' }),
          paragraph(localized(context.locale, {
            en: 'Do not pass legacy output directly to AES-GCM decryption. Read it with the legacy decoder, then explicitly re-encrypt the resulting value under a planned data migration.',
            vi: 'Không truyền trực tiếp output legacy vào hàm giải mã AES-GCM. Hãy đọc bằng decoder legacy, rồi mã hóa lại giá trị theo kế hoạch migration dữ liệu tường minh.',
          })),
        ),
      ],
    },
    {
      anchor: 'handle-crypto-errors',
      title: { en: 'Handle cryptographic errors', vi: 'Xử lý lỗi mật mã' },
      render: (context) => [
        bulletList([
          [inlineCode('WebCryptoUnavailableError'), localized(context.locale, { en: ' means the required Web Crypto implementation is absent.', vi: ' nghĩa là thiếu implementation Web Crypto bắt buộc.' })],
          [inlineCode('SecureRandomUnavailableError'), localized(context.locale, { en: ' means a fresh secure IV could not be generated.', vi: ' nghĩa là không thể tạo IV mới đủ an toàn.' })],
          [inlineCode('EncryptionFormatError'), localized(context.locale, { en: ' identifies malformed, unsupported, or invalid authenticated plaintext formats.', vi: ' xác định định dạng token sai, không hỗ trợ hoặc plaintext đã xác thực không hợp lệ.' })],
          [inlineCode('EncryptionAuthenticationError'), localized(context.locale, { en: ' indicates authentication failure, such as a changed token, wrong key, or mismatched additional data.', vi: ' cho biết xác thực thất bại, ví dụ token bị sửa, sai khóa hoặc additional data không khớp.' })],
          [inlineCode('ValidationError'), localized(context.locale, { en: ' identifies an invalid key or option contract.', vi: ' xác định contract khóa hoặc option không hợp lệ.' })],
        ]),
        paragraph(
          localized(context.locale, { en: 'For broader operational guidance, review ', vi: 'Để có hướng dẫn vận hành rộng hơn, hãy xem ' }),
          routeLink(context, localized(context.locale, { en: 'Security', vi: 'Bảo mật' }), { routeId: 'resources/security' }),
          '.',
        ),
      ],
    },
  ],
});
