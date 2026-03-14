import { createError, readBody } from 'h3'
import { assertAdminSession } from '../../../utils/adminAuth'
import { findFinalQuoteById, saveFinalQuoteRecord } from '../../../utils/quoteWorkspaceStore'
import type { AdminQuoteRecord } from '~~/app/lib/adminQuote'

interface SaveFinalQuotePayload {
  id?: string | null
  customerId?: string | null
  preQuoteId?: string | null
  seamstressId?: string | null
  installerId?: string | null
  status?: 'rascunho' | 'pronto' | 'cancelado'
  record?: AdminQuoteRecord
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const body = await readBody<SaveFinalQuotePayload>(event)

  if (!body.record) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Registro de orçamento final não informado.',
    })
  }

  const saved = await saveFinalQuoteRecord({
    id: body.id,
    customerId: body.customerId,
    preQuoteId: body.preQuoteId,
    seamstressId: body.seamstressId,
    installerId: body.installerId,
    status: body.status,
    record: body.record,
  })
  const finalQuote = await findFinalQuoteById(saved.id)

  if (!finalQuote) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Orçamento salvo, mas não foi possível recarregar o vínculo.',
    })
  }

  return {
    ok: true,
    finalQuote,
  }
})
