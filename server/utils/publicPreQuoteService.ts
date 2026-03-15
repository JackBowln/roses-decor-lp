import { createError } from 'h3'
import { buildWhatsAppUrl } from '~~/app/lib/site'
import { validatePublicQuoteSubmission, type QuoteContact, type QuoteItem } from '~~/app/lib/publicQuoteForm'
import {
  buildPublicPreQuoteWhatsAppMessage,
  createPreQuoteItemsFromPublic,
} from '~~/app/lib/quoteWorkspace'
import { generatePreQuotePdf } from '~~/app/lib/preQuotePdf'
import {
  createPublicPreQuoteEntry,
  saveWorkspaceDocument,
  updatePreQuoteDocumentPath,
} from '~~/server/utils/quoteWorkspaceStore'

export const createPublicPreQuoteSubmission = async (input: {
  customer: QuoteContact
  items: QuoteItem[]
}) => {
  const validationMessage = validatePublicQuoteSubmission(input)

  if (validationMessage) {
    throw createError({
      statusCode: 400,
      statusMessage: validationMessage,
    })
  }

  const items = createPreQuoteItemsFromPublic(input.items)
  const { customer, preQuote } = await createPublicPreQuoteEntry({
    contact: input.customer,
    items,
    pdfPath: '',
  })

  const pdf = generatePreQuotePdf({ customer, preQuote })
  const relativePath = `pre-quotes/${preQuote.id}/${pdf.filename}`
  const pdfDocumentId = await saveWorkspaceDocument(relativePath, pdf.bytes)
  const updatedPreQuote = await updatePreQuoteDocumentPath(preQuote.id, pdfDocumentId)
  const whatsappMessage = buildPublicPreQuoteWhatsAppMessage(input.customer, updatedPreQuote)

  return {
    ok: true,
    customer,
    preQuote: updatedPreQuote,
    whatsappUrl: buildWhatsAppUrl(whatsappMessage),
  }
}
