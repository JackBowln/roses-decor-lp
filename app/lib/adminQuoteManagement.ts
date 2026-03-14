import { formatCurrency, type AdminQuoteRecord, type QuoteTotals } from '@/lib/adminQuote'
import { normalizeMeters, type FabricRecord, type InstallerRecord, type SeamstressRecord, type SeamstressStockBalanceView, type StoredFinalQuote } from '@/lib/quoteWorkspace'

export const QUOTE_DRAFT_META_STORAGE_KEY = 'roses-decor-admin-quote-meta'

export interface QuoteDraftMeta {
  selectedSeamstressId: string | null
  selectedInstallerId: string | null
  quoteStatus: StoredFinalQuote['status']
}

interface ContactDirectoryRecord {
  id: string
  name: string
  email: string
  whatsapp: string
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

export const syncAutomaticMaterialPricing = (
  record: AdminQuoteRecord,
  fabricPriceById: Record<string, number>,
) => {
  record.items.forEach((item) => {
    const quantity = Math.max(item.quantity || 1, 1)
    let materialTotal = 0
    let hasPricedConsumptions = false

    for (const consumption of item.fabricConsumptions || []) {
      const quantityMeters = normalizeMeters(consumption.quantityMeters)
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

export const filterActiveSeamstresses = (records: SeamstressRecord[], currentId: string | null) =>
  filterActiveRecordsWithCurrentId(records, currentId, (record) => record.status === 'ativa')

export const filterActiveInstallers = (records: InstallerRecord[], currentId: string | null) =>
  filterActiveRecordsWithCurrentId(records, currentId, (record) => record.status === 'ativo')

export const filterActiveFabrics = (
  fabrics: FabricRecord[],
  linkedFabricIds: Set<string>,
) =>
  fabrics.filter((fabric) => fabric.status === 'ativo' || linkedFabricIds.has(fabric.id))
