import { defineConfig } from 'vitest/config';

import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom', // Чтобы был глобальный window
    setupFiles: ['./tests.setup.js'], // Тут объявление глобальных переменных которые делает электрон
  },
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
    },
  },
});
