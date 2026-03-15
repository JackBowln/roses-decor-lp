import { describe, expect, it } from 'vitest'
import {
  calculatePaymentOptions,
  calculateQuoteTotals,
  createEmptyQuoteRecord,
  getDeliveryChecklist,
  getDocumentSummary,
  normalizeAdminQuoteRecord,
  resolveInstallationMeters,
} from '@/lib/adminQuote'
import { createTestQuoteRecord } from '../../factories/adminQuote'

describe('adminQuote', () => {
  it('creates a draft quote with a code and one starter item', () => {
    const record = createEmptyQuoteRecord()

    expect(record.project.code).toMatch(/^ORC-\d{4}-\d{8}-[A-Z0-9]{5}$/)
    expect(record.items).toHaveLength(1)
  })

  it('normalizes invalid records back to safe defaults', () => {
    const normalized = normalizeAdminQuoteRecord({
      project: {
        cardInstallments: 0,
      },
      seamstress: {
        email: 'costura@example.com',
      },
      items: [
        {
          quantity: 0,
          category: 'Categoria invalida',
        },
      ],
    })

    expect(normalized.project.cardInstallments).toBe(1)
    expect(normalized.seamstress.name).toBe('Costureira responsável')
    expect(normalized.items[0]?.quantity).toBe(1)
    expect(normalized.items[0]?.category).toBe('Cortina em tecido')
  })

  it('falls back to the item width when installation meters are not defined', () => {
    expect(resolveInstallationMeters({ installationMeters: 4.2, width: 2.5 })).toBe(4.2)
    expect(resolveInstallationMeters({ installationMeters: null, width: 2.5 })).toBe(2.5)
  })

  it('calculates quote totals and payment options from item subtotals and extras', () => {
    const record = createTestQuoteRecord()

    const totals = calculateQuoteTotals(record)
    const payment = calculatePaymentOptions(record)

    expect(totals).toMatchObject({
      materialSubtotal: 840,
      sewingSubtotal: 150,
      installationSubtotal: 90,
      extrasSubtotal: 50,
      discountTotal: 50,
      grandTotal: 1080,
    })
    expect(payment.cashTotal).toBe(864)
    expect(payment.cardTotal).toBe(972)
    expect(payment.cardInstallmentValue).toBe(324)
  })

  it('builds delivery checklist items for critical operational requirements', () => {
    const checklist = getDeliveryChecklist(createTestQuoteRecord())
    expect(checklist.every((item) => item.completed)).toBe(true)
  })

  it('creates document summaries with centralized titles and generated filenames', () => {
    const summary = getDocumentSummary(createTestQuoteRecord(), 'costureira')

    expect(summary.title).toBe('Pedido da costureira')
    expect(summary.filename).toContain('costureira.pdf')
    expect(summary.lines[0]).toContain('Pedido de costura')
  })
})
