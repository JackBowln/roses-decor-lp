import { createError, readBody } from 'h3'
import { generateQuotePdf } from '~~/app/lib/adminQuotePdf'
import type { AdminQuoteRecord, QuoteDocumentKind } from '~~/app/lib/adminQuote'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { saveWorkspaceDocument } from '~~/server/utils/quoteWorkspaceStore'

interface ShareDocumentPayload {
  kind?: QuoteDocumentKind
  record?: AdminQuoteRecord
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const body = await readBody<ShareDocumentPayload>(event)

  if (!body.kind || !body.record) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe o documento e o registro do orçamento para gerar o link compartilhável.',
    })
  }

  const pdf = generateQuotePdf(body.record, body.kind)
  const safeCode = (body.record.project.code || 'orcamento').replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase()
  const documentId = await saveWorkspaceDocument(
    `shared/quote-documents/${safeCode}/${Date.now()}-${pdf.filename}`,
    pdf.bytes,
  )

  return {
    ok: true,
    documentId,
    filename: pdf.filename,
    publicPath: `/api/shared/documents/${documentId}`,
  }
})
