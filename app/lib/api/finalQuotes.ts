import { adminFetch } from '@/lib/api/shared'
import type { AdminQuoteRecord } from '@/lib/adminQuote'
import type { StoredFinalQuote } from '@/lib/quoteWorkspace'
import type { LoadedFinalQuotePayload } from '@/lib/api/types'

interface SaveFinalQuotePayload {
  id?: string | null
  customerId?: string | null
  preQuoteId?: string | null
  seamstressId?: string | null
  installerId?: string | null
  status?: StoredFinalQuote['status']
  record: AdminQuoteRecord
}

export const fetchFinalQuote = (id: string) =>
  adminFetch<LoadedFinalQuotePayload>(`/api/admin/final-quotes/${id}`)

export const saveFinalQuote = (payload: SaveFinalQuotePayload) =>
  adminFetch<{ ok: true; finalQuote: LoadedFinalQuotePayload }>('/api/admin/final-quotes/save', {
    method: 'POST',
    body: payload,
  })
