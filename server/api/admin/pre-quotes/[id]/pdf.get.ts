import { basename } from 'node:path'
import { createError, setHeader } from 'h3'
import { assertAdminSession } from '../../../../utils/adminAuth'
import { findPreQuoteById, readWorkspaceDocument } from '../../../../utils/quoteWorkspaceStore'

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

  const bytes = await readWorkspaceDocument(preQuote.pdfPath)
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `inline; filename="${basename(preQuote.pdfPath)}"`)
  return bytes
})
