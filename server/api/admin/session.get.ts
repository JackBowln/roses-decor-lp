import { assertAdminPasswordConfigured, isAdminAuthConfigured, verifyAdminSession } from '../../utils/adminAuth'

export default defineEventHandler((event) => {
  const configured = isAdminAuthConfigured(event)

  if (configured) {
    assertAdminPasswordConfigured(event)
  }

  return {
    configured,
    authenticated: configured ? verifyAdminSession(event) : false,
  }
})
