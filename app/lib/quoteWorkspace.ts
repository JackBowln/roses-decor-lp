import {
  createEmptyLineItem,
  createEmptyQuoteRecord,
  formatBlackoutLabel,
  formatArea,
  normalizePhone,
  resolveInstallationMeters,
  type AdminQuoteRecord,
  type BlackoutOption,
  type FabricOption,
  type ProductCategory,
  type QuoteItemFabricConsumption,
  type QuoteLineItem,
} from '@/lib/adminQuote'

export type PreQuoteOrigin = 'site'
export type PreQuoteStatus = 'novo' | 'em_analise' | 'convertido'
export type FinalQuoteStatus = 'rascunho' | 'pronto' | 'cancelado'
export type SeamstressStatus = 'ativa' | 'inativa'
export type InstallerStatus = 'ativo' | 'inativo'
export type FabricStatus = 'ativo' | 'inativo'
export type InstallerDispatchChannel = 'email' | 'whatsapp'
export type InstallerDispatchStatus = 'pendente' | 'enviado' | 'erro'
export type StockMovementType =
  | 'entrada_manual'
  | 'ajuste_manual_entrada'
  | 'ajuste_manual_saida'
  | 'transferencia_entrada'
  | 'transferencia_saida'
  | 'consumo_orcamento'
  | 'estorno_orcamento'

export interface CustomerRecord {
  id: string
  name: string
  whatsapp: string
  email: string
  locationLabel: string
  address: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zipcode: string
  createdAt: string
  updatedAt: string
}

export interface PublicPreQuoteItem {
  type: 'Cortina' | 'Persiana'
  env: string
  material: string
  blackout: string
  width: string | number | null
  height: string | number | null
  dontKnowMeasures: boolean
}

export interface PublicPreQuoteContact {
  name: string
  whatsapp: string
  email: string
  location: string
}

export interface PreQuoteItemRecord {
  id: string
  type: 'Cortina' | 'Persiana'
  environment: string
  materialLabel: string
  blackoutLabel: string
  width: number | null
  height: number | null
  measuresPending: boolean
  notes: string
}

export interface PreQuoteRecord {
  id: string
  code: string
  customerId: string
  origin: PreQuoteOrigin
  status: PreQuoteStatus
  items: PreQuoteItemRecord[]
  measuresPendingNote: string
  pdfPath: string
  createdAt: string
  updatedAt: string
  finalQuoteId: string | null
}

export interface StoredFinalQuote {
  id: string
  code: string
  customerId: string
  preQuoteId: string | null
  seamstressId: string | null
  installerId: string | null
  status: FinalQuoteStatus
  record: AdminQuoteRecord
  createdAt: string
  updatedAt: string
}

export interface SeamstressRecord {
  id: string
  name: string
  email: string
  whatsapp: string
  notes: string
  status: SeamstressStatus
  createdAt: string
  updatedAt: string
}

export interface InstallerRecord {
  id: string
  name: string
  email: string
  whatsapp: string
  notes: string
  status: InstallerStatus
  createdAt: string
  updatedAt: string
}

export interface FabricRecord {
  id: string
  name: string
  category: string
  colorOrCollection: string
  pricePerMeter: number
  unit: 'metro'
  status: FabricStatus
  createdAt: string
  updatedAt: string
}

export interface SeamstressFabricStockRecord {
  id: string
  seamstressId: string
  fabricId: string
  balanceMeters: number
  createdAt: string
  updatedAt: string
}

export interface StockMovementRecord {
  id: string
  seamstressId: string
  fabricId: string
  quoteId: string | null
  quoteItemId: string | null
  type: StockMovementType
  quantityMeters: number
  notes: string
  createdAt: string
}

export interface QuoteFabricConsumptionRecord {
  id: string
  quoteId: string
  quoteItemId: string
  seamstressId: string
  fabricId: string
  quantityMeters: number
  createdAt: string
  updatedAt: string
}

export interface SeamstressStockBalanceView extends SeamstressFabricStockRecord {
  seamstress: Pick<SeamstressRecord, 'id' | 'name' | 'status'>
  fabric: Pick<FabricRecord, 'id' | 'name' | 'category' | 'colorOrCollection' | 'unit' | 'status'>
}

export interface StockMovementListItem extends StockMovementRecord {
  seamstress: Pick<SeamstressRecord, 'id' | 'name'>
  fabric: Pick<FabricRecord, 'id' | 'name' | 'category' | 'colorOrCollection'>
  quoteCode: string | null
}

