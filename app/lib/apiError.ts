interface ApiErrorLike {
  data?: {
    statusMessage?: string
    message?: string
  }
  response?: {
    _data?: {
      statusMessage?: string
      message?: string
    }
  }
  statusMessage?: string
  message?: string
}

const readMessage = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value.trim()
  return normalized && normalized !== 'FetchError' ? normalized : ''
}

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') {
    return fallback
  }

  const apiError = error as ApiErrorLike

  return (
    readMessage(apiError.data?.statusMessage)
    || readMessage(apiError.statusMessage)
    || readMessage(apiError.response?._data?.statusMessage)
    || readMessage(apiError.data?.message)
    || readMessage(apiError.response?._data?.message)
    || (error instanceof Error ? readMessage(error.message) : '')
    || fallback
  )
}
