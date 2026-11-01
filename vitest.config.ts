import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Date helpers (e.g. date-fns format) render in the process's local
    // timezone. Pin UTC so results match the Vercel runtime and don't
    // depend on the developer's machine.
    env: { TZ: 'UTC' },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
