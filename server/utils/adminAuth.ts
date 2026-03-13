import { createHmac, timingSafeEqual } from 'node:crypto'
import { createError, getCookie, setCookie } from 'h3'

const ADMIN_SESSION_COOKIE = 'rose_admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 12

interface AdminSessionPayload {
  scope: 'admin'
  exp: number
}

const encodeBase64Url = (value: string) => Buffer.from(value, 'utf8').toString('base64url')
const decodeBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8')

const getConfig = (event?: Parameters<typeof useRuntimeConfig>[0]) => {
  const config = useRuntimeConfig(event)

  return {
    password: config.adminQuotePassword,
    secret: config.adminSessionSecret || 'roses-decor-admin-secret',
  }
}

const sign = (value: string, secret: string) => createHmac('sha256', secret).update(value).digest('base64url')

export const isAdminAuthConfigured = (event?: Parameters<typeof useRuntimeConfig>[0]) => Boolean(getConfig(event).password)

export const createAdminSessionToken = (event?: Parameters<typeof useRuntimeConfig>[0]) => {
  const { secret } = getConfig(event)
  const payload: AdminSessionPayload = {
    scope: 'admin',
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  }
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = sign(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export const setAdminSessionCookie = (event: Parameters<typeof setCookie>[0]) => {
  setCookie(event, ADMIN_SESSION_COOKIE, createAdminSessionToken(event), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export const clearAdminSessionCookie = (event: Parameters<typeof setCookie>[0]) => {
  setCookie(event, ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export const verifyAdminSession = (event: Parameters<typeof getCookie>[0]) => {
  const token = getCookie(event, ADMIN_SESSION_COOKIE)

  if (!token) {
    return false
  }

  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature) {
    return false
  }

  const { secret } = getConfig(event)
  const expectedSignature = sign(encodedPayload, secret)

  try {
    const received = Buffer.from(signature)
    const expected = Buffer.from(expectedSignature)

    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return false
    }

    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as AdminSessionPayload

    return payload.scope === 'admin' && payload.exp > Date.now()
  }
  catch {
    return false
  }
}

export const assertAdminSession = (event: Parameters<typeof getCookie>[0]) => {
  if (!verifyAdminSession(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sessão administrativa inválida.',
    })
  }
}

export const assertAdminPasswordConfigured = (event: Parameters<typeof useRuntimeConfig>[0]) => {
  if (!isAdminAuthConfigured(event)) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Defina ADMIN_QUOTE_PASSWORD para habilitar a área interna.',
    })
  }
}

export const verifyAdminPassword = (event: Parameters<typeof useRuntimeConfig>[0], password: string) => {
  const { password: expectedPassword } = getConfig(event)

  if (!expectedPassword) {
    return false
  }

  const expected = Buffer.from(expectedPassword)
  const received = Buffer.from(password)

  if (expected.length !== received.length) {
    return false
  }

  return timingSafeEqual(expected, received)
}
