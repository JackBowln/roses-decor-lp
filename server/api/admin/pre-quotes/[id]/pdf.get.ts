import { createError, setHeader } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { findPreQuoteById, readWorkspaceDocument } from '~~/server/utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const id = event.context.params?.id || ''
  const { preQuote } = await findPreQuoteById(id)

  if (!preQuote || !preQuote.pdfPath) {
    throw createError({
      statusCode: 404,
      statusMessage: 'PDF do pré-orçamento não encontrado.',
    })
  }

  const document = await readWorkspaceDocument(preQuote.pdfPath)

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Arquivo do pré-orçamento não encontrado.',
    })
  }

  setHeader(event, 'Content-Type', document.mimeType)
  setHeader(event, 'Content-Disposition', `inline; filename="${document.filename}"`)
  return document.bytes
})
