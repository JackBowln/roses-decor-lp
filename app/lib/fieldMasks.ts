export const digitsOnly = (value: string) => value.replace(/\D+/g, '')

export const formatPhoneMask = (value: string) => {
  const digits = digitsOnly(value).slice(0, 11)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export const formatZipcodeMask = (value: string) => {
  const digits = digitsOnly(value).slice(0, 8)

  if (digits.length <= 5) {
    return digits
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export const formatStateMask = (value: string) =>
  value
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase()

export const isValidPhone = (value: string) => digitsOnly(value).length >= 10
export const isValidZipcode = (value: string) => digitsOnly(value).length === 8
export const isValidEmail = (value: string) => /^(?:[^\s@]+)@(?:[^\s@]+)\.(?:[^\s@]+)$/.test(value.trim())
