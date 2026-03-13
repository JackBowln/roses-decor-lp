import { createError, readBody } from 'h3'
import { isValidEmail, isValidPhone } from '~~/app/lib/fieldMasks'
import { buildWhatsAppUrl } from '~~/app/lib/site'
import {
  buildPublicPreQuoteWhatsAppMessage,
  createPreQuoteItemsFromPublic,
  type PublicPreQuoteContact,
  type PublicPreQuoteItem,
} from '~~/app/lib/quoteWorkspace'
import { generatePreQuotePdf } from '~~/app/lib/preQuotePdf'
import { createPublicPreQuoteEntry, saveWorkspaceDocument, updatePreQuoteDocumentPath } from '../../utils/quoteWorkspaceStore'

interface PublicPreQuotePayload {
  customer: PublicPreQuoteContact
  items: PublicPreQuoteItem[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<PublicPreQuotePayload>(event)

  if (!body.customer?.name?.trim() || !body.customer?.whatsapp?.trim() || !body.customer?.location?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Preencha nome, WhatsApp e localização para gerar o pré-orçamento.',
    })
  }

  if (!isValidPhone(body.customer.whatsapp)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe um WhatsApp válido com DDD.',
    })
  }

  if (body.customer.email?.trim() && !isValidEmail(body.customer.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe um e-mail válido ou deixe o campo em branco.',
    })
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Inclua ao menos um item no pré-orçamento.',
    })
  }

  const items = createPreQuoteItemsFromPublic(body.items)
  const { customer, preQuote } = await createPublicPreQuoteEntry({
    contact: body.customer,
    items,
    pdfPath: '',
  })

  const pdf = generatePreQuotePdf({ customer, preQuote })
  const relativePath = `pre-quotes/${preQuote.id}/${pdf.filename}`
  const pdfPath = await saveWorkspaceDocument(relativePath, pdf.bytes)
  const updatedPreQuote = await updatePreQuoteDocumentPath(preQuote.id, pdfPath)
  const whatsappMessage = buildPublicPreQuoteWhatsAppMessage(body.customer, updatedPreQuote)

  return {
    ok: true,
    customer,
    preQuote: updatedPreQuote,
    whatsappUrl: buildWhatsAppUrl(whatsappMessage),
  }
})
