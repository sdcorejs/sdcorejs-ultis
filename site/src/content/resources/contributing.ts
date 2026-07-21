import {
  bulletList,
  callout,
  codeBlock,
  createPageContent,
  externalLink,
  localized,
  orderedList,
  paragraph,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Resources', vi: 'Tài nguyên' },
  title: { en: 'Contributing', vi: 'Đóng góp' },
  summary: {
    en: 'Keep changes focused, evidence-backed, bilingual when user-facing, and verified through the project scripts.',
    vi: 'Giữ thay đổi có phạm vi rõ ràng, dựa trên bằng chứng, song ngữ khi hiển thị cho người dùng và được kiểm chứng bằng script dự án.',
  },
  sections: [
    {
      anchor: 'local-setup',
      title: { en: 'Local setup', vi: 'Thiết lập local' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Use a supported Node.js version and npm. Install the library and documentation dependencies from their lockfiles.',
          vi: 'Dùng phiên bản Node.js được hỗ trợ và npm. Cài dependency của thư viện và tài liệu từ lockfile tương ứng.',
        })),
        codeBlock(
          `npm ci
npm --prefix site ci

npm run typecheck
npm --prefix site run typecheck`,
          localized(context.locale, { en: 'Install and check types', vi: 'Cài đặt và kiểm tra kiểu' }),
          'bash',
        ),
        callout(
          'info',
          localized(context.locale, { en: 'Preserve the lockfiles', vi: 'Giữ nguyên tính nhất quán của lockfile' }),
          paragraph(localized(context.locale, {
            en: 'When a dependency change is intentional, use npm and review both the manifest and generated lockfile diff. Do not mix package managers.',
            vi: 'Khi chủ động đổi dependency, hãy dùng npm và review cả manifest lẫn diff lockfile được tạo. Không trộn package manager.',
          })),
        ),
      ],
    },
    {
      anchor: 'quality-gates',
      title: { en: 'Quality gates', vi: 'Các cổng chất lượng' },
      render: (context) => [
        codeBlock(
          `npm run validate:all
npm run test:date
npm audit
npm audit --omit=dev`,
          localized(context.locale, { en: 'Project validation', vi: 'Xác thực dự án' }),
          'bash',
        ),
        bulletList([
          [localized(context.locale, { en: 'Add focused regression tests for every corrected contract or bug.', vi: 'Thêm regression test tập trung cho mỗi contract hoặc bug được sửa.' })],
          [localized(context.locale, { en: 'Preserve typed errors and security boundaries instead of weakening tests.', vi: 'Giữ typed error và ranh giới bảo mật thay vì làm yếu test.' })],
          [localized(context.locale, { en: 'Run date checks in every timezone affected by a date change.', vi: 'Chạy kiểm tra ngày trong mọi múi giờ bị ảnh hưởng bởi thay đổi.' })],
          [localized(context.locale, { en: 'Validate packed package imports and examples when public exports or packaging change.', vi: 'Xác thực import từ package đã pack và example khi public export hoặc packaging thay đổi.' })],
        ]),
      ],
    },
    {
      anchor: 'documentation-changes',
      title: { en: 'Documentation changes', vi: 'Thay đổi tài liệu' },
      render: (context) => [
        orderedList([
          [localized(context.locale, { en: 'Update API metadata with the exact import path, signature, defaults, errors, runtime notes, and security notes.', vi: 'Cập nhật API metadata với đường dẫn import, signature, default, error, runtime note và security note chính xác.' })],
          [localized(context.locale, { en: 'Provide complete English and Vietnamese strings for every first-party page and navigation field.', vi: 'Cung cấp đầy đủ chuỗi tiếng Anh và tiếng Việt cho mọi trang và field navigation do dự án sở hữu.' })],
          [localized(context.locale, { en: 'Keep route IDs and anchors stable unless a migration and redirect strategy is approved.', vi: 'Giữ route ID và anchor ổn định trừ khi đã duyệt chiến lược migration và redirect.' })],
          [localized(context.locale, { en: 'Add or update a real TypeScript example when a public usage contract changes.', vi: 'Thêm hoặc cập nhật example TypeScript thực khi contract sử dụng public thay đổi.' })],
          [localized(context.locale, { en: 'Run site tests, content validation, build, and bundle-budget checks.', vi: 'Chạy test site, content validation, build và kiểm tra bundle budget.' })],
        ]),
      ],
    },
    {
      anchor: 'submit-a-change',
      title: { en: 'Submit a change', vi: 'Gửi thay đổi' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'Describe the problem, the public behavior before and after, migration impact, security impact, and exact verification evidence. Keep unrelated refactors out of the same change.',
          vi: 'Mô tả vấn đề, hành vi public trước và sau, tác động migration, tác động bảo mật và bằng chứng kiểm chứng chính xác. Không gộp refactor không liên quan vào cùng thay đổi.',
        })),
        bulletList([
          [externalLink(localized(context.locale, { en: 'Repository', vi: 'Repository' }), 'https://github.com/sdcorejs/sdcorejs-utils')],
          [externalLink(localized(context.locale, { en: 'Issue tracker', vi: 'Danh sách issue' }), 'https://github.com/sdcorejs/sdcorejs-utils/issues')],
          [externalLink(localized(context.locale, { en: 'Private security report', vi: 'Báo cáo bảo mật riêng tư' }), 'https://github.com/sdcorejs/sdcorejs-utils/security/advisories/new')],
        ]),
      ],
    },
  ],
});
