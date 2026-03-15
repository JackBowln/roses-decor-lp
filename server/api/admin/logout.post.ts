import { clearAdminSessionCookie } from '~~/server/utils/adminAuth'

export default defineEventHandler((event) => {
  clearAdminSessionCookie(event)

  return {
    authenticated: false,
  }
})
