import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  APP_DB_TARGET_ENV,
  MOCK_SEED_PROD_CONFIRMATION,
  MOCK_SEED_PROD_OVERRIDE_ENV,
  assertDatabaseResetAllowed,
  assertMockSeedAllowed,
  resolveDatabaseConfig,
} from '~~/server/utils/databaseConfig'

afterEach(() => {
  delete process.env[APP_DB_TARGET_ENV]
  delete process.env.DATABASE_URL_DEVELOPMENT
  delete process.env.DATABASE_URL_TEST
  delete process.env.DATABASE_URL_PRODUCTION
  delete process.env[MOCK_SEED_PROD_OVERRIDE_ENV]
})

describe('databaseConfig', () => {
  it('resolve a url correspondente ao target ativo', () => {
    process.env[APP_DB_TARGET_ENV] = 'test'
    process.env.DATABASE_URL_TEST = 'postgres://mock-test'

    const config = resolveDatabaseConfig({ logContext: false })

    expect(config).toMatchObject({
      target: 'test',
      envVarName: 'DATABASE_URL_TEST',
      url: 'postgres://mock-test',
    })
  })

  it('falha quando o target é inválido', () => {
    process.env[APP_DB_TARGET_ENV] = 'staging'

    expect(() => resolveDatabaseConfig({ logContext: false })).toThrow(/APP_DB_TARGET/)
  })

  it('bloqueia seed mock em produção sem dupla confirmação', () => {
    process.env[APP_DB_TARGET_ENV] = 'production'
    process.env.DATABASE_URL_PRODUCTION = 'postgres://mock-prod'
    const config = resolveDatabaseConfig({ logContext: false })!

    expect(() => assertMockSeedAllowed(config)).toThrow(/Seed mock bloqueado por segurança/)
  })

  it('permite seed mock em produção apenas com override e confirmação explícitos', () => {
    process.env[APP_DB_TARGET_ENV] = 'production'
    process.env.DATABASE_URL_PRODUCTION = 'postgres://mock-prod'
    process.env[MOCK_SEED_PROD_OVERRIDE_ENV] = 'true'
    const config = resolveDatabaseConfig({ logContext: false })!

    expect(() => assertMockSeedAllowed(config, { confirmation: MOCK_SEED_PROD_CONFIRMATION })).not.toThrow()
  })

  it('bloqueia reset em produção', () => {
    process.env[APP_DB_TARGET_ENV] = 'production'
    process.env.DATABASE_URL_PRODUCTION = 'postgres://mock-prod'
    const config = resolveDatabaseConfig({ logContext: false })!

    expect(() => assertDatabaseResetAllowed(config)).toThrow(/Reset de banco bloqueado por segurança/)
  })

  it('avisa quando development aponta para a mesma url de produção', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    process.env[APP_DB_TARGET_ENV] = 'development'
    process.env.DATABASE_URL_DEVELOPMENT = 'postgres://shared'
    process.env.DATABASE_URL_PRODUCTION = 'postgres://shared'

    resolveDatabaseConfig({ logContext: false })

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DATABASE_URL_DEVELOPMENT'))
    warnSpy.mockRestore()
  })
})
