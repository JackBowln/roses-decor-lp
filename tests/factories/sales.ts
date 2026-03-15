import type { SaleRecord } from '@/lib/quoteWorkspace'
import { createSaleRecordFromFinalQuote } from '@/lib/quoteWorkspace'
import { createTestQuoteRecord } from './adminQuote'

export const createTestSaleRecord = (overrides: Partial<SaleRecord> = {}): SaleRecord => {
  const sale = createSaleRecordFromFinalQuote({
    quote: {
      id: 'orc_test_1',
      code: 'ORC-2026-03141346-YKQ51',
      customerId: 'cus_test_1',
      preQuoteId: 'pre_test_1',
      seamstressId: 'sea_test_1',
      installerId: 'ins_test_1',
      status: 'pronto',
      record: createTestQuoteRecord(),
      createdAt: '2026-03-14T10:00:00.000Z',
      updatedAt: '2026-03-14T10:00:00.000Z',
    },
    soldAt: '2026-03-15T12:00:00.000Z',
  })

  return {
    ...sale,
    ...overrides,
    recordSnapshot: overrides.recordSnapshot ?? sale.recordSnapshot,
  }
}
