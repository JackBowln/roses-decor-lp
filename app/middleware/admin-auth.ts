export default defineNuxtRouteMiddleware(async () => {
  try {
    const session = await $fetch<{ authenticated: boolean }>('/api/admin/session', {
      credentials: 'include',
    })

    if (!session.authenticated) {
      return navigateTo('/gestao/login')
    }
  }
  catch {
    return navigateTo('/gestao/login')
  }
})
