import { definePage, lazyPage } from './registry';

export const RESOURCE_PAGES = [
  definePage({
    id: 'resource-migration-1-2', routeId: 'resources/migration-1-2', group: 'resources', order: 0,
    title: { en: 'Migration to 1.2', vi: 'Nâng cấp lên 1.2' },
    summary: { en: 'Adopt strict validation, security boundaries, and the page-0 contract deliberately.', vi: 'Chủ động áp dụng xác thực nghiêm ngặt, ranh giới bảo mật và contract trang 0.' },
    keywords: { en: ['migration', '1.2', 'breaking changes', 'upgrade', 'page 0'], vi: ['nâng cấp', '1.2', 'breaking change', 'trang 0'] },
    anchors: [
      { anchor: 'paging-contract', title: { en: 'Paging contract', vi: 'Contract phân trang' } },
      { anchor: 'strict-validation', title: { en: 'Strict validation', vi: 'Xác thực nghiêm ngặt' } },
      { anchor: 'security-changes', title: { en: 'Security changes', vi: 'Thay đổi bảo mật' } },
      { anchor: 'async-and-browser', title: { en: 'Async and browser boundaries', vi: 'Ranh giới async và trình duyệt' } },
    ],
    load: lazyPage(() => import('./resources/migration-1-2')),
  }),
  definePage({
    id: 'resource-security', routeId: 'resources/security', group: 'resources', order: 1,
    title: { en: 'Security', vi: 'Bảo mật' },
    summary: { en: 'Understand supported security controls, non-goals, and responsible reporting.', vi: 'Hiểu các kiểm soát bảo mật được hỗ trợ, phần không đảm bảo và cách báo cáo có trách nhiệm.' },
    keywords: { en: ['security', 'threat model', 'report vulnerability', 'Web Crypto'], vi: ['bảo mật', 'mô hình đe dọa', 'báo cáo lỗ hổng', 'Web Crypto'] },
    anchors: [
      { anchor: 'reporting', title: { en: 'Responsible reporting', vi: 'Báo cáo có trách nhiệm' } },
      { anchor: 'threat-boundaries', title: { en: 'Threat boundaries', vi: 'Ranh giới đe dọa' } },
      { anchor: 'cryptography', title: { en: 'Cryptography', vi: 'Mật mã' } },
      { anchor: 'data-handling', title: { en: 'Data handling', vi: 'Xử lý dữ liệu' } },
      { anchor: 'browser-signals', title: { en: 'Browser signals', vi: 'Tín hiệu trình duyệt' } },
    ],
    load: lazyPage(() => import('./resources/security')),
  }),
  definePage({
    id: 'resource-release-notes', routeId: 'resources/release-notes-1-2', group: 'resources', order: 2,
    title: { en: 'Release notes 1.2', vi: 'Ghi chú phát hành 1.2' },
    summary: { en: 'Review the security, correctness, packaging, and documentation work prepared for 1.2.', vi: 'Xem lại các thay đổi về bảo mật, tính đúng đắn, đóng gói và tài liệu đã chuẩn bị cho 1.2.' },
    keywords: { en: ['release notes', '1.2', 'changelog', 'highlights'], vi: ['ghi chú phát hành', '1.2', 'changelog', 'điểm nổi bật'] },
    anchors: [
      { anchor: 'highlights', title: { en: 'Highlights', vi: 'Điểm nổi bật' } },
      { anchor: 'breaking-changes', title: { en: 'Breaking changes', vi: 'Thay đổi không tương thích' } },
      { anchor: 'compatibility', title: { en: 'Compatibility', vi: 'Khả năng tương thích' } },
      { anchor: 'verification', title: { en: 'Verification', vi: 'Kiểm chứng' } },
    ],
    load: lazyPage(() => import('./resources/release-notes-1-2')),
  }),
  definePage({
    id: 'resource-contributing', routeId: 'resources/contributing', group: 'resources', order: 3,
    title: { en: 'Contributing', vi: 'Đóng góp' },
    summary: { en: 'Prepare a focused change and run the same quality gates used by the project.', vi: 'Chuẩn bị thay đổi có phạm vi rõ ràng và chạy cùng các cổng chất lượng của dự án.' },
    keywords: { en: ['contributing', 'development', 'tests', 'documentation'], vi: ['đóng góp', 'phát triển', 'kiểm thử', 'tài liệu'] },
    anchors: [
      { anchor: 'local-setup', title: { en: 'Local setup', vi: 'Thiết lập local' } },
      { anchor: 'quality-gates', title: { en: 'Quality gates', vi: 'Các cổng chất lượng' } },
      { anchor: 'documentation-changes', title: { en: 'Documentation changes', vi: 'Thay đổi tài liệu' } },
      { anchor: 'submit-a-change', title: { en: 'Submit a change', vi: 'Gửi thay đổi' } },
    ],
    load: lazyPage(() => import('./resources/contributing')),
  }),
  definePage({
    id: 'resource-project-links', routeId: 'resources/project-links', group: 'resources', order: 4,
    title: { en: 'Project links', vi: 'Liên kết dự án' },
    summary: { en: 'Find source, package metadata, issues, policies, and versioning references.', vi: 'Tìm mã nguồn, metadata package, issue, chính sách và tài liệu về phiên bản.' },
    keywords: { en: ['GitHub', 'npm', 'issues', 'changelog', 'license'], vi: ['GitHub', 'npm', 'issue', 'changelog', 'giấy phép'] },
    anchors: [
      { anchor: 'source-and-package', title: { en: 'Source and package', vi: 'Mã nguồn và package' } },
      { anchor: 'policies-and-history', title: { en: 'Policies and history', vi: 'Chính sách và lịch sử' } },
      { anchor: 'versioning-standards', title: { en: 'Versioning standards', vi: 'Tiêu chuẩn phiên bản' } },
    ],
    load: lazyPage(() => import('./resources/project-links')),
  }),
] as const;
