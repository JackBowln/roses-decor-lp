import type { FabricRecord } from '@/lib/quoteWorkspace'
import { FABRIC_CATEGORIES, FABRIC_COLORS, type SeedFactoryContext } from '~~/server/seeds/factories/shared'

export const buildMockFabric = (context: SeedFactoryContext, index: number): FabricRecord => {
  const name = ['Linho', 'Voil', 'Blackout', 'Tela solar', 'Jacquard', 'Gaze', 'Sarja', 'Percal'][index % 8]
  const createdAt = context.isoDateTimeOffset(-260 + index * 2, 8)

  return {
    id: context.nextId('fab'),
    name,
    category: FABRIC_CATEGORIES[index % FABRIC_CATEGORIES.length],
    colorOrCollection: `${FABRIC_COLORS[index % FABRIC_COLORS.length]} ${index + 1}`,
    pricePerMeter: 39 + (index % 7) * 12 + (index % 3) * 3.5,
    unit: 'metro',
    status: index % 11 === 0 ? 'inativo' : 'ativo',
    createdAt,
    updatedAt: createdAt,
  }
}
