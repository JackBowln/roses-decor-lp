import type { CustomerRecord, PreQuoteItemRecord, PreQuoteRecord } from '@/lib/quoteWorkspace'
import { CURTAIN_FABRICS, ROOM_NAMES, BLIND_MATERIALS, type SeedFactoryContext } from '~~/server/seeds/factories/shared'

const buildPreQuoteItem = (context: SeedFactoryContext, index: number): PreQuoteItemRecord => {
  const isCurtain = index % 3 !== 1
  const width = Number((1.4 + (index % 4) * 0.55).toFixed(2))
  const height = Number((1.6 + (index % 3) * 0.35).toFixed(2))

  return {
    id: context.nextId('pqi'),
    type: isCurtain ? 'Cortina' : 'Persiana',
    environment: ROOM_NAMES[index % ROOM_NAMES.length],
    materialLabel: isCurtain ? CURTAIN_FABRICS[index % CURTAIN_FABRICS.length] : BLIND_MATERIALS[index % BLIND_MATERIALS.length],
    blackoutLabel: isCurtain ? (index % 2 === 0 ? '100%' : '70%') : 'NÃO SE APLICA',
    width,
    height,
    measuresPending: index % 5 === 0,
    notes: index % 4 === 0 ? 'Cliente pediu revisão de cor antes da produção.' : '',
  }
}

export const buildMockPreQuote = (context: SeedFactoryContext, input: {
  customer: CustomerRecord
  index: number
  linkedFinalQuoteId?: string | null
}): PreQuoteRecord => {
  const itemCount = 1 + (input.index % 3)
  const createdAt = context.isoDateTimeOffset(-120 + input.index * 2, 11)
  const items = Array.from({ length: itemCount }, (_, itemIndex) => buildPreQuoteItem(context, input.index * 3 + itemIndex))

  return {
    id: context.nextId('pre'),
    code: context.nextCode('PRE'),
    customerId: input.customer.id,
    origin: 'site',
    status: input.linkedFinalQuoteId ? 'convertido' : input.index % 4 === 0 ? 'em_analise' : 'novo',
    items,
    measuresPendingNote: items.some((item) => item.measuresPending) ? 'Há ambientes com medidas pendentes de visita técnica.' : '',
    pdfPath: '',
    createdAt,
    updatedAt: createdAt,
    finalQuoteId: input.linkedFinalQuoteId || null,
  }
}
