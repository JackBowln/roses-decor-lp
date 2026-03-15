import { createError, readBody } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { saveInstaller } from '~~/server/utils/quoteWorkspaceStore'
import type { InstallerStatus } from '~~/app/lib/quoteWorkspace'

interface SaveInstallerPayload {
  id?: string | null
  name?: string
  email?: string
  whatsapp?: string
  notes?: string
  status?: InstallerStatus
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const body = await readBody<SaveInstallerPayload>(event)

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe o nome do instalador.',
    })
  }

  if (!body.email?.trim() && !body.whatsapp?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe ao menos um contato: e-mail ou WhatsApp.',
    })
  }

  return {
    installer: await saveInstaller({
      id: body.id,
      name: body.name,
      email: body.email,
      whatsapp: body.whatsapp,
      notes: body.notes,
      status: body.status || 'ativo',
    }),
  }
})
