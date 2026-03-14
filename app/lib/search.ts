export const normalizeSearchQuery = (value: string) => value.trim().toLowerCase()

export const matchesSearchQuery = (query: string, fields: Array<string | null | undefined>) => {
  const normalizedQuery = normalizeSearchQuery(query)

  if (!normalizedQuery) {
    return true
  }

  return fields
    .filter((field): field is string => typeof field === 'string' && field.trim().length > 0)
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery)
}
