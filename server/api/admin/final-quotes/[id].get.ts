import { createError } from 'h3'
import { assertAdminSession } from '../../../utils/adminAuth'
import { findFinalQuoteById } from '../../../utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const id = event.context.params?.id || ''
  const finalQuote = await findFinalQuoteById(id)

  if (!finalQuote) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Orçamento final não encontrado.',
    })
  }

  return finalQuote
})
