export type MockSeedProfile = 'small' | 'medium' | 'large' | 'sales-heavy' | 'operations-heavy'

export interface MockSeedProfileDefinition {
  customerCount: number
  seamstressCount: number
  installerCount: number
  fabricCount: number
  preQuoteCount: number
  convertedQuoteCount: number
  directQuoteCount: number
  soldQuoteCount: number
  paidSaleCount: number
  installerDispatchCount: number
  stockCoveragePerSeamstress: number
}

export const MOCK_SEED_PROFILE_DEFINITIONS: Record<MockSeedProfile, MockSeedProfileDefinition> = {
  small: {
    customerCount: 8,
    seamstressCount: 4,
    installerCount: 3,
    fabricCount: 10,
    preQuoteCount: 10,
    convertedQuoteCount: 6,
    directQuoteCount: 5,
    soldQuoteCount: 5,
    paidSaleCount: 3,
    installerDispatchCount: 3,
    stockCoveragePerSeamstress: 4,
  },
  medium: {
    customerCount: 14,
    seamstressCount: 5,
    installerCount: 4,
    fabricCount: 15,
    preQuoteCount: 22,
    convertedQuoteCount: 12,
    directQuoteCount: 10,
    soldQuoteCount: 10,
    paidSaleCount: 6,
    installerDispatchCount: 6,
    stockCoveragePerSeamstress: 6,
  },
  large: {
    customerCount: 26,
    seamstressCount: 8,
    installerCount: 6,
    fabricCount: 24,
    preQuoteCount: 42,
    convertedQuoteCount: 24,
    directQuoteCount: 20,
    soldQuoteCount: 20,
    paidSaleCount: 12,
    installerDispatchCount: 12,
    stockCoveragePerSeamstress: 10,
  },
  'sales-heavy': {
    customerCount: 18,
    seamstressCount: 5,
    installerCount: 4,
    fabricCount: 14,
    preQuoteCount: 20,
    convertedQuoteCount: 14,
    directQuoteCount: 14,
    soldQuoteCount: 18,
    paidSaleCount: 12,
    installerDispatchCount: 10,
    stockCoveragePerSeamstress: 5,
  },
  'operations-heavy': {
    customerCount: 16,
    seamstressCount: 7,
    installerCount: 6,
    fabricCount: 22,
    preQuoteCount: 18,
    convertedQuoteCount: 10,
    directQuoteCount: 12,
    soldQuoteCount: 8,
    paidSaleCount: 4,
    installerDispatchCount: 10,
    stockCoveragePerSeamstress: 10,
  },
}

export const resolveMockSeedProfile = (value?: string | null): MockSeedProfile => {
  const normalized = value?.trim().toLowerCase() || 'medium'

  if (normalized in MOCK_SEED_PROFILE_DEFINITIONS) {
    return normalized as MockSeedProfile
  }

  throw new Error(`Perfil de seed mock inválido: "${value}". Use small, medium, large, sales-heavy ou operations-heavy.`)
}
