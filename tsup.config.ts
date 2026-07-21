import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    models: 'src/models/index.ts',
    constants: 'src/constants/index.ts',
    fns: 'src/fns/index.ts',
    errors: 'src/errors.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
});
