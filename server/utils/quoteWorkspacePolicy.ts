import type { AdminQuoteRecord } from '~~/app/lib/adminQuote'
import type { StoredFinalQuote } from '~~/app/lib/quoteWorkspace'

interface SaveFinalQuotePolicyInput {
  seamstressId?: string | null
  installerId?: string | null
  status?: StoredFinalQuote['status']
  record: AdminQuoteRecord
}

export const requiresOperationalDatabaseForQuoteSave = (input: SaveFinalQuotePolicyInput) =>
  Boolean(
    input.seamstressId !== undefined
    || input.installerId !== undefined
    || input.status !== undefined
    || Boolean(input.record.project.installationDate)
    || input.record.items.some((item) => item.installationMeters !== null)
    || input.record.items.some((item) => Array.isArray(item.fabricConsumptions)),
  )
