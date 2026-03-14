import { createError, readBody } from 'h3'
import { assertAdminSession } from '../../../../utils/adminAuth'
import { createInstallerDispatch } from '../../../../utils/quoteWorkspaceStore'
import type { InstallerDispatchChannel, InstallerDispatchStatus } from '~~/app/lib/quoteWorkspace'

interface InstallerDispatchLogPayload {
  quoteId?: string
  installerId?: string
  channel?: InstallerDispatchChannel
  status?: InstallerDispatchStatus
  errorMessage?: string
  recipientEmail?: string
  recipientWhatsapp?: string
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const body = await readBody<InstallerDispatchLogPayload>(event)

  if (!body.quoteId || !body.installerId || !body.channel || !body.status) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dados do log de envio do instalador estão incompletos.',
    })
  }

  return {
    dispatch: await createInstallerDispatch({
      quoteId: body.quoteId,
      installerId: body.installerId,
      documentKind: 'instalador',
      channel: body.channel,
      recipientEmail: body.recipientEmail || '',
      recipientWhatsapp: body.recipientWhatsapp || '',
      status: body.status,
      errorMessage: body.errorMessage || '',
      sentAt: body.status === 'enviado' ? new Date().toISOString() : null,
    }),
  }
})
