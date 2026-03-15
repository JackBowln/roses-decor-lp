import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export const testRootDir = fileURLToPath(new URL('../..', import.meta.url))
export const appDir = fileURLToPath(new URL('../../app', import.meta.url))

export const testAliases = {
  '@': appDir,
  '@@': testRootDir,
  '~': appDir,
  '~~': testRootDir,
}

export const sharedVitestConfig = defineConfig({
  root: testRootDir,
  resolve: {
    alias: testAliases,
  },
  test: {
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    passWithNoTests: true,
  },
})
