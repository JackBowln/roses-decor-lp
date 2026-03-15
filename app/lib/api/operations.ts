import { adminFetch, buildAdminQueryString } from '@/lib/api/shared'
import type { AdminQuoteRecord, QuoteDocumentKind } from '@/lib/adminQuote'
import type {
  FabricRecord,
  InstallerDispatchChannel,
  InstallerDispatchRecord,
  InstallerDispatchStatus,
  InstallerRecord,
  SeamstressRecord,
  SeamstressStockBalanceView,
  StockMovementListItem,
} from '@/lib/quoteWorkspace'

interface DeliveryRecipientInput {
  name?: string
  email?: string
  whatsapp?: string
}

export const fetchSeamstresses = (status: SeamstressRecord['status'] | 'all' = 'all') =>
  adminFetch<{ seamstresses: SeamstressRecord[] }>(`/api/admin/seamstresses${buildAdminQueryString({ status })}`)

export const saveSeamstress = (payload: {
  id?: string | null
  name: string
  email?: string
  whatsapp?: string
  notes?: string
  status: SeamstressRecord['status']
}) =>
  adminFetch<{ seamstress: SeamstressRecord }>('/api/admin/seamstresses/save', {
    method: 'POST',
    body: payload,
  })

export const fetchInstallers = (status: InstallerRecord['status'] | 'all' = 'all') =>
  adminFetch<{ installers: InstallerRecord[] }>(`/api/admin/installers${buildAdminQueryString({ status })}`)

export const saveInstaller = (payload: {
  id?: string | null
  name: string
  email?: string
  whatsapp?: string
  notes?: string
  status: InstallerRecord['status']
}) =>
  adminFetch<{ installer: InstallerRecord }>('/api/admin/installers/save', {
    method: 'POST',
    body: payload,
  })

export const fetchFabrics = (status: FabricRecord['status'] | 'all' = 'all') =>
  adminFetch<{ fabrics: FabricRecord[] }>(`/api/admin/fabrics${buildAdminQueryString({ status })}`)

export const saveFabric = (payload: {
  id?: string | null
  name: string
  category?: string
  colorOrCollection?: string
  pricePerMeter?: number | null
  status: FabricRecord['status']
}) =>
  adminFetch<{ fabric: FabricRecord }>('/api/admin/fabrics/save', {
    method: 'POST',
    body: payload,
  })

export const fetchStockBalances = (filters?: {
  seamstressId?: string
  fabricId?: string
  search?: string
}) =>
  adminFetch<{ balances: SeamstressStockBalanceView[] }>(`/api/admin/stocks${buildAdminQueryString({
    seamstressId: filters?.seamstressId,
    fabricId: filters?.fabricId,
    search: filters?.search,
  })}`)

export const fetchStockMovements = (filters?: {
  seamstressId?: string
  fabricId?: string
  quoteId?: string
  dateFrom?: string
  dateTo?: string
}) =>
  adminFetch<{ movements: StockMovementListItem[] }>(`/api/admin/stock-movements${buildAdminQueryString({
    seamstressId: filters?.seamstressId,
    fabricId: filters?.fabricId,
    quoteId: filters?.quoteId,
    dateFrom: filters?.dateFrom,
    dateTo: filters?.dateTo,
  })}`)

export const createManualStockMovement = (payload: {
  seamstressId: string
  fabricId: string
  quantityMeters: number | null
  mode: 'entrada_manual' | 'ajuste_manual'
  notes?: string
  allowNegative?: boolean
}) =>
  adminFetch('/api/admin/stocks/manual', {
    method: 'POST',
    body: payload,
  })

export const createStockTransfer = (payload: {
  fromSeamstressId: string
  toSeamstressId: string
  fabricId: string
  quantityMeters: number | null
  notes?: string
}) =>
  adminFetch('/api/admin/stocks/transfer', {
    method: 'POST',
    body: payload,
  })

export const fetchInstallerDispatches = (filters?: {
  installerId?: string
  quoteId?: string
  channel?: InstallerDispatchChannel
  dateFrom?: string
  dateTo?: string
}) =>
  adminFetch<{ dispatches: InstallerDispatchRecord[] }>(`/api/admin/installers/dispatches${buildAdminQueryString({
    installerId: filters?.installerId,
    quoteId: filters?.quoteId,
    channel: filters?.channel,
    dateFrom: filters?.dateFrom,
    dateTo: filters?.dateTo,
  })}`)

export const createInstallerDispatchLog = (payload: {
  quoteId: string
  installerId: string
  channel: InstallerDispatchChannel
  status: InstallerDispatchStatus
  errorMessage?: string
  recipientEmail?: string
  recipientWhatsapp?: string
}) =>
  adminFetch<{ dispatch: InstallerDispatchRecord }>('/api/admin/installers/dispatches/log', {
    method: 'POST',
    body: payload,
  })

export const createSharedQuoteDocument = (payload: {
  kind: QuoteDocumentKind
  record: AdminQuoteRecord
}) =>
  adminFetch<{ ok: true; documentId: string; filename: string; publicPath: string }>('/api/admin/share-document', {
    method: 'POST',
    body: payload,
  })

export const deliverQuoteDocument = (payload: {
  channel: 'email'
  kind: QuoteDocumentKind
  quoteId?: string | null
  installerId?: string | null
  record: AdminQuoteRecord
  recipient: DeliveryRecipientInput
}) =>
  adminFetch<{ ok: true; channel: 'email'; response: unknown }>('/api/admin/deliver', {
    method: 'POST',
    body: payload,
  })
