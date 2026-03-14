import { createError, readBody } from 'h3'
import { assertAdminSession } from '../../../utils/adminAuth'
import { saveFabricRecord } from '../../../utils/quoteWorkspaceStore'
import type { FabricStatus } from '~~/app/lib/quoteWorkspace'

interface SaveFabricPayload {
  id?: string | null
  name?: string
  category?: string
  colorOrCollection?: string
  pricePerMeter?: number | string | null
  status?: FabricStatus
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const body = await readBody<SaveFabricPayload>(event)

  if (!body.name?.trim() || !body.category?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe nome e categoria do tecido.',
    })
  }

  const parsedPricePerMeter = Number(body.pricePerMeter ?? 0)

  if (!Number.isFinite(parsedPricePerMeter) || parsedPricePerMeter < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe um valor por metro valido para o tecido.',
    })
  }

  return {
    fabric: await saveFabricRecord({
      id: body.id,
      name: body.name,
      category: body.category,
      colorOrCollection: body.colorOrCollection,
      pricePerMeter: parsedPricePerMeter,
      status: body.status || 'ativo',
    }),
  }
})
