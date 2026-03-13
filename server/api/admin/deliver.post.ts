import { createError, readBody } from 'h3'
import { assertAdminSession } from '../../utils/adminAuth'
import { sendQuoteEmail } from '../../utils/adminDelivery'
import type { AdminQuoteRecord, QuoteDocumentKind } from '~~/app/lib/adminQuote'

interface DeliveryPayload {
  channel: 'email'
  kind: QuoteDocumentKind
  record: AdminQuoteRecord
  recipient: {
    name?: string
    email?: string
    whatsapp?: string
  }
}

const subjects: Record<QuoteDocumentKind, string> = {
  cliente: 'Seu orçamento Roses Decor',
  costureira: 'Pedido de costura Roses Decor',
  instalador: 'Pedido de instalação Roses Decor',
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
      statusMessage: 'Informe um e-mail válido para envio.',
    })
  }

  const response = await sendQuoteEmail({
    to: [body.recipient.email],
    subject: subjects[body.kind],
    html: `<p>Olá ${body.recipient.name || ''},</p><p>Segue em anexo o documento em PDF.</p><p>Atenciosamente,<br>Roses Decor</p>`,
    record: body.record,
    kind: body.kind,
  })

  return {
    ok: true,
    channel: body.channel,
    response,
  }
})
