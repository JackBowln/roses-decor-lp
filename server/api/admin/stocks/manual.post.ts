import { createError, readBody } from 'h3'
import { assertAdminSession } from '../../../utils/adminAuth'
import { applyManualStockMovement } from '../../../utils/quoteWorkspaceStore'

interface ManualStockPayload {
  seamstressId?: string
  fabricId?: string
  quantityMeters?: number
  mode?: 'entrada_manual' | 'ajuste_manual'
  notes?: string
  allowNegative?: boolean
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const body = await readBody<ManualStockPayload>(event)

  if (!body.seamstressId || !body.fabricId || !body.mode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe costureira, tecido e tipo da movimentação manual.',
    })
  }

  return {
    stock: await applyManualStockMovement({
      seamstressId: body.seamstressId,
      fabricId: body.fabricId,
      quantityMeters: Number(body.quantityMeters || 0),
      mode: body.mode,
      notes: body.notes,
      allowNegative: Boolean(body.allowNegative),
    }),
  }
})
