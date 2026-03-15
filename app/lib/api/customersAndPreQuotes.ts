import { adminFetch, buildAdminQueryString } from '@/lib/api/shared'
import type { CustomerSummary, PreQuoteListItem } from '@/lib/quoteWorkspace'

export const fetchCustomers = () =>
  adminFetch<{ customers: CustomerSummary[] }>('/api/admin/customers')

export const fetchPreQuotes = (filters?: {
  customerId?: string
  search?: string
}) =>
  adminFetch<{ preQuotes: PreQuoteListItem[] }>(`/api/admin/pre-quotes${buildAdminQueryString({
    customerId: filters?.customerId,
    search: filters?.search,
  })}`)

export const convertPreQuoteToFinalQuote = (id: string) =>
  adminFetch<{ ok: true; finalQuote: { id: string } }>(`/api/admin/pre-quotes/${id}/convert`, {
    method: 'POST',
  })
