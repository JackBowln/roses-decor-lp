export type AppDbTarget = 'development' | 'test' | 'production'

export interface ResolvedDatabaseConfig {
  target: AppDbTarget
  url: string
  envVarName: DatabaseUrlEnvName
}

export type DatabaseUrlEnvName =
  | 'DATABASE_URL_DEVELOPMENT'
  | 'DATABASE_URL_TEST'
  | 'DATABASE_URL_PRODUCTION'

export const APP_DB_TARGET_ENV = 'APP_DB_TARGET'
export const MOCK_SEED_PROD_OVERRIDE_ENV = 'ALLOW_MOCK_SEED_IN_PROD'
export const MOCK_SEED_PROD_CONFIRMATION = 'ALLOW_PRODUCTION_MOCK_SEED'

const DATABASE_URL_ENV_BY_TARGET: Record<AppDbTarget, DatabaseUrlEnvName> = {
  development: 'DATABASE_URL_DEVELOPMENT',
  test: 'DATABASE_URL_TEST',
  production: 'DATABASE_URL_PRODUCTION',
}

const loggedTargets = new Set<string>()
const warnedTargetPairs = new Set<string>()

const isTarget = (value: string): value is AppDbTarget =>
  value === 'development' || value === 'test' || value === 'production'

const sanitizeTarget = (value?: string | null) => value?.trim().toLowerCase() || ''

const maskDatabaseUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname && parsed.pathname !== '/'
      ? parsed.pathname
      : '/'

    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${path}`
  }
  catch {
    return '[connection-string inválida]'
  }
}

export const resolveAppDbTarget = (options?: { optional?: boolean }): AppDbTarget | null => {
  const rawTarget = sanitizeTarget(process.env[APP_DB_TARGET_ENV])

  if (!rawTarget) {
    if (options?.optional) {
      return null
    }

    throw new Error(`Defina ${APP_DB_TARGET_ENV} como development, test ou production.`)
  }

  if (!isTarget(rawTarget)) {
    throw new Error(`Valor inválido para ${APP_DB_TARGET_ENV}: "${rawTarget}". Use development, test ou production.`)
  }

  return rawTarget
}

export const resolveDatabaseUrlEnvName = (target: AppDbTarget): DatabaseUrlEnvName => DATABASE_URL_ENV_BY_TARGET[target]

export const resolveDatabaseConfig = (options?: {
  optional?: boolean
  logContext?: string | false
}): ResolvedDatabaseConfig | null => {
  const target = resolveAppDbTarget({ optional: options?.optional })

  if (!target) {
    return null
  }

  const envVarName = resolveDatabaseUrlEnvName(target)
  const url = process.env[envVarName]?.trim() || ''

  if (!url) {
    throw new Error(`Configure ${envVarName} para usar ${APP_DB_TARGET_ENV}=${target}.`)
  }

  const config: ResolvedDatabaseConfig = {
    target,
    url,
    envVarName,
  }

  if (options?.logContext !== false) {
    logResolvedDatabaseConfig(config, options?.logContext || 'database')
  }

  warnIfTargetSharesProductionUrl(config)

  return config
}

export const isProductionDatabaseTarget = (targetOrConfig: AppDbTarget | ResolvedDatabaseConfig | null | undefined) => {
  if (!targetOrConfig) {
    return false
  }

  return typeof targetOrConfig === 'string'
    ? targetOrConfig === 'production'
    : targetOrConfig.target === 'production'
}

export const logResolvedDatabaseConfig = (config: ResolvedDatabaseConfig, context = 'database') => {
  const logKey = `${context}:${config.target}:${config.envVarName}`

  if (loggedTargets.has(logKey)) {
    return
  }

  loggedTargets.add(logKey)
  console.info(`[db] ${context}: target=${config.target} env=${config.envVarName} source=${maskDatabaseUrl(config.url)}`)
}

const warnIfTargetSharesProductionUrl = (config: ResolvedDatabaseConfig) => {
  if (config.target === 'production') {
    return
  }

  const productionUrl = process.env.DATABASE_URL_PRODUCTION?.trim() || ''

  if (!productionUrl || productionUrl !== config.url) {
    return
  }

  const warningKey = `${config.target}:${config.envVarName}:DATABASE_URL_PRODUCTION`

  if (warnedTargetPairs.has(warningKey)) {
    return
  }

  warnedTargetPairs.add(warningKey)
  console.warn(
    `[db] aviso: ${config.envVarName} está usando a mesma connection string de DATABASE_URL_PRODUCTION. `
    + `O target ${config.target} não ficará isolado da produção até que a URL seja trocada.`,
  )
}

export const assertMockSeedAllowed = (config: ResolvedDatabaseConfig, options?: { confirmation?: string }) => {
  if (!isProductionDatabaseTarget(config)) {
    return
  }

  const hasProdOverride = process.env[MOCK_SEED_PROD_OVERRIDE_ENV] === 'true'
  const confirmed = options?.confirmation === MOCK_SEED_PROD_CONFIRMATION

  if (!hasProdOverride || !confirmed) {
    throw new Error(
      `Seed mock bloqueado por segurança para ${APP_DB_TARGET_ENV}=production. `
      + `Exija ${MOCK_SEED_PROD_OVERRIDE_ENV}=true e --confirm=${MOCK_SEED_PROD_CONFIRMATION} para prosseguir manualmente.`,
    )
  }
}

export const assertDatabaseResetAllowed = (config: ResolvedDatabaseConfig) => {
  if (isProductionDatabaseTarget(config)) {
    throw new Error(
      `Reset de banco bloqueado por segurança para ${APP_DB_TARGET_ENV}=production. Operações destrutivas não são permitidas em produção.`,
    )
  }
}
