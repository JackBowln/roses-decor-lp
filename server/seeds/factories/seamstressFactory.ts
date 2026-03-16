import type { SeamstressRecord } from '@/lib/quoteWorkspace'
import { FIRST_NAMES, formatMockPhone, LAST_NAMES, type SeedFactoryContext } from '~~/server/seeds/factories/shared'

export const buildMockSeamstress = (context: SeedFactoryContext, index: number): SeamstressRecord => {
  const firstName = FIRST_NAMES[(index + 4) % FIRST_NAMES.length]
  const lastName = LAST_NAMES[(index + 1) % LAST_NAMES.length]
  const createdAt = context.isoDateTimeOffset(-220 + index * 5, 8)

  return {
    id: context.nextId('sem'),
    name: `${firstName} ${lastName}`,
    email: `costura.${firstName.toLowerCase()}${index + 1}@mock.rosesdecor.com`,
    whatsapp: formatMockPhone(200 + index),
    notes: index % 2 === 0 ? 'Atende cortina wave e acabamento premium.' : 'Prefere produção com lead time de 7 dias.',
    status: index % 5 === 0 ? 'inativa' : 'ativa',
    createdAt,
    updatedAt: createdAt,
  }
}
