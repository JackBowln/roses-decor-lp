import { adminFetch, buildAdminQueryString } from '@/lib/api/shared'
import type { LoadedFinalQuotePayload, LoadedSalePayload } from '@/lib/api/types'
import type { SaleListItem, SaleRecord, SalesDashboardMetrics, SalesDashboardRange } from '@/lib/quoteWorkspace'

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
  adminFetch<{ sales: SaleListItem[] }>(`/api/admin/sales${buildAdminQueryString({
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
  adminFetch<{ metrics: SalesDashboardMetrics }>(`/api/admin/sales/dashboard${buildAdminQueryString({
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
