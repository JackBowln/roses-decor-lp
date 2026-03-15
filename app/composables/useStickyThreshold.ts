export const useStickyThreshold = (threshold = 10) => {
  const scrolled = ref(false)

  const updateStickyState = () => {
    if (!import.meta.client) {
      return
    }

    scrolled.value = window.scrollY > threshold
  }

  onMounted(() => {
    updateStickyState()
    window.addEventListener('scroll', updateStickyState, { passive: true })
  })

  onBeforeUnmount(() => {
    if (!import.meta.client) {
      return
    }

    window.removeEventListener('scroll', updateStickyState)
  })

  return {
    scrolled,
    updateStickyState,
  }
}
