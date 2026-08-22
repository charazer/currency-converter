/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/currency-converter/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test/setup.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/composables/**', 'src/api/**'],
      exclude: ['src/**/*.spec.ts'],
      reporter: ['text', 'lcov'],
      // The formatting engine is the reason this project exists, so it carries its own floor.
      thresholds: {
        'src/lib/numberFormat.ts': { statements: 95, branches: 85, functions: 95, lines: 95 },
        'src/lib/numberParse.ts': { statements: 95, branches: 90, functions: 95, lines: 95 },
        'src/lib/convert.ts': { statements: 95, branches: 85, functions: 95, lines: 95 },
      },
    },
  },
})
