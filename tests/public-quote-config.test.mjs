import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatPublicQuoteSuccessDescription,
  getPublicQuoteNextButtonLabel,
  publicQuoteFlowConfig,
  publicQuoteSteps,
} from '../app/lib/publicQuoteConfig.ts'

test('public quote step ids stay ordered for the current flow', () => {
  assert.deepEqual(publicQuoteSteps.map((step) => step.id), [
    'produto',
    'ambiente',
    'material',
    'medidas',
    'resumo',
    'contato',
  ])
})

test('next button label changes only for resumo and contato', () => {
  assert.equal(getPublicQuoteNextButtonLabel('produto'), publicQuoteFlowConfig.actions.next)
  assert.equal(getPublicQuoteNextButtonLabel('resumo'), publicQuoteFlowConfig.actions.review)
  assert.equal(getPublicQuoteNextButtonLabel('contato'), publicQuoteFlowConfig.actions.submit)
})

test('success description includes code and brand', () => {
  const description = formatPublicQuoteSuccessDescription('PRE-123', 'Roses Decor')
  assert.match(description, /PRE-123/)
  assert.match(description, /Roses Decor/)
})
