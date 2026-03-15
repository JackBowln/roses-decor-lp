import {
  createEmptyQuoteContact,
  createEmptyQuoteItem,
  type QuoteContact,
  type QuoteItem,
} from '@/lib/publicQuoteForm'

export const createTestQuoteItem = (overrides: Partial<QuoteItem> = {}): QuoteItem => ({
  ...createEmptyQuoteItem(),
  type: 'Cortina',
  env: 'Sala',
  material: 'Linho',
  blackout: 'Sem Blackout',
  width: '2.50',
  height: '2.80',
  dontKnowMeasures: false,
  ...overrides,
})

export const createTestQuoteContact = (overrides: Partial<QuoteContact> = {}): QuoteContact => ({
  ...createEmptyQuoteContact(),
  name: 'Vanessa Passos Lima',
  whatsapp: '(27) 99856-3743',
  email: 'vanessa@example.com',
  location: 'Vitoria - ES',
  ...overrides,
})
