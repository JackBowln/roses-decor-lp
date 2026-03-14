import { createError, getQuery, setHeader } from 'h3'
import { readWorkspaceDocument } from '../../../utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id || ''
  const query = getQuery(event)
  const document = await readWorkspaceDocument(id)

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Arquivo compartilhado não encontrado.',
    })
  }

  const disposition = query.download === '1' ? 'attachment' : 'inline'

  setHeader(event, 'Content-Type', document.mimeType)
  setHeader(event, 'Content-Disposition', `${disposition}; filename="${document.filename}"`)
  setHeader(event, 'Cache-Control', 'private, max-age=300')

  return document.bytes
})
