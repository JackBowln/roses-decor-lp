import type { SeamstressFabricStockRecord } from '@/lib/quoteWorkspace'
import type { SeedFactoryContext } from '~~/server/seeds/factories/shared'

export const buildMockStockBalance = (context: SeedFactoryContext, input: {
  seamstressId: string
  fabricId: string
  balanceMeters: number
  createdAt: string
  updatedAt: string
}): SeamstressFabricStockRecord => ({
  id: context.nextId('stk'),
  seamstressId: input.seamstressId,
  fabricId: input.fabricId,
  balanceMeters: Number(input.balanceMeters.toFixed(3)),
  createdAt: input.createdAt,
  updatedAt: input.updatedAt,
})
