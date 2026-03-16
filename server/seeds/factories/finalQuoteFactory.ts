import { createEmptyLineItem, createEmptyQuoteRecord, type ProductCategory } from '@/lib/adminQuote'
import type {
  CustomerRecord,
  FabricRecord,
  InstallerRecord,
  QuoteFabricConsumptionRecord,
  QuoteStageTransitionRecord,
  SeamstressRecord,
  StoredFinalQuote,
} from '@/lib/quoteWorkspace'
import { type SeedFactoryContext } from '~~/server/seeds/factories/shared'

export interface MockFinalQuoteBundle {
  quote: StoredFinalQuote
  consumptions: QuoteFabricConsumptionRecord[]
  transitions: QuoteStageTransitionRecord[]
}

const BLIND_CATEGORIES: ProductCategory[] = ['Persiana rolo', 'Persiana de madeira', 'Double vision', 'Romana']

const buildQuoteStageTransition = (context: SeedFactoryContext, input: {
  quoteId: string
  fromStage: string
  toStage: string
  changedAt: string
  changedBy?: string
}): QuoteStageTransitionRecord => ({
  id: context.nextId('qst'),
  quoteId: input.quoteId,
  fromStage: input.fromStage,
  toStage: input.toStage,
  changedAt: input.changedAt,
  changedBy: input.changedBy || 'mock-seed',
})

