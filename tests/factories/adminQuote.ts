import {
  createEmptyLineItem,
  createEmptyQuoteRecord,
  type AdminQuoteRecord,
  type QuoteItemFabricConsumption,
  type QuoteLineItem,
} from '@/lib/adminQuote'

type LineItemOverrides = Partial<QuoteLineItem> & {
  fabricConsumptions?: QuoteItemFabricConsumption[]
}

type RecordOverrides = Partial<AdminQuoteRecord> & {
  customer?: Partial<AdminQuoteRecord['customer']>
  project?: Partial<AdminQuoteRecord['project']>
  seamstress?: Partial<AdminQuoteRecord['seamstress']>
  installer?: Partial<AdminQuoteRecord['installer']>
  items?: LineItemOverrides[]
}

export const createTestQuoteLineItem = (overrides: LineItemOverrides = {}): QuoteLineItem => ({
  ...createEmptyLineItem(),
  room: 'Sala',
  openingLabel: 'Janela principal',
  category: 'Cortina em tecido',
  quantity: 2,
  width: 2.5,
  height: 2.8,
  trackType: 'DUPLO',
  installationIncluded: 'SIM',
  unitPrice: 420,
  sewingPrice: 150,
  installationPrice: 90,
  ...overrides,
  fabricConsumptions: overrides.fabricConsumptions ?? createEmptyLineItem().fabricConsumptions,
})

export const createTestQuoteRecord = (overrides: RecordOverrides = {}): AdminQuoteRecord => {
  const record = createEmptyQuoteRecord()

  return {
    ...record,
    ...overrides,
    customer: {
      ...record.customer,
      name: 'Vanessa Passos Lima',
      phone: '(27) 99856-3743',
      email: 'vanessa@example.com',
      address: 'Av Dante Micheline, 4585',
      complement: 'Apto 705',
      neighborhood: 'Jardim Camburi',
      city: 'Vitoria',
      state: 'ES',
      zipcode: '29090-635',
      ...overrides.customer,
    },
    project: {
      ...record.project,
      code: 'ORC-2026-03141346-YKQ51',
      createdAt: '2026-03-14',
      validUntil: '2026-03-29',
      installationDate: '2026-03-30',
      paymentMethod: 'Pix',
      paymentTerms: '50% no pedido e 50% na entrega.',
      deliveryLeadTime: '20 dias',
      cashDiscountRate: 20,
      cardDiscountRate: 10,
      cardInstallments: 3,
      discount: 50,
      travelFee: 20,
      installationFee: 30,
      ...overrides.project,
    },
    seamstress: {
      ...record.seamstress,
      name: 'Atelie Central',
      email: 'costura@example.com',
      whatsapp: '(27) 99999-1111',
      notes: 'Prioridade alta',
      ...overrides.seamstress,
    },
    installer: {
      ...record.installer,
      name: 'Equipe Instalacao',
      email: 'instalacao@example.com',
      whatsapp: '(27) 99999-2222',
      notes: 'Levar escada dupla',
      ...overrides.installer,
    },
    items: overrides.items
      ? overrides.items.map((item) => createTestQuoteLineItem(item))
      : [createTestQuoteLineItem()],
  }
}
