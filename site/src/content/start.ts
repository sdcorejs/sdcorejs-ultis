import { definePage, lazyPage } from './registry';

export const START_PAGES = [
  definePage({
    id: 'start-overview',
    routeId: 'start/overview',
    group: 'start',
    order: 0,
    title: { en: 'Overview', vi: 'Tổng quan' },
    summary: {
      en: 'Understand the library, its design boundaries, and the fastest path to a safe integration.',
      vi: 'Hiểu thư viện, các ranh giới thiết kế và lộ trình ngắn nhất để tích hợp an toàn.',
    },
    keywords: {
      en: ['overview', 'TypeScript', 'utilities', 'security', 'v1.2'],
      vi: ['tổng quan', 'TypeScript', 'tiện ích', 'bảo mật', 'v1.2'],
    },
    anchors: [
      { anchor: 'why-this-library', title: { en: 'Why this library', vi: 'Vì sao dùng thư viện này' } },
      { anchor: 'at-a-glance', title: { en: 'At a glance', vi: 'Tổng quan nhanh' } },
      { anchor: 'security-boundaries', title: { en: 'Security boundaries', vi: 'Ranh giới bảo mật' } },
      { anchor: 'next-steps', title: { en: 'Next steps', vi: 'Bước tiếp theo' } },
    ],
    load: lazyPage(() => import('./start/overview')),
  }),
  definePage({
    id: 'start-getting-started',
    routeId: 'start/getting-started',
    group: 'start',
    order: 1,
    title: { en: 'Getting started', vi: 'Bắt đầu' },
    summary: {
      en: 'Install the package, choose an entry point, and make your first typed call.',
      vi: 'Cài package, chọn entry point và thực hiện lời gọi có kiểu đầu tiên.',
    },
    keywords: {
      en: ['install', 'npm', 'quick start', 'import', 'subpath'],
      vi: ['cài đặt', 'npm', 'bắt đầu nhanh', 'import', 'subpath'],
    },
    anchors: [
      { anchor: 'install', title: { en: 'Install', vi: 'Cài đặt' } },
      { anchor: 'first-import', title: { en: 'Your first import', vi: 'Import đầu tiên' } },
      { anchor: 'choose-entrypoint', title: { en: 'Choose an entry point', vi: 'Chọn entry point' } },
      { anchor: 'integration-checklist', title: { en: 'Integration checklist', vi: 'Danh sách kiểm tra tích hợp' } },
    ],
    load: lazyPage(() => import('./start/getting-started')),
  }),
  definePage({
    id: 'start-package-exports',
    routeId: 'start/package-exports',
    group: 'start',
    order: 2,
    title: { en: 'Package exports', vi: 'Các export của package' },
    summary: {
      en: 'Use the root package or supported subpaths with ESM, CommonJS, and TypeScript declarations.',
      vi: 'Dùng package gốc hoặc các subpath được hỗ trợ với ESM, CommonJS và khai báo TypeScript.',
    },
    keywords: {
      en: ['exports', 'entry points', 'ESM', 'CommonJS', 'types'],
      vi: ['export', 'entry point', 'ESM', 'CommonJS', 'kiểu'],
    },
    anchors: [
      { anchor: 'supported-entrypoints', title: { en: 'Supported entry points', vi: 'Các entry point được hỗ trợ' } },
      { anchor: 'import-strategy', title: { en: 'Import strategy', vi: 'Chiến lược import' } },
      { anchor: 'module-formats', title: { en: 'Module formats', vi: 'Định dạng module' } },
    ],
    load: lazyPage(() => import('./start/package-exports')),
  }),
  definePage({
    id: 'start-runtime-support',
    routeId: 'start/runtime-support',
    group: 'start',
    order: 3,
    title: { en: 'Runtime support', vi: 'Hỗ trợ runtime' },
    summary: {
      en: 'Know which APIs require Node, Web Crypto, DOM capabilities, or optional RxJS interop.',
      vi: 'Biết API nào cần Node, Web Crypto, DOM hoặc khả năng tương tác RxJS tùy chọn.',
    },
    keywords: {
      en: ['Node.js', 'browser', 'ES2022', 'Web Crypto', 'RxJS', 'runtime'],
      vi: ['Node.js', 'trình duyệt', 'ES2022', 'Web Crypto', 'RxJS', 'runtime'],
    },
    anchors: [
      { anchor: 'supported-runtimes', title: { en: 'Supported runtimes', vi: 'Runtime được hỗ trợ' } },
      { anchor: 'web-platform-capabilities', title: { en: 'Web-platform capabilities', vi: 'Khả năng Web Platform' } },
      { anchor: 'optional-rxjs', title: { en: 'Optional RxJS interop', vi: 'Tương tác RxJS tùy chọn' } },
      { anchor: 'explicit-failures', title: { en: 'Explicit failures', vi: 'Lỗi tường minh' } },
    ],
    load: lazyPage(() => import('./start/runtime-support')),
  }),
] as const;
