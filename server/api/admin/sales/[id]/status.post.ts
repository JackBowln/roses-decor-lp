import { createError, readBody } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { findFinalQuoteById, transitionSaleStatus } from '~~/server/utils/quoteWorkspaceStore'

interface SaleStatusPayload {
  status?: 'vendido' | 'pago'
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const quoteId = event.context.params?.id || ''
  const body = await readBody<SaleStatusPayload>(event)

  if (body.status !== 'vendido' && body.status !== 'pago') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe um status de venda válido.',
    })
  }

  const sale = await transitionSaleStatus({
    quoteId,
    status: body.status,
    changedBy: 'admin',
  })

  return {
    ok: true,
    sale,
    finalQuote: await findFinalQuoteById(quoteId),
  }
})
