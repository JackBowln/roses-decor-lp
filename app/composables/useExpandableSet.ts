export const useExpandableSet = <T>(initialValues: T[] = []) => {
  const expandedValues = ref<T[]>([...initialValues])

  const isExpanded = (value: T) => expandedValues.value.includes(value)

  const toggleExpanded = (value: T) => {
    expandedValues.value = isExpanded(value)
      ? expandedValues.value.filter((entry) => entry !== value)
      : [...expandedValues.value, value]
  }

  const replaceExpanded = (values: T[]) => {
    expandedValues.value = [...values]
  }

  const clearExpanded = () => {
    expandedValues.value = []
  }

  return {
    expandedValues,
    isExpanded,
    toggleExpanded,
    replaceExpanded,
    clearExpanded,
  }
}
