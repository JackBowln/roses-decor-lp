import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildQuoteDeliveryEmailHtml,
  documentBranding,
  quoteDeliverySubjects,
  quoteDocumentLabels,
  quoteDocumentTitles,
} from '../app/lib/documentContent.ts'

test('document semantics stay centralized by document kind', () => {
  assert.equal(quoteDocumentTitles.cliente, 'PEDIDO APROVADO')
  assert.equal(quoteDocumentLabels.costureira, 'Pedido da costureira')
  assert.match(quoteDeliverySubjects.instalador, /Roses Decor/)
})

test('delivery html personalizes recipient when available', () => {
  assert.match(buildQuoteDeliveryEmailHtml('Vanessa'), /Vanessa/)
  assert.equal(documentBranding.senderName, 'Roses Decor')
  assert.equal(documentBranding.footerEmail.includes('@'), true)
})
