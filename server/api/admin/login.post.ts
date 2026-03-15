import { createError, readBody } from 'h3'
import { assertAdminPasswordConfigured, setAdminSessionCookie, verifyAdminPassword } from '~~/server/utils/adminAuth'

interface LoginPayload {
  password?: string
}

export default defineEventHandler(async (event) => {
  assertAdminPasswordConfigured(event)

  const body = await readBody<LoginPayload>(event)
  const password = body.password?.trim() || ''

  await new Promise((resolve) => setTimeout(resolve, 250))

  if (!verifyAdminPassword(event, password)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Senha inválida.',
    })
  }

  setAdminSessionCookie(event)

  return {
    authenticated: true,
  }
})
