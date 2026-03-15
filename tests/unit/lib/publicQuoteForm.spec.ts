import { describe, expect, it } from 'vitest'
import {
  appendQuoteItemIfReady,
  createPublicPreQuotePayload,
  extractLastQuoteItemForEditing,
  getPublicQuoteStepId,
  isPublicQuoteStepValid,
  validatePublicQuoteSubmission,
} from '@/lib/publicQuoteForm'
import { createTestQuoteContact, createTestQuoteItem } from '../../factories/publicQuote'

describe('publicQuoteForm', () => {
  it('returns the last configured step id for out-of-range indexes', () => {
    expect(getPublicQuoteStepId(999)).toBe('contato')
  })

  it('appends only items that are ready to persist', () => {
    const readyItem = createTestQuoteItem()
    const incompleteItem = createTestQuoteItem({ material: '' })

    expect(appendQuoteItemIfReady([], readyItem)).toHaveLength(1)
    expect(appendQuoteItemIfReady([], incompleteItem)).toHaveLength(0)
  })

  it('extracts the last quote item for editing without mutating the original list', () => {
    const items = [
      createTestQuoteItem({ env: 'Sala' }),
      createTestQuoteItem({ env: 'Suite' }),
    ]

    const result = extractLastQuoteItemForEditing(items)

    expect(result.items).toHaveLength(1)
    expect(result.item?.env).toBe('Suite')
    expect(items).toHaveLength(2)
  })

  it('validates the contact step with phone and optional email rules', () => {
    const currentItem = createTestQuoteItem()
    const items = [currentItem]

    expect(isPublicQuoteStepValid({
      stepId: 'contato',
      currentItem,
      items,
      contact: createTestQuoteContact(),
    })).toBe(true)

    expect(isPublicQuoteStepValid({
      stepId: 'contato',
      currentItem,
      items,
      contact: createTestQuoteContact({ whatsapp: '123' }),
    })).toBe(false)

    expect(isPublicQuoteStepValid({
      stepId: 'contato',
      currentItem,
      items,
      contact: createTestQuoteContact({ email: 'email-invalido' }),
    })).toBe(false)
  })

  it('returns explicit validation messages for invalid submissions', () => {
    expect(validatePublicQuoteSubmission({
      customer: createTestQuoteContact({ whatsapp: '' }),
      items: [createTestQuoteItem()],
    })).toContain('Preencha nome')

    expect(validatePublicQuoteSubmission({
      customer: createTestQuoteContact(),
      items: [],
    })).toContain('Inclua ao menos um item')
  })

  it('creates a stable submission payload for valid inputs', () => {
    const customer = createTestQuoteContact()
    const items = [createTestQuoteItem()]

    expect(createPublicPreQuotePayload({ customer, items })).toEqual({ customer, items })
    expect(validatePublicQuoteSubmission({ customer, items })).toBe('')
  })
})
