import {
  bulletList,
  callout,
  codeBlock,
  createPageContent,
  inlineCode,
  localized,
  paragraph,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Guide', vi: 'Hướng dẫn' },
  title: { en: 'Browser workflows', vi: 'Luồng xử lý trình duyệt' },
  summary: {
    en: 'Browser helpers expose capability and permission failures instead of hiding platform boundaries.',
    vi: 'Helper trình duyệt để lộ lỗi capability và quyền thay vì che giấu ranh giới nền tảng.',
  },
  sections: [
    {
      anchor: 'file-picker',
      title: { en: 'File picker', vi: 'Trình chọn file' },
      render: (context) => [
        paragraph(
          inlineCode('BrowserUtilities.upload'),
          localized(context.locale, {
            en: ' creates an isolated native picker for each call, validates selected files once, cleans up its temporary input, and always settles through selection, cancellation, timeout, validation failure, or browser error.',
            vi: ' tạo native picker độc lập cho mỗi lần gọi, xác thực file được chọn một lần, dọn input tạm và luôn settle qua chọn file, hủy, timeout, lỗi xác thực hoặc lỗi trình duyệt.',
          }),
        ),
        codeBlock(
          `import { BrowserUtilities } from '@sdcorejs/utils/fns';

const files = await BrowserUtilities.upload({
  multiple: true,
  extensions: ['pdf', 'png'],
  maxSizeInMb: 10,
  timeoutMs: 120_000,
  fileValidator: (file) =>
    file.name.startsWith('.') ? 'Hidden files are not accepted' : undefined,
});`,
          localized(context.locale, { en: 'Select and validate files', vi: 'Chọn và xác thực file' }),
        ),
        bulletList([
          [inlineCode('FilePickerCancelledError'), localized(context.locale, { en: ' identifies cancellation, an empty selection, or timeout.', vi: ' xác định thao tác hủy, lựa chọn rỗng hoặc timeout.' })],
          [inlineCode('ValidationError'), localized(context.locale, { en: ' carries size, extension, and custom-validator failures.', vi: ' mang lỗi kích thước, phần mở rộng và custom validator.' })],
          [localized(context.locale, { en: 'Native accept filters improve UX but do not replace content validation on a trusted server.', vi: 'Native accept filter cải thiện UX nhưng không thay thế xác thực nội dung trên server tin cậy.' })],
        ]),
      ],
    },
    {
      anchor: 'safe-downloads',
      title: { en: 'Safe downloads', vi: 'Tải xuống an toàn' },
      render: (context) => [
        paragraph(
          inlineCode('download'),
          localized(context.locale, {
            en: ' accepts a File, safe relative URL, or explicitly allowed absolute URL. HTTP, HTTPS, and blob are allowed by default; data URLs require explicit opt-in. Control characters, malformed URLs, and disallowed protocols are rejected.',
            vi: ' nhận File, URL tương đối an toàn hoặc URL tuyệt đối được cho phép tường minh. HTTP, HTTPS và blob được cho phép mặc định; data URL cần opt-in. Ký tự điều khiển, URL sai và giao thức không cho phép đều bị từ chối.',
          }),
        ),
        callout(
          'security',
          localized(context.locale, { en: 'Protocol allowlists are trust decisions', vi: 'Allowlist giao thức là quyết định tin cậy' }),
          paragraph(
            localized(context.locale, { en: 'Only add ', vi: 'Chỉ thêm ' }),
            inlineCode('additionalProtocols'),
            localized(context.locale, {
              en: ' after reviewing how the target runtime handles them. It cannot enable data:, javascript:, or vbscript:; unsafe protocols throw UnsafeUrlProtocolError.',
              vi: ' sau khi review cách runtime đích xử lý chúng. Option này không thể bật data:, javascript: hoặc vbscript:; giao thức không an toàn throw UnsafeUrlProtocolError.',
            }),
          ),
        ),
        paragraph(
          inlineCode('downloadBlob'),
          localized(context.locale, {
            en: ' creates an object URL for the actual bytes and revokes it immediately after triggering the download.',
            vi: ' tạo object URL cho byte thực và revoke ngay sau khi kích hoạt tải xuống.',
          }),
        ),
      ],
    },
    {
      anchor: 'clipboard',
      title: { en: 'Clipboard', vi: 'Clipboard' },
      render: (context) => [
        paragraph(
          inlineCode('copyToClipboard'),
          localized(context.locale, {
            en: ' delegates to navigator.clipboard.writeText and returns its Promise. Permission, secure-context, and user-gesture failures remain visible to the caller.',
            vi: ' ủy quyền cho navigator.clipboard.writeText và trả Promise của API đó. Lỗi quyền, secure context và user gesture vẫn được trả về caller.',
          }),
        ),
        codeBlock(
          `try {
  await BrowserUtilities.copyToClipboard(reference);
  announce('Copied');
} catch (error: unknown) {
  announce('Copy is unavailable');
  reportCapabilityFailure(error);
}`,
          localized(context.locale, { en: 'Handle clipboard capability failure', vi: 'Xử lý lỗi capability clipboard' }),
        ),
        callout(
          'info',
          localized(context.locale, { en: 'Communicate the result', vi: 'Thông báo kết quả' }),
          paragraph(localized(context.locale, {
            en: 'A UI should announce success or failure through an accessible live region and offer a manual selection fallback when copying is optional.',
            vi: 'UI nên thông báo thành công hoặc thất bại qua live region accessible và cho phép chọn thủ công khi copy là tính năng tùy chọn.',
          })),
        ),
      ],
    },
    {
      anchor: 'private-mode',
      title: { en: 'Private-mode detection', vi: 'Phát hiện chế độ riêng tư' },
      render: (context) => [
        callout(
          'security',
          localized(context.locale, { en: 'Deprecated and unreliable', vi: 'Đã deprecated và không đáng tin cậy' }),
          paragraph(
            inlineCode('detectIncognito'),
            localized(context.locale, {
              en: ' is a bounded best-effort compatibility heuristic. False positives, false negatives, and behavior changes are expected. Never use its result for security, authorization, fraud controls, or access decisions.',
              vi: ' là heuristic tương thích best-effort có giới hạn. False positive, false negative và thay đổi hành vi đều có thể xảy ra. Không dùng kết quả cho bảo mật, phân quyền, kiểm soát gian lận hoặc quyết định truy cập.',
            }),
          ),
        ),
        paragraph(localized(context.locale, {
          en: 'There is no reliable replacement because browsers intentionally protect privacy-mode details. Remove dependent decision logic; analytics-only compatibility uses must tolerate an Unknown browser and false results.',
          vi: 'Không có API thay thế đáng tin cậy vì trình duyệt chủ ý bảo vệ chi tiết chế độ riêng tư. Hãy loại bỏ logic quyết định phụ thuộc; trường hợp tương thích chỉ cho analytics phải chấp nhận browser Unknown và kết quả sai.',
        })),
      ],
    },
  ],
});
