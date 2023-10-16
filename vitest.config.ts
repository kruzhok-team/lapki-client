import { defineConfig } from 'vitest/config';

import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests.setup.ts'],
  },
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
    },
  },
});
