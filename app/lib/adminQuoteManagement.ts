import { formatCurrency, type AdminQuoteRecord, type QuoteItemFabricConsumption, type QuoteLineItem, type QuoteTabId, type QuoteTotals } from '@/lib/adminQuote'
import { uiFallbacks } from '@/lib/appFallbacks'
import { normalizeMeters, resolveQuoteLifecycleTag, type FabricRecord, type InstallerRecord, type SaleRecord, type SeamstressRecord, type SeamstressStockBalanceView, type StoredFinalQuote } from '@/lib/quoteWorkspace'

export const QUOTE_DRAFT_META_STORAGE_KEY = 'roses-decor-admin-quote-meta'

export interface QuoteDraftMeta {
  selectedSeamstressId: string | null
  selectedInstallerId: string | null
  quoteStatus: StoredFinalQuote['status']
  activeTab: QuoteTabId
}

interface ContactDirectoryRecord {
  id: string
  name: string
  email: string
  whatsapp: string
}

export interface QuoteBusinessSummaryItem {
  label: string
  value: string
}

export interface QuoteBusinessSummarySection {
  title: string
  items: QuoteBusinessSummaryItem[]
}

export const readQuoteDraftMeta = (): QuoteDraftMeta | null => {
  if (!import.meta.client) {
    return null
  }

  const raw = localStorage.getItem(QUOTE_DRAFT_META_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<QuoteDraftMeta>

    return {
      selectedSeamstressId: typeof parsed.selectedSeamstressId === 'string' ? parsed.selectedSeamstressId : null,
      selectedInstallerId: typeof parsed.selectedInstallerId === 'string' ? parsed.selectedInstallerId : null,
      quoteStatus: parsed.quoteStatus === 'pronto' || parsed.quoteStatus === 'cancelado'
        ? parsed.quoteStatus
        : 'rascunho',
      activeTab: parsed.activeTab === 'resumo'
        || parsed.activeTab === 'projeto'
        || parsed.activeTab === 'itens'
        || parsed.activeTab === 'costureira'
        || parsed.activeTab === 'instalador'
        || parsed.activeTab === 'envio'
        ? parsed.activeTab
        : 'cliente',
    }
  }
  catch {
    localStorage.removeItem(QUOTE_DRAFT_META_STORAGE_KEY)
    return null
  }
}

export const writeQuoteDraftMeta = (value: QuoteDraftMeta) => {
  if (!import.meta.client) {
    return
  }

  localStorage.setItem(QUOTE_DRAFT_META_STORAGE_KEY, JSON.stringify(value))
}

export const clearQuoteDraftMeta = () => {
  if (!import.meta.client) {
    return
  }

  localStorage.removeItem(QUOTE_DRAFT_META_STORAGE_KEY)
}

export const filterActiveRecordsWithCurrentId = <T extends { id: string }>(
  records: T[],
  currentId: string | null,
  isActive: (record: T) => boolean,
) =>
  records.filter((record) => isActive(record) || record.id === currentId)

export const collectLinkedFabricIds = (record: AdminQuoteRecord) =>
  new Set(
    record.items.flatMap((item) =>
      (item.fabricConsumptions || [])
        .map((consumption) => consumption.fabricId)
        .filter(Boolean),
    ),
  )

export const createFabricPriceMap = (fabrics: FabricRecord[]) =>
  fabrics.reduce<Record<string, number>>((accumulator, fabric) => {
    accumulator[fabric.id] = fabric.pricePerMeter
    return accumulator
  }, {})

export const createStockBalanceMap = (balances: SeamstressStockBalanceView[]) =>
  balances.reduce<Record<string, number>>((accumulator, balance) => {
    accumulator[balance.fabricId] = balance.balanceMeters
    return accumulator
  }, {})

export const resolveFabricConsumptionMeters = (
  item: Pick<QuoteLineItem, 'width' | 'quantity'>,
  consumption: Pick<QuoteItemFabricConsumption, 'fabricId' | 'quantityMeters'>,
) => {
  const explicitMeters = normalizeMeters(consumption.quantityMeters)

  if (explicitMeters && explicitMeters > 0) {
    return explicitMeters
  }

  if (!consumption.fabricId) {
    return null
  }

  const estimatedWidth = normalizeMeters(item.width)

  if (!estimatedWidth || estimatedWidth <= 0) {
    return null
  }

  const quantity = Math.max(item.quantity || 1, 1)
  return Math.round(estimatedWidth * quantity * 1000) / 1000
}

export const syncAutomaticMaterialPricing = (
  record: AdminQuoteRecord,
  fabricPriceById: Record<string, number>,
) => {
  record.items.forEach((item) => {
    const quantity = Math.max(item.quantity || 1, 1)
    let materialTotal = 0
    let hasPricedConsumptions = false

    for (const consumption of item.fabricConsumptions || []) {
      const quantityMeters = resolveFabricConsumptionMeters(item, consumption)
      const pricePerMeter = consumption.fabricId ? fabricPriceById[consumption.fabricId] : undefined

      if (typeof pricePerMeter !== 'number' || pricePerMeter <= 0 || !quantityMeters || quantityMeters <= 0) {
        continue
      }

      hasPricedConsumptions = true
      materialTotal += quantityMeters * pricePerMeter
    }

    if (hasPricedConsumptions) {
      item.unitPrice = Math.round((materialTotal / quantity) * 100) / 100
    }
  })
}

