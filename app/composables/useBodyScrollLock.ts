import type { Ref } from 'vue'

export const useBodyScrollLock = (source: Ref<boolean>) => {
  watch(source, (isLocked) => {
    if (!import.meta.client) {
      return
    }

    document.body.style.overflow = isLocked ? 'hidden' : ''
  }, { immediate: true })

  onBeforeUnmount(() => {
    if (!import.meta.client) {
      return
    }

    document.body.style.overflow = ''
  })
}
