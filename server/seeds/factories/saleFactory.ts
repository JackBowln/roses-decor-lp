import type { QuoteStageTransitionRecord, SaleRecord, StoredFinalQuote } from '@/lib/quoteWorkspace'
import type { SeedFactoryContext } from '~~/server/seeds/factories/shared'

export interface MockSaleBundle {
  sale: SaleRecord
  transitions: QuoteStageTransitionRecord[]
}

const buildTransition = (context: SeedFactoryContext, input: {
  quoteId: string
  fromStage: string
  toStage: string
  changedAt: string
}): QuoteStageTransitionRecord => ({
  id: context.nextId('qst'),
  quoteId: input.quoteId,
  fromStage: input.fromStage,
  toStage: input.toStage,
  changedAt: input.changedAt,
  changedBy: 'mock-seed',
})

export const buildMockSale = (context: SeedFactoryContext, input: {
  quote: StoredFinalQuote
  index: number
  paid: boolean
}): MockSaleBundle => {
  const soldAt = context.isoDateTimeOffset(-20 + input.index, 13)
  const paidAt = input.paid ? context.isoDateTimeOffset(-10 + input.index, 17) : null
  const snapshot = JSON.parse(JSON.stringify(input.quote.record)) as StoredFinalQuote['record']

  const sale: SaleRecord = {
    id: context.nextId('ven'),
    quoteId: input.quote.id,
    customerId: input.quote.customerId,
    preQuoteId: input.quote.preQuoteId,
    seamstressId: input.quote.seamstressId,
    installerId: input.quote.installerId,
    status: input.paid ? 'pago' : 'vendido',
    recordSnapshot: snapshot,
    soldAt,
    paidAt,
    createdAt: soldAt,
    updatedAt: paidAt || soldAt,
  }

  const transitions = [
    buildTransition(context, {
      quoteId: input.quote.id,
      fromStage: 'pronto',
      toStage: 'vendido',
      changedAt: soldAt,
    }),
  ]

  if (input.paid && paidAt) {
    transitions.push(buildTransition(context, {
      quoteId: input.quote.id,
      fromStage: 'vendido',
      toStage: 'pago',
      changedAt: paidAt,
    }))
  }

  return { sale, transitions }
}
