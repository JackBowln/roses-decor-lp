import { createError, readBody } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { transferStockBetweenSeamstresses } from '~~/server/utils/quoteWorkspaceStore'

interface TransferStockPayload {
  fromSeamstressId?: string
  toSeamstressId?: string
  fabricId?: string
  quantityMeters?: number
  notes?: string
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const body = await readBody<TransferStockPayload>(event)

  if (!body.fromSeamstressId || !body.toSeamstressId || !body.fabricId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe origem, destino e tecido para a transferência.',
    })
  }

  return {
    transfer: await transferStockBetweenSeamstresses({
      fromSeamstressId: body.fromSeamstressId,
      toSeamstressId: body.toSeamstressId,
      fabricId: body.fabricId,
      quantityMeters: Number(body.quantityMeters || 0),
      notes: body.notes,
    }),
  }
})
