import { readBody } from 'h3'
import type { QuoteContact, QuoteItem } from '~~/app/lib/publicQuoteForm'
import { createPublicPreQuoteSubmission } from '~~/server/utils/publicPreQuoteService'

interface PublicPreQuotePayload {
  customer: QuoteContact
  items: QuoteItem[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<PublicPreQuotePayload>(event)

  return createPublicPreQuoteSubmission(body)
})
