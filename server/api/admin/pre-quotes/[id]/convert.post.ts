import { createError } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { convertPreQuoteToFinalQuote } from '~~/server/utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const id = event.context.params?.id || ''

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pré-orçamento inválido.',
    })
  }

  const finalQuote = await convertPreQuoteToFinalQuote(id)

  return {
    ok: true,
    finalQuote,
  }
})
