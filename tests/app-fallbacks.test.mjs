import test from 'node:test'
import assert from 'node:assert/strict'
import { uiFallbacks, withFallback, withPendingFallback } from '../app/lib/appFallbacks.ts'

test('withFallback trims values and falls back for empty input', () => {
  assert.equal(withFallback('  cliente  '), 'cliente')
  assert.equal(withFallback('   '), uiFallbacks.notInformed)
  assert.equal(withFallback(undefined, 'Sem valor'), 'Sem valor')
})

test('withPendingFallback returns pending semantics for empty values', () => {
  assert.equal(withPendingFallback('  ok  '), 'ok')
  assert.equal(withPendingFallback(''), uiFallbacks.pending)
  assert.equal(withPendingFallback(undefined, uiFallbacks.pendingContact), uiFallbacks.pendingContact)
})
