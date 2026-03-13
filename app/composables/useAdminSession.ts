interface AdminSessionState {
  configured: boolean
  authenticated: boolean
  loaded: boolean
}

export function useAdminSession() {
  const session = useState<AdminSessionState>('admin-session', () => ({
    configured: true,
    authenticated: false,
    loaded: false,
  }))
  const isLoading = ref(false)

  const refreshSession = async () => {
    isLoading.value = true

    try {
      const response = await $fetch<{ configured: boolean; authenticated: boolean }>('/api/admin/session', {
        credentials: 'include',
      })

      session.value = {
        ...response,
        loaded: true,
      }
    }
    catch {
      session.value = {
        configured: true,
        authenticated: false,
        loaded: true,
      }
    }
    finally {
      isLoading.value = false
    }

    return session.value
  }

  const login = async (password: string) => {
    await $fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      body: { password },
    })

    return refreshSession()
  }

  const logout = async () => {
    await $fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    })

    session.value = {
      configured: session.value.configured,
      authenticated: false,
      loaded: true,
    }
  }

  return {
    isLoading,
    login,
    logout,
    refreshSession,
    session,
  }
}
