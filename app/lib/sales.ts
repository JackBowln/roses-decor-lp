import { calculateQuoteTotals, type AdminQuoteRecord, type ProductCategory } from '@/lib/adminQuote'
import type {
  QuoteLifecycleTag,
  QuoteStageTransitionRecord,
  SaleRecord,
  SaleListItem,
  SalesCustomerGroup,
  SalesDashboardMetrics,
  SalesDashboardRange,
} from '@/lib/quoteWorkspace'

type SoldProductType = SaleListItem['productTypes'][number]

const BLIND_CATEGORIES = new Set<ProductCategory>([
  'Persiana rolo',
  'Persiana de madeira',
  'Double vision',
  'Romana',
])

const isBlindCategory = (category: ProductCategory) => BLIND_CATEGORIES.has(category)

export const inferPaymentMethod = (paymentMethod?: string | null, paymentTerms?: string | null) => {
  const explicit = paymentMethod?.trim() || ''

  if (explicit) {
    return explicit
  }

  const normalizedTerms = paymentTerms?.trim().toLowerCase() || ''

  if (!normalizedTerms) {
    return 'Não informado'
  }

  if (normalizedTerms.includes('pix')) {
    return 'Pix'
  }

  if (normalizedTerms.includes('cart') || normalizedTerms.includes('credito') || normalizedTerms.includes('débito')) {
    return 'Cartão'
  }

  if (normalizedTerms.includes('avista') || normalizedTerms.includes('à vista') || normalizedTerms.includes('a vista')) {
    return 'À vista'
  }

  if (normalizedTerms.includes('boleto')) {
    return 'Boleto'
  }

  return 'A combinar'
}

export const deriveSaleProductTypes = (record: AdminQuoteRecord): SoldProductType[] => {
  const hasCurtain = record.items.some((item) => item.category === 'Cortina em tecido')
  const hasBlind = record.items.some((item) => isBlindCategory(item.category))
  const types: SoldProductType[] = []

  if (hasCurtain) {
    types.push('cortina')
  }

  if (hasBlind) {
    types.push('persiana')
  }

  return types
}

export const formatSaleProductLabel = (types: SoldProductType[]) => {
  if (types.length === 2) {
    return 'Cortina + Persiana'
  }

  if (types[0] === 'cortina') {
    return 'Cortina'
  }

  if (types[0] === 'persiana') {
    return 'Persiana'
  }

  return 'Outro'
}

export const getQuoteLifecycleTone = (tag: QuoteLifecycleTag) => {
  switch (tag) {
    case 'Pré-orçamento':
      return 'warning'
    case 'Orçamento':
      return 'primary'
    case 'Orçamento concluído':
      return 'success'
    case 'Vendido':
      return 'primary'
    case 'Pago':
      return 'success'
    case 'Cancelado':
      return 'danger'
  }
}

export const buildSaleListItem = (input: {
  sale: SaleRecord
  customer: SaleListItem['customer']
  preQuoteCode?: string | null
  seamstressName?: string | null
  installerName?: string | null
}): SaleListItem => {
  const productTypes = deriveSaleProductTypes(input.sale.recordSnapshot)

  return {
    ...input.sale,
    customer: input.customer,
    preQuoteCode: input.preQuoteCode || null,
    code: input.sale.recordSnapshot.project.code || input.sale.quoteId,
    totalValue: calculateQuoteTotals(input.sale.recordSnapshot).grandTotal,
    paymentMethod: inferPaymentMethod(
      input.sale.recordSnapshot.project.paymentMethod,
      input.sale.recordSnapshot.project.paymentTerms,
    ),
    paymentTerms: input.sale.recordSnapshot.project.paymentTerms || '',
    itemCount: input.sale.recordSnapshot.items.length,
    productTypes,
    productLabel: formatSaleProductLabel(productTypes),
    seamstressName: input.seamstressName || input.sale.recordSnapshot.seamstress.name || 'Sem costureira',
    installerName: input.installerName || input.sale.recordSnapshot.installer.name || 'Sem instalador',
  }
}

