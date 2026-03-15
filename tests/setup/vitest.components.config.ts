import vue from '@vitejs/plugin-vue'
import { defineConfig, mergeConfig } from 'vitest/config'
import { sharedVitestConfig } from './vitest.base'

export default mergeConfig(sharedVitestConfig, defineConfig({
  plugins: [vue()],
  test: {
    name: 'components',
    environment: 'happy-dom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: [
      'tests/components/**/*.spec.ts',
    ],
    exclude: [
      'tests/*.test.mjs',
    ],
  },
}))
