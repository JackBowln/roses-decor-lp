import { createError, readBody } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { sendQuoteEmail } from '~~/server/utils/adminDelivery'
import { createInstallerDispatch } from '~~/server/utils/quoteWorkspaceStore'
import { buildQuoteDeliveryEmailHtml, quoteDeliverySubjects } from '~~/app/lib/documentContent'
import type { AdminQuoteRecord, QuoteDocumentKind } from '~~/app/lib/adminQuote'

interface DeliveryPayload {
  channel: 'email'
  kind: QuoteDocumentKind
  quoteId?: string | null
  installerId?: string | null
  record: AdminQuoteRecord
  recipient: {
    name?: string
    email?: string
    whatsapp?: string
  }
}

const resolveErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'statusMessage' in error && typeof error.statusMessage === 'string') {
    return error.statusMessage
  }

  return error instanceof Error ? error.message : 'Falha no envio.'
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)

  const body = await readBody<DeliveryPayload>(event)

  if (!body.record || !body.kind || !body.channel) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Payload de entrega incompleto.',
    })
  }

  if (!body.recipient?.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe um e-mail valido para envio.',
    })
  }

  if (body.kind === 'instalador' && (!body.quoteId || !body.installerId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Salve o orcamento e selecione um instalador antes de enviar a ficha.',
    })
  }

  try {
    const response = await sendQuoteEmail({
      to: [body.recipient.email],
      subject: quoteDeliverySubjects[body.kind],
      html: buildQuoteDeliveryEmailHtml(body.recipient.name),
      recipientName: body.recipient.name,
      record: body.record,
      kind: body.kind,
    })

    if (body.kind === 'instalador' && body.quoteId && body.installerId) {
      await createInstallerDispatch({
        quoteId: body.quoteId,
        installerId: body.installerId,
        documentKind: 'instalador',
        channel: 'email',
        recipientEmail: body.recipient.email,
        recipientWhatsapp: body.recipient.whatsapp || '',
        status: 'enviado',
        errorMessage: '',
        sentAt: new Date().toISOString(),
      })
    }

    return {
      ok: true,
      channel: body.channel,
      response,
    }
  }
  catch (error) {
    if (body.kind === 'instalador' && body.quoteId && body.installerId) {
      try {
        await createInstallerDispatch({
          quoteId: body.quoteId,
          installerId: body.installerId,
          documentKind: 'instalador',
          channel: 'email',
          recipientEmail: body.recipient.email,
          recipientWhatsapp: body.recipient.whatsapp || '',
          status: 'erro',
          errorMessage: resolveErrorMessage(error),
          sentAt: null,
        })
      }
      catch {}
    }

    throw error
  }
})
