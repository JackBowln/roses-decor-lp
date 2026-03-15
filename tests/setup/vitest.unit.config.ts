import { defineConfig, mergeConfig } from 'vitest/config'
import { sharedVitestConfig } from './vitest.base'

export default mergeConfig(sharedVitestConfig, defineConfig({
  test: {
    name: 'unit',
    environment: 'node',
    include: [
      'tests/unit/**/*.spec.ts',
    ],
    exclude: [
      'tests/components/**/*.spec.ts',
      'tests/nuxt/**/*.spec.ts',
      'tests/*.test.mjs',
    ],
  },
}))
