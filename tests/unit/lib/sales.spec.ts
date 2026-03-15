import { describe, expect, it } from 'vitest'
import {
  buildSaleListItem,
  buildSalesDashboardMetrics,
  groupSalesByCustomer,
  inferPaymentMethod,
} from '@/lib/sales'
import type { QuoteStageTransitionRecord } from '@/lib/quoteWorkspace'
import { createTestQuoteRecord } from '../../factories/adminQuote'
import { createTestSaleRecord } from '../../factories/sales'

describe('sales', () => {
  it('infers payment method from explicit values and payment terms fallback', () => {
    expect(inferPaymentMethod('Pix', '')).toBe('Pix')
    expect(inferPaymentMethod('', 'Pagamento no pix')).toBe('Pix')
    expect(inferPaymentMethod('', '3x no cartao')).toBe('Cartão')
    expect(inferPaymentMethod('', '')).toBe('Nao informado')
  })

  it('builds sale list items with derived product labels and fallback contacts', () => {
    const sale = createTestSaleRecord({
      recordSnapshot: createTestQuoteRecord({
        installer: {
          name: '',
        },
      }),
    })

    const listItem = buildSaleListItem({
      sale,
      customer: {
        id: 'cus_test_1',
        name: 'Vanessa',
        whatsapp: '(27) 99856-3743',
        email: 'vanessa@example.com',
        locationLabel: 'Vitoria - ES',
        city: 'Vitoria',
        state: 'ES',
      },
    })

    expect(listItem.productTypes).toEqual(['cortina'])
    expect(listItem.productLabel).toBe('Cortina')
    expect(listItem.installerName).toBe('Sem instalador')
  })

  it('groups sales by customer and sums totals', () => {
    const saleA = buildSaleListItem({
      sale: createTestSaleRecord({ id: 'ven_a' }),
      customer: {
        id: 'cus_a',
        name: 'Alice',
        whatsapp: '',
        email: '',
        locationLabel: 'Vitoria - ES',
        city: 'Vitoria',
        state: 'ES',
      },
    })

    const saleB = buildSaleListItem({
      sale: createTestSaleRecord({ id: 'ven_b', customerId: 'cus_a' }),
      customer: saleA.customer,
    })

    const groups = groupSalesByCustomer([saleB, saleA])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.saleCount).toBe(2)
    expect(groups[0]?.totalValue).toBe(saleA.totalValue + saleB.totalValue)
  })

  it('builds dashboard metrics from sales and quote stage transitions', () => {
    const sale = buildSaleListItem({
      sale: createTestSaleRecord(),
      customer: {
        id: 'cus_a',
        name: 'Alice',
        whatsapp: '',
        email: '',
        locationLabel: 'Vitoria - ES',
        city: 'Vitoria',
        state: 'ES',
      },
    })

    const transitions: QuoteStageTransitionRecord[] = [
      {
        id: 'tra_1',
        quoteId: sale.quoteId,
        fromStage: 'rascunho',
        toStage: 'pronto',
        changedAt: '2026-03-15T10:00:00.000Z',
        changedBy: 'admin',
      },
      {
        id: 'tra_2',
        quoteId: sale.quoteId,
        fromStage: 'pronto',
        toStage: 'vendido',
        changedAt: '2026-03-15T12:00:00.000Z',
        changedBy: 'admin',
      },
    ]

    const metrics = buildSalesDashboardMetrics({
      sales: [sale],
      transitions,
      range: 'year',
    })

    expect(metrics.saleCount).toBe(1)
    expect(metrics.totalSold).toBe(sale.totalValue)
    expect(metrics.conversionRate).toBe(100)
    expect(metrics.topPaymentMethod).toBe(sale.paymentMethod)
  })
})
