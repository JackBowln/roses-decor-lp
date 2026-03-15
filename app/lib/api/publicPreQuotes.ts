import type { QuoteContact, QuoteItem, QuoteSubmissionResult } from '@/lib/publicQuoteForm'

export const createPublicPreQuote = (input: {
  customer: QuoteContact
  items: QuoteItem[]
}) =>
  $fetch<QuoteSubmissionResult>('/api/public/pre-quotes', {
    method: 'POST',
    body: input,
  })