export const groupSalesByCustomer = (sales: SaleListItem[]): SalesCustomerGroup[] => {
  const grouped = new Map<string, SalesCustomerGroup>()

  sales.forEach((sale) => {
    const current = grouped.get(sale.customer.id)

    if (current) {
      current.sales.push(sale)
      current.saleCount += 1
      current.totalValue += sale.totalValue
      if (!current.lastSoldAt || current.lastSoldAt < sale.soldAt) {
        current.lastSoldAt = sale.soldAt
      }
      return
    }

    grouped.set(sale.customer.id, {
      customer: sale.customer,
      sales: [sale],
      saleCount: 1,
      totalValue: sale.totalValue,
      lastSoldAt: sale.soldAt,
    })
  })

  return [...grouped.values()].sort((left, right) =>
    left.customer.name.localeCompare(right.customer.name, 'pt-BR'))
}

const getPeriodStart = (range: SalesDashboardRange) => {
  const date = new Date()

  if (range === 'week') {
    const day = date.getDay()
    const offset = day === 0 ? 6 : day - 1
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    return date
  }

  if (range === 'month') {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  return new Date(date.getFullYear(), 0, 1)
}

const isWithinPeriod = (value: string | null, start: Date) => {
  if (!value) {
    return false
  }

  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed >= start
}

const pickTopLabel = (counter: Map<string, number>, fallback = 'Não informado') => {
  let bestLabel = fallback
  let bestValue = 0

  counter.forEach((value, label) => {
    if (value > bestValue) {
      bestLabel = label
      bestValue = value
    }
  })

  return bestLabel
}

const incrementCounter = (counter: Map<string, number>, label: string, amount = 1) => {
  if (!label.trim()) {
    return
  }

  counter.set(label, (counter.get(label) || 0) + amount)
}

export const buildSalesDashboardMetrics = (input: {
  sales: SaleListItem[]
  transitions: QuoteStageTransitionRecord[]
  range: SalesDashboardRange
}): SalesDashboardMetrics => {
  const start = getPeriodStart(input.range)
  const soldInRange = input.sales.filter((sale) => isWithinPeriod(sale.soldAt, start))
  const paidInRange = input.sales.filter((sale) => isWithinPeriod(sale.paidAt, start))
  const distinctCustomers = new Set(soldInRange.map((sale) => sale.customerId))
  const paymentCounter = new Map<string, number>()
  const seamstressCounter = new Map<string, number>()
  const installerCounter = new Map<string, number>()
  const categoryCounter = new Map<string, number>()

  soldInRange.forEach((sale) => {
    incrementCounter(paymentCounter, sale.paymentMethod)
    incrementCounter(seamstressCounter, sale.seamstressName)
    incrementCounter(installerCounter, sale.installerName)
    sale.recordSnapshot.items.forEach((item) => incrementCounter(categoryCounter, item.category))
  })

  const readyTransitions = input.transitions.filter((transition) =>
    transition.toStage === 'pronto' && isWithinPeriod(transition.changedAt, start))
  const soldTransitions = input.transitions.filter((transition) =>
    transition.toStage === 'vendido' && isWithinPeriod(transition.changedAt, start))
  const totalSold = soldInRange.reduce((sum, sale) => sum + sale.totalValue, 0)
  const totalPaid = paidInRange.reduce((sum, sale) => sum + sale.totalValue, 0)

  return {
    range: input.range,
    totalSold,
    totalPaid,
    saleCount: soldInRange.length,
    ticketAverage: soldInRange.length > 0 ? totalSold / soldInRange.length : 0,
    customerCount: distinctCustomers.size,
    soldCount: soldInRange.filter((sale) => sale.status === 'vendido').length,
    paidCount: soldInRange.filter((sale) => sale.status === 'pago').length,
    conversionRate: readyTransitions.length > 0 ? (soldTransitions.length / readyTransitions.length) * 100 : 0,
    topPaymentMethod: pickTopLabel(paymentCounter),
    topSeamstress: pickTopLabel(seamstressCounter),
    topInstaller: pickTopLabel(installerCounter),
    topCategory: pickTopLabel(categoryCounter),
  }
}
