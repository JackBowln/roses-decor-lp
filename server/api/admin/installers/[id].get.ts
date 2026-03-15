import { createError } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { findInstallerById } from '~~/server/utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const id = event.context.params?.id || ''
  const installer = await findInstallerById(id)

  if (!installer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Instalador não encontrado.',
    })
  }

  return {
    installer,
  }
})
