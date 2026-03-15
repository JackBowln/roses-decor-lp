import { describe, expect, it } from 'vitest'
import {
  digitsOnly,
  formatPhoneMask,
  formatStateMask,
  formatZipcodeMask,
  isValidEmail,
  isValidPhone,
  isValidZipcode,
} from '@/lib/fieldMasks'

describe('fieldMasks', () => {
  it('strips non-digit characters', () => {
    expect(digitsOnly('(27) 99856-3743')).toBe('27998563743')
  })

  it('formats phone masks for landline and mobile numbers', () => {
    expect(formatPhoneMask('2733221100')).toBe('(27) 3322-1100')
    expect(formatPhoneMask('27998563743')).toBe('(27) 99856-3743')
  })

  it('formats zipcode and state masks', () => {
    expect(formatZipcodeMask('29090635')).toBe('29090-635')
    expect(formatStateMask('e-s1')).toBe('ES')
  })

  it('validates phone, zipcode and email values', () => {
    expect(isValidPhone('(27) 99856-3743')).toBe(true)
    expect(isValidPhone('99856-3743')).toBe(false)
    expect(isValidZipcode('29090-635')).toBe(true)
    expect(isValidZipcode('29090-63')).toBe(false)
    expect(isValidEmail('cliente@rosesdecor.com')).toBe(true)
    expect(isValidEmail('cliente@rosesdecor')).toBe(false)
  })
})
