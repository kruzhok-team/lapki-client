import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from './vitest.config';

// Конфиг для бенчмарка холста (npm run perf:bench), в обычный npm test он не попадает
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/**/*.perf.ts'],
      // Один поток, чтобы замеры не мешали друг другу
      threads: false,
    },
  })
);
