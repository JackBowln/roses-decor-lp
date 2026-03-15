import type { QuoteItemFabricConsumption, QuoteLineItem } from '@/lib/adminQuote'
import { resolveFabricConsumptionMeters } from '@/lib/adminQuoteManagement'

export const adminQuoteItemFieldHelp = {
  room: 'Nome interno do ambiente que vai aparecer no orçamento e nos pedidos operacionais.',
  openingLabel: 'Identificação do vão, janela ou porta onde a peça será instalada.',
  category: 'Categoria principal do produto para orientar descrição técnica, PDF e operação.',
  width: 'Largura final estimada da peça ou do vão em metros.',
  height: 'Altura final estimada da peça ou do vão em metros.',
  quantity: 'Quantidade de peças iguais dentro deste mesmo item.',
  trackType: 'Tipo de trilho ou ferragem principal usado no ambiente.',
  wallSupport: 'Indica se haverá suporte de parede no conjunto.',
  slider: 'Define se o item utiliza deslizante na operação do trilho.',
  terminal: 'Define se o item leva terminal no acabamento da ferragem.',
  installationIncluded: 'Controla se o item entra na ficha de instalação e nos cálculos operacionais.',
  blackout: 'Nível de blackout pretendido para o conjunto.',
  customerFabric: 'Referência comercial escolhida pelo cliente no pré-orçamento ou na venda. Não movimenta estoque.',
  fabricColor: 'Cor, coleção ou observação comercial do tecido apresentado ao cliente.',
  pleatModel: 'Modelo de prega ou acabamento principal da cortina.',
  mountType: 'Forma de fixação do item: teto, parede ou vão.',
  openingSide: 'Sentido de abertura da peça ou configuração do recolhimento.',
  controlSide: 'Lado do comando, recolhimento ou observação operacional do acionamento.',
  installationMeters: 'Metragem efetiva usada para instalação. Se ficar vazio, o sistema usa a largura do item.',
  unitPrice: 'Valor do material. Pode ser manual ou calculado automaticamente a partir do tecido de estoque.',
  sewingPrice: 'Custo ou repasse de costura deste item.',
  installationPrice: 'Custo ou repasse de instalação deste item.',
  notes: 'Observações técnicas ou de obra que precisam acompanhar o item.',
  stockSection: 'Área operacional para vincular o tecido físico usado pela costureira e dar baixa no estoque.',
  stockFabric: 'Tecido real separado no estoque da costureira para este item.',
  stockConsumption: 'Quantidade em metros consumida desse tecido no item.',
} as const

export const parseNullableNumber = (value: string) => {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const parseNullableMeters = (value: string) => {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export const hasAutomaticMaterialPricingForItem = (
  item: QuoteLineItem,
  fabricPriceById: Record<string, number>,
) =>
  (item.fabricConsumptions || []).some((consumption) => {
    const quantityMeters = resolveFabricConsumptionMeters(item, consumption)

    return Boolean(consumption.fabricId)
      && typeof fabricPriceById[consumption.fabricId] === 'number'
      && fabricPriceById[consumption.fabricId] > 0
      && quantityMeters !== null
      && quantityMeters > 0
  })

export const buildQuoteItemStockHint = (input: {
  fabricId: string
  stockByFabricId: Record<string, number>
  fabricPriceById: Record<string, number>
}) => {
  if (!input.fabricId) {
    return ''
  }

  const balance = input.stockByFabricId[input.fabricId]
  const pricePerMeter = input.fabricPriceById[input.fabricId]
  const details: string[] = []

  if (typeof balance === 'number') {
    details.push(`Saldo atual: ${balance.toFixed(2)} m`)
  }
  else {
    details.push('Sem saldo cadastrado para esta costureira.')
  }

  if (typeof pricePerMeter === 'number') {
    details.push(`R$ ${pricePerMeter.toFixed(2)}/m`)
  }

  return details.join(' • ')
}

export const buildQuoteItemConsumptionHint = (input: {
  item: QuoteLineItem
  consumption: QuoteItemFabricConsumption
  stockByFabricId: Record<string, number>
  fabricPriceById: Record<string, number>
}) => {
  const stockHint = buildQuoteItemStockHint({
    fabricId: input.consumption.fabricId,
    stockByFabricId: input.stockByFabricId,
    fabricPriceById: input.fabricPriceById,
  })

  if (!input.consumption.fabricId) {
    return stockHint || 'Selecione o tecido para consultar saldo.'
  }

  const explicitMeters = parseNullableMeters(String(input.consumption.quantityMeters ?? '').trim())

  if (explicitMeters && explicitMeters > 0) {
    return stockHint
  }

  const estimatedMeters = resolveFabricConsumptionMeters(input.item, input.consumption)

  if (!estimatedMeters || estimatedMeters <= 0) {
    return stockHint || 'Informe a metragem consumida para calcular o material.'
  }

  const estimatedLabel = `Estimativa automática: ${estimatedMeters.toFixed(2)} m pela largura x quantidade do item.`
  return stockHint ? `${stockHint} • ${estimatedLabel}` : estimatedLabel
}