export interface InstallerDispatchRecord {
  id: string
  quoteId: string
  installerId: string
  documentKind: 'instalador'
  channel: InstallerDispatchChannel
  recipientEmail: string
  recipientWhatsapp: string
  status: InstallerDispatchStatus
  errorMessage: string
  sentAt: string | null
  createdAt: string
}

export interface QuoteWorkspaceStore {
  customers: CustomerRecord[]
  preQuotes: PreQuoteRecord[]
  finalQuotes: StoredFinalQuote[]
  installers: InstallerRecord[]
  installerDispatches: InstallerDispatchRecord[]
}

export interface CustomerSummary extends CustomerRecord {
  preQuoteCount: number
  finalQuoteCount: number
  lastPreQuoteAt: string | null
  lastPreQuoteId: string | null
  lastPreQuoteCode: string | null
  lastFinalQuoteAt: string | null
  lastFinalQuoteId: string | null
  lastFinalQuoteCode: string | null
}

export interface PreQuoteListItem extends PreQuoteRecord {
  customer: Pick<CustomerRecord, 'id' | 'name' | 'whatsapp' | 'locationLabel'>
  itemCount: number
}

export interface FinalQuoteDetails extends StoredFinalQuote {
  customer: CustomerRecord | null
  preQuote: PreQuoteRecord | null
  seamstress: SeamstressRecord | null
  installer: InstallerRecord | null
  fabricConsumptions: QuoteFabricConsumptionRecord[]
  installerDispatches: InstallerDispatchRecord[]
}

export interface InstallerInstallationSummary {
  customerName: string
  customerPhone: string
  customerEmail: string
  addressLine: string
  installationDate: string
  totalMeters: number
  installableItemCount: number
  items: Array<{
    id: string
    room: string
    openingLabel: string
    category: string
    installationMeters: number
    quantity: number
    dimensionsLabel: string
    notes: string
  }>
}

const nowIso = () => new Date().toISOString()

export const createWorkspaceId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const createWorkspaceStore = (): QuoteWorkspaceStore => ({
  customers: [],
  preQuotes: [],
  finalQuotes: [],
  installers: [],
  installerDispatches: [],
})

