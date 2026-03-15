import { existsSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = resolvePath(dirname(fileURLToPath(import.meta.url)), '..')
const extensionCandidates = ['', '.ts', '.js', '.mjs', '/index.ts', '/index.js', '/index.mjs']

const resolveAliasFile = (baseDir, request) => {
  for (const extension of extensionCandidates) {
    const candidate = resolvePath(baseDir, `${request}${extension}`)

    if (existsSync(candidate)) {
      return pathToFileURL(candidate).href
    }
  }

  return null
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('@/')) {
    const resolved = resolveAliasFile(resolvePath(rootDir, 'app'), specifier.slice(2))

    if (resolved) {
      return defaultResolve(resolved, context, defaultResolve)
    }
  }

  if (specifier.startsWith('~~/')) {
    const resolved = resolveAliasFile(rootDir, specifier.slice(3))

    if (resolved) {
      return defaultResolve(resolved, context, defaultResolve)
    }
  }

  return defaultResolve(specifier, context, defaultResolve)
}
