import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWhatsAppUrl, navigationLinks, sectionIds, siteConfig, whatsappUrl } from '../app/lib/site.ts'

test('site navigation points to configured public sections', () => {
  assert.equal(navigationLinks[0].to, `/#${sectionIds.products}`)
  assert.equal(navigationLinks[1].to, `/#${sectionIds.preQuote}`)
  assert.equal(siteConfig.cta.quote, 'Solicitar Orcamento')
})

test('whatsapp urls keep the configured number and encode message', () => {
  const url = buildWhatsAppUrl('Ola Roses Decor')
  assert.match(url, /^https:\/\/wa\.me\//)
  assert.match(url, /Ola%20Roses%20Decor/)
  assert.equal(whatsappUrl.includes(siteConfig.contact.whatsappNumber), true)
})
