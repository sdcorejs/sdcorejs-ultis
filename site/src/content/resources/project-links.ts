import {
  bulletList,
  createPageContent,
  externalLink,
  localized,
  paragraph,
  routeLink,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Resources', vi: 'Tài nguyên' },
  title: { en: 'Project links', vi: 'Liên kết dự án' },
  summary: {
    en: 'Canonical links for source, packages, support, security, history, and versioning conventions.',
    vi: 'Liên kết chính thức cho mã nguồn, package, hỗ trợ, bảo mật, lịch sử và quy ước phiên bản.',
  },
  sections: [
    {
      anchor: 'source-and-package',
      title: { en: 'Source and package', vi: 'Mã nguồn và package' },
      render: (context) => [
        bulletList([
          [externalLink(localized(context.locale, { en: 'Source repository', vi: 'Repository mã nguồn' }), 'https://github.com/sdcorejs/sdcorejs-utils')],
          [externalLink(localized(context.locale, { en: 'npm package', vi: 'Package trên npm' }), 'https://www.npmjs.com/package/@sdcorejs/utils')],
          [externalLink(localized(context.locale, { en: 'Issue tracker', vi: 'Danh sách issue' }), 'https://github.com/sdcorejs/sdcorejs-utils/issues')],
          [externalLink(localized(context.locale, { en: 'Published releases', vi: 'Các release đã phát hành' }), 'https://github.com/sdcorejs/sdcorejs-utils/releases')],
          [externalLink(localized(context.locale, { en: 'MIT license', vi: 'Giấy phép MIT' }), 'https://github.com/sdcorejs/sdcorejs-utils/blob/main/LICENSE')],
        ]),
        paragraph(localized(context.locale, {
          en: 'Use the npm registry and repository release history as the source of truth for currently published versions.',
          vi: 'Dùng npm registry và lịch sử release của repository làm nguồn chính xác cho phiên bản hiện đã phát hành.',
        })),
      ],
    },
    {
      anchor: 'policies-and-history',
      title: { en: 'Policies and history', vi: 'Chính sách và lịch sử' },
      render: (context) => [
        bulletList([
          [routeLink(context, localized(context.locale, { en: 'Security policy and boundaries', vi: 'Chính sách và ranh giới bảo mật' }), { routeId: 'resources/security' })],
          [routeLink(context, localized(context.locale, { en: 'Migration to 1.2', vi: 'Nâng cấp lên 1.2' }), { routeId: 'resources/migration-1-2' })],
          [routeLink(context, localized(context.locale, { en: 'Release notes 1.2', vi: 'Ghi chú phát hành 1.2' }), { routeId: 'resources/release-notes-1-2' })],
          [routeLink(context, localized(context.locale, { en: 'Contributing guide', vi: 'Hướng dẫn đóng góp' }), { routeId: 'resources/contributing' })],
          [externalLink(localized(context.locale, { en: 'Repository changelog', vi: 'Changelog của repository' }), 'https://github.com/sdcorejs/sdcorejs-utils/blob/main/CHANGELOG.md')],
        ]),
      ],
    },
    {
      anchor: 'versioning-standards',
      title: { en: 'Versioning standards', vi: 'Tiêu chuẩn phiên bản' },
      render: (context) => [
        paragraph(localized(context.locale, {
          en: 'The project documents notable changes in a changelog and uses semantic versioning to communicate compatibility expectations. Always review the project-specific migration notes in addition to the general standards.',
          vi: 'Dự án ghi lại thay đổi đáng chú ý trong changelog và dùng semantic versioning để truyền đạt kỳ vọng tương thích. Luôn review migration note riêng của dự án bên cạnh tiêu chuẩn chung.',
        })),
        bulletList([
          [externalLink(localized(context.locale, { en: 'Semantic Versioning', vi: 'Semantic Versioning' }), 'https://semver.org/spec/v2.0.0.html')],
          [externalLink(localized(context.locale, { en: 'Keep a Changelog', vi: 'Keep a Changelog' }), 'https://keepachangelog.com/en/1.1.0/')],
        ]),
      ],
    },
  ],
});
