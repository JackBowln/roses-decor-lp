import { createError, readBody } from 'h3'
import { assertAdminSession } from '../../../utils/adminAuth'
import { saveFabricRecord } from '../../../utils/quoteWorkspaceStore'
import type { FabricStatus } from '~~/app/lib/quoteWorkspace'

interface SaveFabricPayload {
  id?: string | null
  name?: string
  category?: string
  colorOrCollection?: string
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

  return {
    fabric: await saveFabricRecord({
      id: body.id,
      name: body.name,
      category: body.category,
      colorOrCollection: body.colorOrCollection,
      status: body.status || 'ativo',
    }),
  }
})
