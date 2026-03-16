import type { StockMovementRecord, StockMovementType } from '@/lib/quoteWorkspace'
import type { SeedFactoryContext } from '~~/server/seeds/factories/shared'

export const buildMockStockMovement = (context: SeedFactoryContext, input: {
  seamstressId: string
  fabricId: string
  type: StockMovementType
  quantityMeters: number
  createdAt: string
  quoteId?: string | null
  quoteItemId?: string | null
  notes?: string
}): StockMovementRecord => ({
  id: context.nextId('mov'),
  seamstressId: input.seamstressId,
  fabricId: input.fabricId,
  quoteId: input.quoteId || null,
  quoteItemId: input.quoteItemId || null,
  type: input.type,
  quantityMeters: Number(input.quantityMeters.toFixed(3)),
  notes: input.notes?.trim() || '',
  createdAt: input.createdAt,
})
