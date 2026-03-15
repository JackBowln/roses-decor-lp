import { defineVitestConfig } from '@nuxt/test-utils/config'
import { testAliases, testRootDir } from './vitest.base'

export default defineVitestConfig({
  root: testRootDir,
  resolve: {
    alias: testAliases,
  },
  test: {
    name: 'nuxt',
    environment: 'nuxt',
    setupFiles: ['./tests/setup/vitest.nuxt.setup.ts'],
    include: [
      'tests/nuxt/**/*.spec.ts',
    ],
    exclude: [
      'tests/*.test.mjs',
    ],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    passWithNoTests: true,
  },
})
