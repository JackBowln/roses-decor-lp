import { createError } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { findSaleById } from '~~/server/utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const id = event.context.params?.id || ''
  const sale = await findSaleById(id)

  if (!sale) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Venda não encontrada.',
    })
  }

  return sale
})