const buildYearScopedCode = (prefix: string) => {
  const now = new Date()
  const year = now.getFullYear()
  const stamp = [
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('')
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}-${year}-${stamp}-${suffix}`
}

export const createPreQuoteCode = () => buildYearScopedCode('PRE')
export const createStoredFinalQuoteCode = () => buildYearScopedCode('ORC')

export const normalizeMeters = (value: number | string | null | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null
  }

  if (typeof value !== 'string') {
    return null
  }

  const parsed = Number.parseFloat(value.replace(',', '.').trim())
  return Number.isFinite(parsed) ? Math.round(parsed * 1000) / 1000 : null
}

export const normalizeBlackout = (value: string): BlackoutOption => {
  const normalized = value.trim().toLowerCase()

  if (normalized.includes('100')) {
    return '1'
  }

  if (normalized.includes('70')) {
    return '0.7'
  }

  return 'SEM'
}

const normalizeFabric = (value: string): FabricOption => {
  const normalized = value.trim().toLowerCase()

  if (normalized.includes('rúst')) {
    return 'LINHO RUSTICO'
  }

  if (normalized.includes('linho')) {
    return 'LINHO'
  }

  if (normalized.includes('voil')) {
    return 'VOIL'
  }

  return 'NÃO'
}

const normalizeBlindCategory = (value: string): ProductCategory => {
  const normalized = value.trim().toLowerCase()

  if (normalized.includes('madeira')) {
    return 'Persiana de madeira'
  }

  if (normalized.includes('double')) {
    return 'Double vision'
  }

  if (normalized.includes('romana')) {
    return 'Romana'
  }

  if (normalized.includes('rolo')) {
    return 'Persiana rolo'
  }

  return 'Outro'
}

const parseMeasure = (value: string | number | null | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.replace(',', '.').trim()

  if (!normalized) {
    return null
  }

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export const createPreQuoteItemsFromPublic = (items: PublicPreQuoteItem[]): PreQuoteItemRecord[] =>
  items.map((item) => ({
    id: createWorkspaceId('pqi'),
    type: item.type,
    environment: item.env.trim(),
    materialLabel: item.material.trim(),
    blackoutLabel: item.type === 'Cortina' ? item.blackout.trim() : 'Não se aplica',
    width: item.dontKnowMeasures ? null : parseMeasure(item.width),
    height: item.dontKnowMeasures ? null : parseMeasure(item.height),
    measuresPending: item.dontKnowMeasures,
    notes: item.dontKnowMeasures ? 'Cliente ainda não possui medidas exatas. Visita técnica pendente.' : '',
  }))

export const buildPreQuoteMeasuresNote = (items: PreQuoteItemRecord[]) => {
  const hasPendingMeasures = items.some((item) => item.measuresPending)
  return hasPendingMeasures ? 'Há itens pendentes de medição técnica.' : 'Medidas aproximadas informadas pelo cliente.'
}

export const upsertCustomerFromPublic = (
  customers: CustomerRecord[],
  contact: PublicPreQuoteContact,
) => {
  const now = nowIso()
  const normalizedPhone = normalizePhone(contact.whatsapp)
  const existingCustomer = customers.find((customer) => normalizePhone(customer.whatsapp) === normalizedPhone)

  if (existingCustomer) {
    existingCustomer.name = contact.name.trim() || existingCustomer.name
    existingCustomer.whatsapp = contact.whatsapp.trim() || existingCustomer.whatsapp
    existingCustomer.email = contact.email.trim() || existingCustomer.email
    existingCustomer.locationLabel = contact.location.trim() || existingCustomer.locationLabel
    existingCustomer.updatedAt = now
    return existingCustomer
  }

  const customer: CustomerRecord = {
    id: createWorkspaceId('cus'),
    name: contact.name.trim(),
    whatsapp: contact.whatsapp.trim(),
    email: contact.email.trim(),
    locationLabel: contact.location.trim(),
    address: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: '',
    createdAt: now,
    updatedAt: now,
  }

  customers.unshift(customer)
  return customer
}

export const syncCustomerFromFinalQuote = (
  customer: CustomerRecord,
  record: AdminQuoteRecord,
) => {
  const now = nowIso()
  customer.name = record.customer.name.trim() || customer.name
  customer.whatsapp = record.customer.phone.trim() || customer.whatsapp
  customer.email = record.customer.email.trim() || customer.email
  customer.address = record.customer.address.trim()
  customer.complement = record.customer.complement.trim()
  customer.neighborhood = record.customer.neighborhood.trim()
  customer.city = record.customer.city.trim()
  customer.state = record.customer.state.trim()
  customer.zipcode = record.customer.zipcode.trim()
  customer.updatedAt = now
  return customer
}

export const createPreQuoteRecord = (input: {
  customerId: string
  items: PreQuoteItemRecord[]
  pdfPath: string
}) => {
  const now = nowIso()
  return {
    id: createWorkspaceId('pre'),
    code: createPreQuoteCode(),
    customerId: input.customerId,
    origin: 'site' as const,
    status: 'novo' as const,
    items: input.items,
    measuresPendingNote: buildPreQuoteMeasuresNote(input.items),
    pdfPath: input.pdfPath,
    createdAt: now,
    updatedAt: now,
    finalQuoteId: null,
  }
}

export const describePreQuoteItem = (item: PreQuoteItemRecord) => {
  const pieces = [item.type.toUpperCase()]

  if (item.type === 'Persiana') {
    pieces.push(item.materialLabel.toUpperCase())
  }
  else {
    pieces.push(`TECIDO ${item.materialLabel.toUpperCase()}`)
    pieces.push(`BLACKOUT ${item.blackoutLabel.toUpperCase()}`)
  }

  if (item.measuresPending) {
    pieces.push('MEDIÇÃO PENDENTE')
  }
  else if (item.width && item.height) {
    pieces.push(`${item.width.toFixed(2)}M X ${item.height.toFixed(2)}M`)
  }

  return pieces.join(' - ')
}

export const buildPublicPreQuoteWhatsAppMessage = (contact: PublicPreQuoteContact, preQuote: PreQuoteRecord) => {
  const lines = [
    `Olá! Acabei de gerar o pré-orçamento ${preQuote.code}.`,
    `Cliente: ${contact.name}`,
    `Localização: ${contact.location}`,
    '',
    '*Itens solicitados:*',
    ...preQuote.items.map((item, index) => `${index + 1}. ${item.type} para ${item.environment} | ${item.materialLabel}${item.type === 'Cortina' ? ` | ${item.blackoutLabel}` : ''}`),
  ]

  return lines.join('\n')
}

export const mapPreQuoteItemToAdminItem = (item: PreQuoteItemRecord): QuoteLineItem => {
  const lineItem = createEmptyLineItem()

  lineItem.room = item.environment
  lineItem.openingLabel = item.environment
  lineItem.quantity = 1
  lineItem.width = item.width
  lineItem.height = item.height

  if (item.type === 'Cortina') {
    lineItem.category = 'Cortina em tecido'
    lineItem.fabric = normalizeFabric(item.materialLabel)
    lineItem.blackout = normalizeBlackout(item.blackoutLabel)
    lineItem.notes = item.measuresPending ? 'Medidas pendentes de visita técnica.' : item.notes
    return lineItem
  }

  lineItem.category = normalizeBlindCategory(item.materialLabel)
  lineItem.fabric = 'NÃO'
  lineItem.blackout = 'SEM'
  lineItem.notes = [
    `Modelo informado no pré-orçamento: ${item.materialLabel}.`,
    item.measuresPending ? 'Medidas pendentes de visita técnica.' : '',
  ].filter(Boolean).join(' ')

  return lineItem
}

export const createAdminQuoteFromPreQuote = (customer: CustomerRecord, preQuote: PreQuoteRecord): AdminQuoteRecord => {
  const record = createEmptyQuoteRecord()

  record.customer.name = customer.name
  record.customer.phone = customer.whatsapp
  record.customer.email = customer.email
  record.customer.address = customer.address
  record.customer.complement = customer.complement
  record.customer.neighborhood = customer.neighborhood
  record.customer.city = customer.city || customer.locationLabel
  record.customer.state = customer.state
  record.customer.zipcode = customer.zipcode
  record.project.code = createStoredFinalQuoteCode()
  record.project.notes = [
    `Originado do pré-orçamento ${preQuote.code}.`,
    preQuote.measuresPendingNote,
    record.project.notes,
  ].filter(Boolean).join(' ')
  record.items = preQuote.items.map(mapPreQuoteItemToAdminItem)

  return record
}

export const createFinalQuoteRecord = (input: {
  customerId: string
  preQuoteId: string | null
  seamstressId?: string | null
  installerId?: string | null
  record: AdminQuoteRecord
}) => {
  const now = nowIso()
  return {
    id: createWorkspaceId('orc'),
    code: input.record.project.code,
    customerId: input.customerId,
    preQuoteId: input.preQuoteId,
    seamstressId: input.seamstressId ?? null,
    installerId: input.installerId ?? null,
    status: 'rascunho' as const,
    record: input.record,
    createdAt: now,
    updatedAt: now,
  }
}

export const getInstallableQuoteItems = (record: AdminQuoteRecord) =>
  record.items.filter((item) => item.installationIncluded === 'SIM')

export const calculateInstallationMetersTotal = (record: AdminQuoteRecord) =>
  Math.round(
    getInstallableQuoteItems(record)
      .reduce((total, item) => total + resolveInstallationMeters(item), 0) * 1000,
  ) / 1000

export const buildInstallerInstallationSummary = (record: AdminQuoteRecord): InstallerInstallationSummary => {
  const items = getInstallableQuoteItems(record)
  const addressLine = [
    record.customer.address || 'Endereco pendente',
    record.customer.complement,
    record.customer.neighborhood,
    record.customer.city ? `${record.customer.city}${record.customer.state ? `/${record.customer.state}` : ''}` : '',
    record.customer.zipcode ? `CEP ${record.customer.zipcode}` : '',
  ].filter(Boolean).join(' | ')

  return {
    customerName: record.customer.name || 'Nao informado',
    customerPhone: record.customer.phone || '',
    customerEmail: record.customer.email || '',
    addressLine,
    installationDate: record.project.installationDate || '',
    totalMeters: calculateInstallationMetersTotal(record),
    installableItemCount: items.length,
    items: items.map((item) => ({
      id: item.id,
      room: item.room || 'Ambiente',
      openingLabel: item.openingLabel || 'Vao',
      category: item.category,
      installationMeters: resolveInstallationMeters(item),
      quantity: item.quantity,
      dimensionsLabel: formatArea(item.width, item.height),
      notes: item.notes || '',
    })),
  }
}

export const buildQuoteFabricConsumptionKey = (input: {
  quoteItemId: string
  fabricId: string
  seamstressId: string
}) => `${input.quoteItemId}::${input.fabricId}::${input.seamstressId}`

export interface RequestedQuoteFabricConsumption {
  quoteItemId: string
  seamstressId: string
  fabricId: string
  quantityMeters: number
}

export const collectRequestedQuoteFabricConsumptions = (
  record: AdminQuoteRecord,
  seamstressId: string | null | undefined,
): RequestedQuoteFabricConsumption[] => {
  if (!seamstressId) {
    return []
  }

  const entries = new Map<string, RequestedQuoteFabricConsumption>()

  record.items.forEach((item) => {
    ;(item.fabricConsumptions || []).forEach((consumption) => {
      const quantityMeters = normalizeMeters(consumption.quantityMeters)

      if (!consumption.fabricId || !quantityMeters || quantityMeters <= 0) {
        return
      }

      const key = buildQuoteFabricConsumptionKey({
        quoteItemId: item.id,
        fabricId: consumption.fabricId,
        seamstressId,
      })
      const current = entries.get(key)

      if (current) {
        current.quantityMeters = Math.round((current.quantityMeters + quantityMeters) * 1000) / 1000
        return
      }

      entries.set(key, {
        quoteItemId: item.id,
        seamstressId,
        fabricId: consumption.fabricId,
        quantityMeters,
      })
    })
  })

  return [...entries.values()]
}

export const hydrateQuoteRecordWithFabricConsumptions = (
  record: AdminQuoteRecord,
  consumptions: QuoteFabricConsumptionRecord[],
): AdminQuoteRecord => {
  const byItemId = new Map<string, QuoteItemFabricConsumption[]>()

  consumptions.forEach((consumption) => {
    const current = byItemId.get(consumption.quoteItemId) || []
    current.push({
      id: consumption.id,
      fabricId: consumption.fabricId,
      quantityMeters: consumption.quantityMeters,
    })
    byItemId.set(consumption.quoteItemId, current)
  })

  return {
    ...record,
    items: record.items.map((item) => ({
      ...item,
      fabricConsumptions: byItemId.get(item.id) || item.fabricConsumptions || [],
    })),
  }
}

export const buildCustomerSummaries = (store: QuoteWorkspaceStore): CustomerSummary[] =>
  store.customers.map((customer) => {
    const preQuotes = store.preQuotes.filter((preQuote) => preQuote.customerId === customer.id)
    const finalQuotes = store.finalQuotes.filter((finalQuote) => finalQuote.customerId === customer.id)
    const latestPreQuote = preQuotes[0]
    const latestFinalQuote = finalQuotes[0]

    return {
      ...customer,
      preQuoteCount: preQuotes.length,
      finalQuoteCount: finalQuotes.length,
      lastPreQuoteAt: latestPreQuote?.createdAt || null,
      lastPreQuoteId: latestPreQuote?.id || null,
      lastPreQuoteCode: latestPreQuote?.code || null,
      lastFinalQuoteAt: latestFinalQuote?.createdAt || null,
      lastFinalQuoteId: latestFinalQuote?.id || null,
      lastFinalQuoteCode: latestFinalQuote?.code || null,
    }
  })

export const buildPreQuoteList = (store: QuoteWorkspaceStore): PreQuoteListItem[] =>
  store.preQuotes.map((preQuote) => ({
    ...preQuote,
    customer: (() => {
      const customer = store.customers.find((entry) => entry.id === preQuote.customerId)
      return {
        id: customer?.id || preQuote.customerId,
        name: customer?.name || 'Cliente não encontrado',
        whatsapp: customer?.whatsapp || '',
        locationLabel: customer?.locationLabel || '',
      }
    })(),
    itemCount: preQuote.items.length,
  }))

export const getPreQuoteStatusLabel = (status: PreQuoteStatus) => {
  switch (status) {
    case 'novo':
      return 'Novo'
    case 'em_analise':
      return 'Em análise'
    case 'convertido':
      return 'Convertido'
  }
}

export const getFinalQuoteStatusLabel = (status: FinalQuoteStatus) => {
  switch (status) {
    case 'rascunho':
      return 'Rascunho'
    case 'pronto':
      return 'Pronto'
    case 'cancelado':
      return 'Cancelado'
  }
}

export const formatPreQuoteMeasureLabel = (item: PreQuoteItemRecord) => {
  if (item.measuresPending) {
    return 'Medição pendente'
  }

  if (!item.width || !item.height) {
    return 'Medidas não informadas'
  }

  return `${item.width.toFixed(2)}m x ${item.height.toFixed(2)}m`
}

export const buildPreQuoteBudgetDescription = (item: PreQuoteItemRecord) => {
  if (item.type === 'Persiana') {
    return `${item.type.toUpperCase()} ${item.materialLabel.toUpperCase()}`
  }

  return `TRILHO DUPLO - ${formatBlackoutLabel(normalizeBlackout(item.blackoutLabel))} - TECIDO ${normalizeFabric(item.materialLabel)} - PREGAS WAVE`
}
