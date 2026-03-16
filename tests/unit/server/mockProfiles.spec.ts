import { describe, expect, it } from 'vitest'
import { MOCK_SEED_PROFILE_DEFINITIONS, resolveMockSeedProfile } from '~~/server/seeds/mockProfiles'

describe('mockProfiles', () => {
  it('resolve o perfil padrão como medium quando nada é informado', () => {
    expect(resolveMockSeedProfile()).toBe('medium')
  })

  it('aceita perfis válidos', () => {
    expect(resolveMockSeedProfile('sales-heavy')).toBe('sales-heavy')
    expect(resolveMockSeedProfile('operations-heavy')).toBe('operations-heavy')
  })

  it('expõe um catálogo coerente de perfis', () => {
    expect(MOCK_SEED_PROFILE_DEFINITIONS.large.customerCount).toBeGreaterThan(MOCK_SEED_PROFILE_DEFINITIONS.small.customerCount)
    expect(MOCK_SEED_PROFILE_DEFINITIONS['sales-heavy'].soldQuoteCount).toBeGreaterThan(MOCK_SEED_PROFILE_DEFINITIONS.small.soldQuoteCount)
  })

  it('falha para perfil inválido', () => {
    expect(() => resolveMockSeedProfile('staging')).toThrow(/Perfil de seed mock inválido/)
  })
})