export const applyDirectoryContactSnapshot = (
  selectedId: string | null,
  records: ContactDirectoryRecord[],
  target: AdminQuoteRecord['seamstress'] | AdminQuoteRecord['installer'],
) => {
  if (!selectedId) {
    target.name = ''
    target.email = ''
    target.whatsapp = ''
    return
  }

  const selectedRecord = records.find((record) => record.id === selectedId) || null

  if (!selectedRecord) {
    return
  }

  target.name = selectedRecord.name
  target.email = selectedRecord.email
  target.whatsapp = selectedRecord.whatsapp
}

export const hasQuoteFabricConsumptions = (record: AdminQuoteRecord) =>
  record.items.some((item) =>
    (item.fabricConsumptions || []).some((consumption) =>
      Boolean(consumption.fabricId) || Boolean(consumption.quantityMeters)))

export const buildQuoteSummaryStats = (input: {
  record: AdminQuoteRecord
  totals: QuoteTotals
  lastSavedAt: string
}) => [
  {
    label: 'Itens no orçamento',
    value: String(input.record.items.length).padStart(2, '0'),
  },
  {
    label: 'Total estimado',
    value: formatCurrency(input.totals.grandTotal),
  },
  {
    label: 'Validade',
    value: input.record.project.validUntil || 'Sem data',
  },
  {
    label: 'Último salvamento',
    value: input.lastSavedAt ? new Date(input.lastSavedAt).toLocaleString('pt-BR') : 'Não salvo',
  },
]

const buildCompactAddressSummary = (record: AdminQuoteRecord) =>
  [
    record.customer.address,
    record.customer.complement,
    record.customer.neighborhood,
    record.customer.city ? `${record.customer.city}${record.customer.state ? `/${record.customer.state}` : ''}` : '',
    record.customer.zipcode ? `CEP ${record.customer.zipcode}` : '',
  ].filter(Boolean).join(' • ') || uiFallbacks.pendingAddress

const formatStakeholderSummary = (
  name: string,
  email: string,
  whatsapp: string,
  hasResponsible: boolean,
) => {
  if (!hasResponsible) {
    return {
      name: 'Não definido',
      contact: 'Sem responsável vinculado',
    }
  }

  return {
    name: name || 'Responsável sem nome',
    contact: email || whatsapp || uiFallbacks.pendingContact,
  }
}

export const buildQuoteBusinessSummary = (input: {
  record: AdminQuoteRecord
  quoteStatus: StoredFinalQuote['status']
  saleStatus?: SaleRecord['status'] | null
  linkedPreQuoteCode: string
  linkedCustomerLocation: string
  totals: QuoteTotals
  installableItemCount: number
  installationTotalMeters: number
  hasSeamstressResponsible: boolean
  hasInstallerResponsible: boolean
}) => {
  const seamstress = formatStakeholderSummary(
    input.record.seamstress.name,
    input.record.seamstress.email,
    input.record.seamstress.whatsapp,
    input.hasSeamstressResponsible,
  )
  const installer = formatStakeholderSummary(
    input.record.installer.name,
    input.record.installer.email,
    input.record.installer.whatsapp,
    input.hasInstallerResponsible,
  )

  return [
    {
      title: 'Cliente',
      items: [
        { label: 'Nome', value: input.record.customer.name || 'Cliente não informado' },
        { label: 'Contato principal', value: input.record.customer.phone || input.record.customer.email || uiFallbacks.pendingContact },
        { label: 'Endereço resumido', value: buildCompactAddressSummary(input.record) },
        { label: 'Origem comercial', value: input.linkedPreQuoteCode || input.linkedCustomerLocation || 'Cadastro direto no orçamento' },
      ],
    },
    {
      title: 'Pedido',
      items: [
        { label: 'Código', value: input.record.project.code || 'Sem código' },
        { label: 'Status', value: resolveQuoteLifecycleTag({ quoteStatus: input.quoteStatus, saleStatus: input.saleStatus || null }) },
        { label: 'Emissão', value: input.record.project.createdAt || uiFallbacks.pending },
        { label: 'Validade', value: input.record.project.validUntil || uiFallbacks.pending },
        { label: 'Prazo', value: input.record.project.deliveryLeadTime || uiFallbacks.pending },
        { label: 'Instalação / entrega', value: input.record.project.installationDate || uiFallbacks.pending },
        { label: 'Itens', value: String(input.record.items.length) },
        { label: 'Total estimado', value: formatCurrency(input.totals.grandTotal) },
      ],
    },
    {
      title: 'Costureira',
      items: [
        { label: 'Responsável', value: seamstress.name },
        { label: 'Contato', value: seamstress.contact },
        { label: 'Observação', value: input.record.seamstress.notes || 'Sem observações para costura' },
      ],
    },
    {
      title: 'Instalador',
      items: [
        { label: 'Responsável', value: installer.name },
        { label: 'Contato', value: installer.contact },
        { label: 'Itens instaláveis', value: String(input.installableItemCount) },
        { label: 'Metros de instalação', value: `${input.installationTotalMeters.toFixed(2)} m` },
      ],
    },
  ] satisfies QuoteBusinessSummarySection[]
}

export const filterActiveSeamstresses = (records: SeamstressRecord[], currentId: string | null) =>
  filterActiveRecordsWithCurrentId(records, currentId, (record) => record.status === 'ativa')

export const filterActiveInstallers = (records: InstallerRecord[], currentId: string | null) =>
  filterActiveRecordsWithCurrentId(records, currentId, (record) => record.status === 'ativo')

export const filterActiveFabrics = (
  fabrics: FabricRecord[],
  linkedFabricIds: Set<string>,
) =>
  fabrics.filter((fabric) => fabric.status === 'ativo' || linkedFabricIds.has(fabric.id))
