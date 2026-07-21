import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');

export default defineConfig({
  base: '/sdcorejs-utils/',
  resolve: {
    alias: [
      { find: '@sdcorejs/utils/models',    replacement: resolve(__dirname, '../src/models/index.ts') },
      { find: '@sdcorejs/utils/constants', replacement: resolve(__dirname, '../src/constants/index.ts') },
      { find: '@sdcorejs/utils/fns',       replacement: resolve(__dirname, '../src/fns/index.ts') },
      { find: '@sdcorejs/utils/errors',    replacement: resolve(__dirname, '../src/errors.ts') },
      { find: '@sdcorejs/utils',           replacement: resolve(__dirname, '../src/index.ts') },
    ],
  },
  build: {
    manifest: true,
    target: 'es2022',
  },
});
