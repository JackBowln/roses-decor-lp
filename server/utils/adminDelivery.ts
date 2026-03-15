import { createError } from 'h3'
import { generateQuotePdf } from '~~/app/lib/adminQuotePdf'
import type { AdminQuoteRecord, QuoteDocumentKind } from '~~/app/lib/adminQuote'
import { buildQuoteDeliveryEmailHtml, documentBranding } from '~~/app/lib/documentContent'

interface EmailDeliveryInput {
  to: string[]
  subject: string
  html?: string
  recipientName?: string
  record: AdminQuoteRecord
  kind: QuoteDocumentKind
}

export const sendQuoteEmail = async (input: EmailDeliveryInput) => {
  const config = useRuntimeConfig()

  if (!config.brevoApiKey || !config.brevoSenderEmail) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Configure BREVO_API_KEY e BREVO_SENDER_EMAIL para envio por e-mail.',
    })
  }

  const pdf = generateQuotePdf(input.record, input.kind)
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': config.brevoApiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: config.brevoSenderEmail,
        name: config.brevoSenderName || documentBranding.senderName,
      },
      to: input.to.map((email) => ({ email })),
      subject: input.subject,
      htmlContent: input.html || buildQuoteDeliveryEmailHtml(input.recipientName),
      attachment: [
        {
          name: pdf.filename,
          content: Buffer.from(pdf.bytes).toString('base64'),
        },
      ],
    }),
  })

  if (!response.ok) {
    const details = await response.text()

    throw createError({
      statusCode: 502,
      statusMessage: `Falha ao enviar e-mail: ${details}`,
    })
  }

  return response.json()
}
