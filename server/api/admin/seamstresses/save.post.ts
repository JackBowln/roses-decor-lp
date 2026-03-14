import { createError, readBody } from 'h3'
import { assertAdminSession } from '../../../utils/adminAuth'
import { saveSeamstressRecord } from '../../../utils/quoteWorkspaceStore'
import type { SeamstressStatus } from '~~/app/lib/quoteWorkspace'

interface SaveSeamstressPayload {
  id?: string | null
  name?: string
  email?: string
  whatsapp?: string
  notes?: string
  status?: SeamstressStatus
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const body = await readBody<SaveSeamstressPayload>(event)

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe o nome da costureira.',
    })
  }

  return {
    seamstress: await saveSeamstressRecord({
      id: body.id,
      name: body.name,
      email: body.email,
      whatsapp: body.whatsapp,
      notes: body.notes,
      status: body.status || 'ativa',
    }),
  }
})
