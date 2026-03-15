import type { AdminQuoteRecord, QuoteDocumentKind } from '@/lib/adminQuote'
import type {
  CustomerSummary,
  FabricRecord,
  InstallerDispatchChannel,
  InstallerDispatchRecord,
  InstallerDispatchStatus,
  InstallerRecord,
  PreQuoteListItem,
  PreQuoteRecord,
  QuoteStageTransitionRecord,
  SaleListItem,
  SaleRecord,
  SalesDashboardMetrics,
  SalesDashboardRange,
  SeamstressRecord,
  SeamstressStockBalanceView,
  StockMovementListItem,
  StoredFinalQuote,
} from '@/lib/quoteWorkspace'
import type { QuoteContact, QuoteItem, QuoteSubmissionResult } from '@/lib/publicQuoteForm'

export interface LoadedFinalQuotePayload {
  id: string
  customerId: string
  preQuoteId: string | null
  seamstressId: string | null
  installerId: string | null
  status: StoredFinalQuote['status']
  record: AdminQuoteRecord
  updatedAt: string
  customer: {
    id: string
    name: string
    locationLabel: string
  } | null
  preQuote: {
    id: string
    code: string
  } | null
  seamstress: {
    id: string
    name: string
    email: string
    whatsapp: string
    status: string
  } | null
  installer: {
    id: string
    name: string
    email: string
    whatsapp: string
    status: string
  } | null
  sale: SaleRecord | null
  stageTransitions: QuoteStageTransitionRecord[]
  installerDispatches: InstallerDispatchRecord[]
}

export interface LoadedSalePayload {
  sale: SaleListItem
  quote: LoadedFinalQuotePayload
  customer: LoadedFinalQuotePayload['customer']
  preQuote: LoadedFinalQuotePayload['preQuote']
  seamstress: LoadedFinalQuotePayload['seamstress']
  installer: LoadedFinalQuotePayload['installer']
  stageTransitions: QuoteStageTransitionRecord[]
}

interface SaveFinalQuotePayload {
  id?: string | null
  customerId?: string | null
  preQuoteId?: string | null
  seamstressId?: string | null
  installerId?: string | null
  status?: StoredFinalQuote['status']
  record: AdminQuoteRecord
}

interface DeliveryRecipientInput {
  name?: string
  email?: string
  whatsapp?: string
}

const buildQueryString = (params: Record<string, string | null | undefined>) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      searchParams.set(key, value)
    }
  })

  const serialized = searchParams.toString()
  return serialized ? `?${serialized}` : ''
}

const adminFetch = <T>(url: string, options?: Parameters<typeof $fetch<T>>[1]) =>
  $fetch<T>(url, {
    credentials: 'include',
    ...options,
  })

export const createPublicPreQuote = (input: {
  customer: QuoteContact
  items: QuoteItem[]
}) =>
  $fetch<QuoteSubmissionResult>('/api/public/pre-quotes', {
    method: 'POST',
    body: input,
  })

export const fetchCustomers = () =>
  adminFetch<{ customers: CustomerSummary[] }>('/api/admin/customers')

export const fetchPreQuotes = (filters?: {
  customerId?: string
  search?: string
}) =>
  adminFetch<{ preQuotes: PreQuoteListItem[] }>(`/api/admin/pre-quotes${buildQueryString({
    customerId: filters?.customerId,
    search: filters?.search,
  })}`)

export const convertPreQuoteToFinalQuote = (id: string) =>
  adminFetch<{ ok: true; finalQuote: { id: string } }>(`/api/admin/pre-quotes/${id}/convert`, {
    method: 'POST',
  })

export const fetchFinalQuote = (id: string) =>
  adminFetch<LoadedFinalQuotePayload>(`/api/admin/final-quotes/${id}`)

export const fetchSales = (filters?: {
  customerId?: string
  search?: string
  status?: SaleRecord['status'] | 'all'
  dateFrom?: string
  dateTo?: string
  paymentMethod?: string
  seamstressId?: string
  installerId?: string
  productType?: SaleListItem['productTypes'][number]
  sortBy?: 'customer' | 'date' | 'value' | 'status'
}) =>
  adminFetch<{ sales: SaleListItem[] }>(`/api/admin/sales${buildQueryString({
    customerId: filters?.customerId,
    search: filters?.search,
    status: filters?.status,
    dateFrom: filters?.dateFrom,
    dateTo: filters?.dateTo,
    paymentMethod: filters?.paymentMethod,
    seamstressId: filters?.seamstressId,
    installerId: filters?.installerId,
    productType: filters?.productType,
    sortBy: filters?.sortBy,
  })}`)

export const fetchSale = (id: string) =>
  adminFetch<LoadedSalePayload>(`/api/admin/sales/${id}`)

export const transitionSale = (quoteId: string, status: SaleRecord['status']) =>
  adminFetch<{ ok: true; sale: SaleRecord; finalQuote: LoadedFinalQuotePayload | null }>(`/api/admin/sales/${quoteId}/status`, {
    method: 'POST',
    body: { status },
  })

export const fetchSalesDashboardMetrics = (filters: {
  range: SalesDashboardRange
  customerId?: string
  search?: string
  status?: SaleRecord['status'] | 'all'
  dateFrom?: string
  dateTo?: string
  paymentMethod?: string
  seamstressId?: string
  installerId?: string
  productType?: SaleListItem['productTypes'][number]
}) =>
  adminFetch<{ metrics: SalesDashboardMetrics }>(`/api/admin/sales/dashboard${buildQueryString({
    range: filters.range,
    customerId: filters.customerId,
    search: filters.search,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    paymentMethod: filters.paymentMethod,
    seamstressId: filters.seamstressId,
    installerId: filters.installerId,
    productType: filters.productType,
  })}`)

export const saveFinalQuote = (payload: SaveFinalQuotePayload) =>
  adminFetch<{ ok: true; finalQuote: LoadedFinalQuotePayload }>('/api/admin/final-quotes/save', {
    method: 'POST',
    body: payload,
  })

export const fetchSeamstresses = (status: SeamstressRecord['status'] | 'all' = 'all') =>
  adminFetch<{ seamstresses: SeamstressRecord[] }>(`/api/admin/seamstresses${buildQueryString({ status })}`)

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
  adminFetch<{ installers: InstallerRecord[] }>(`/api/admin/installers${buildQueryString({ status })}`)

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
  adminFetch<{ fabrics: FabricRecord[] }>(`/api/admin/fabrics${buildQueryString({ status })}`)

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
  adminFetch<{ balances: SeamstressStockBalanceView[] }>(`/api/admin/stocks${buildQueryString({
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
  adminFetch<{ movements: StockMovementListItem[] }>(`/api/admin/stock-movements${buildQueryString({
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
  adminFetch<{ dispatches: InstallerDispatchRecord[] }>(`/api/admin/installers/dispatches${buildQueryString({
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
