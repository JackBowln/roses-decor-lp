export type QuoteDocumentKey = 'cliente' | 'costureira' | 'instalador'

import { brandConfig, contactConfig } from '@/lib/appBrand'

export const quoteDocumentTitles: Record<QuoteDocumentKey, string> = {
  cliente: 'PEDIDO APROVADO',
  costureira: 'PEDIDO DE COSTURA',
  instalador: 'PEDIDO DE INSTALACAO',
}

export const quoteDocumentLabels: Record<QuoteDocumentKey, string> = {
  cliente: 'Orcamento do cliente',
  costureira: 'Pedido da costureira',
  instalador: 'Pedido do instalador',
}

export const quoteDeliverySubjects: Record<QuoteDocumentKey, string> = {
  cliente: `Seu orcamento ${brandConfig.displayName}`,
  costureira: `Pedido de costura ${brandConfig.displayName}`,
  instalador: `Pedido de instalacao ${brandConfig.displayName}`,
}

export const buildQuoteDeliveryEmailHtml = (recipientName?: string) => {
  const safeName = recipientName?.trim() ? ` ${recipientName.trim()}` : ''

  return [
    `<p>Ola${safeName},</p>`,
    '<p>Segue em anexo o documento em PDF.</p>',
    `<p>Atenciosamente,<br>${brandConfig.displayName}</p>`,
  ].join('')
}

export const documentBranding = {
  senderName: brandConfig.displayName,
  representativeName: brandConfig.salesRepresentative,
  footerEmail: contactConfig.companyEmail,
  footerPhone: contactConfig.whatsappDisplay,
  signature: brandConfig.documentSignature,
} as const
