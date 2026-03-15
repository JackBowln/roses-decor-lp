import type { AdminQuoteRecord } from '@/lib/adminQuote'
import type {
  InstallerDispatchRecord,
  QuoteStageTransitionRecord,
  SaleListItem,
  SaleRecord,
  StoredFinalQuote,
} from '@/lib/quoteWorkspace'

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
