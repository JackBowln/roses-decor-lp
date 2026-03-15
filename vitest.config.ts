import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      './tests/setup/vitest.unit.config.ts',
      './tests/setup/vitest.components.config.ts',
      './tests/setup/vitest.nuxt.config.ts',
    ],
  },
})
