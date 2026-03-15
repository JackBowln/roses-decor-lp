export const buildAdminQueryString = (params: Record<string, string | null | undefined>) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      searchParams.set(key, value)
    }
  })

  const serialized = searchParams.toString()
  return serialized ? `?${serialized}` : ''
}

export const adminFetch = <T>(url: string, options?: Parameters<typeof $fetch<T>>[1]) =>
  $fetch<T>(url, {
    credentials: 'include',
    ...options,
  })