export const buildMockFinalQuote = (context: SeedFactoryContext, input: {
  customer: CustomerRecord
  index: number
  status: StoredFinalQuote['status']
  preQuoteId?: string | null
  seamstress?: SeamstressRecord | null
  installer?: InstallerRecord | null
  fabrics: FabricRecord[]
}): MockFinalQuoteBundle => {
  const record = createEmptyQuoteRecord()
  const createdAt = context.isoDateTimeOffset(-90 + input.index * 2, 14)
  const itemCount = 1 + (input.index % 3)

  record.customer.name = input.customer.name
  record.customer.phone = input.customer.whatsapp
  record.customer.email = input.customer.email
  record.customer.address = input.customer.address
  record.customer.complement = input.customer.complement
  record.customer.neighborhood = input.customer.neighborhood
  record.customer.city = input.customer.city
  record.customer.state = input.customer.state
  record.customer.zipcode = input.customer.zipcode

  record.project.code = context.nextCode('ORC')
  record.project.createdAt = createdAt.slice(0, 10)
  record.project.validUntil = context.isoDateOffset(12)
  record.project.salesRep = 'Roses Decor'
  record.project.paymentMethod = ['Pix', 'Cartão', 'Boleto', 'A combinar'][input.index % 4]!
  record.project.paymentTerms = ['50% no pedido e 50% na entrega.', '30% no pedido e saldo na instalação.', 'Pagamento integral via Pix.', '3x no cartão de crédito.'][input.index % 4]!
  record.project.deliveryLeadTime = `${15 + (input.index % 12)} dias`
  record.project.installationTerms = input.installer ? 'Inclusa no valor' : 'Agendada após medição final'
  record.project.installationDate = input.installer ? context.isoDateOffset(5 + (input.index % 12)) : ''
  record.project.discount = input.index % 4 === 0 ? 120 : 0
  record.project.travelFee = input.index % 5 === 0 ? 90 : 0
  record.project.installationFee = input.installer ? 0 : 160
  record.project.notes = input.index % 3 === 0 ? 'Projeto com validação final de tecido antes da produção.' : 'Pedido com aprovação comercial registrada.'

  if (input.seamstress) {
    record.seamstress.name = input.seamstress.name
    record.seamstress.email = input.seamstress.email
    record.seamstress.whatsapp = input.seamstress.whatsapp
    record.seamstress.notes = input.index % 2 === 0 ? 'Priorizar acabamento wave.' : 'Revisar altura final após confirmação do trilho.'
  }

  if (input.installer) {
    record.installer.name = input.installer.name
    record.installer.email = input.installer.email
    record.installer.whatsapp = input.installer.whatsapp
    record.installer.notes = input.index % 2 === 0 ? 'Cliente prefere instalação no período da manhã.' : 'Acesso liberado pela portaria mediante agendamento.'
  }

  const consumptions: QuoteFabricConsumptionRecord[] = []
  record.items = Array.from({ length: itemCount }, (_, itemIndex) => {
    const item = createEmptyLineItem()
    const width = Number((1.6 + ((input.index + itemIndex) % 4) * 0.7).toFixed(2))
    const height = Number((1.8 + ((input.index + itemIndex) % 3) * 0.25).toFixed(2))
    const quantity = 1 + ((input.index + itemIndex) % 2)
    const isCurtain = (input.index + itemIndex) % 3 !== 1
    const fabric = input.fabrics[(input.index + itemIndex) % input.fabrics.length] || input.fabrics[0]
    const meters = Number((width * quantity + (isCurtain ? 1.2 : 0.6)).toFixed(3))

    item.room = ['Sala', 'Suíte', 'Quarto Augusto', 'Varanda', 'Closet', 'Home office'][(input.index + itemIndex) % 6]!
    item.openingLabel = item.room
    item.quantity = quantity
    item.width = width
    item.height = height
    item.category = isCurtain ? 'Cortina em tecido' : BLIND_CATEGORIES[(input.index + itemIndex) % BLIND_CATEGORIES.length]!
    item.trackType = isCurtain ? 'DUPLO' : 'SIMPLES'
    item.wallSupport = isCurtain ? 'NÃO' : 'SIM'
    item.blackout = isCurtain ? ((input.index + itemIndex) % 2 === 0 ? '1' : '0.7') : 'SEM'
    item.fabric = isCurtain ? (fabric.name.toUpperCase().includes('VOIL') ? 'VOIL' : 'LINHO') : 'NÃO'
    item.fabricColor = fabric.colorOrCollection
    item.pleatModel = isCurtain ? ((input.index + itemIndex) % 2 === 0 ? 'WAVE' : 'PA') : 'NÃO'
    item.installationIncluded = input.installer ? 'SIM' : ((input.index + itemIndex) % 2 === 0 ? 'SIM' : 'NÃO')
    item.mountType = (input.index + itemIndex) % 2 === 0 ? 'Teto' : 'Parede'
    item.openingSide = isCurtain ? 'Dupla abertura' : 'Não se aplica'
    item.controlSide = isCurtain ? '' : ((input.index + itemIndex) % 2 === 0 ? 'Direito' : 'Esquerdo')
    item.installationMeters = item.installationIncluded === 'SIM' ? width : null
    item.unitPrice = Number((fabric.pricePerMeter * meters / quantity).toFixed(2))
    item.sewingPrice = isCurtain ? Number((140 + (input.index + itemIndex) * 12).toFixed(2)) : 0
    item.installationPrice = item.installationIncluded === 'SIM' ? Number((85 + itemIndex * 15).toFixed(2)) : 0
    item.notes = isCurtain ? 'Conferir altura final após instalação do trilho.' : 'Validar lado do comando na visita final.'

    if (input.seamstress && input.status !== 'cancelado') {
      item.fabricConsumptions = [{
        id: context.nextId('qfc-link'),
        fabricId: fabric.id,
        quantityMeters: meters,
      }]
      consumptions.push({
        id: context.nextId('qfc'),
        quoteId: '',
        quoteItemId: item.id,
        seamstressId: input.seamstress.id,
        fabricId: fabric.id,
        quantityMeters: meters,
        createdAt,
        updatedAt: createdAt,
      })
    }
    else {
      item.fabricConsumptions = []
    }

    return item
  })

  const quote: StoredFinalQuote = {
    id: context.nextId('orc'),
    code: record.project.code,
    customerId: input.customer.id,
    preQuoteId: input.preQuoteId || null,
    seamstressId: input.seamstress?.id || null,
    installerId: input.installer?.id || null,
    status: input.status,
    record,
    createdAt,
    updatedAt: createdAt,
  }

  consumptions.forEach((consumption) => {
    consumption.quoteId = quote.id
  })

  const transitions: QuoteStageTransitionRecord[] = []

  if (input.status === 'pronto' || input.status === 'cancelado') {
    transitions.push(buildQuoteStageTransition(context, {
      quoteId: quote.id,
      fromStage: 'rascunho',
      toStage: 'pronto',
      changedAt: context.isoDateTimeOffset(-40 + input.index, 15),
    }))
  }

  if (input.status === 'cancelado') {
    transitions.push(buildQuoteStageTransition(context, {
      quoteId: quote.id,
      fromStage: 'pronto',
      toStage: 'cancelado',
      changedAt: context.isoDateTimeOffset(-18 + input.index, 16),
    }))
  }

  return { quote, consumptions, transitions }
}
