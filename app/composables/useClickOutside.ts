import type { Ref } from 'vue'

interface ClickOutsideOptions {
  enabled?: Ref<boolean>
}

export const useClickOutside = (
  target: Ref<HTMLElement | null>,
  handler: (event: MouseEvent) => void,
  options: ClickOutsideOptions = {},
) => {
  const isEnabled = options.enabled || ref(true)

  const onClick = (event: MouseEvent) => {
    if (!isEnabled.value) {
      return
    }

    const root = target.value
    const node = event.target

    if (!root || !(node instanceof Node) || root.contains(node)) {
      return
    }

    handler(event)
  }

  onMounted(() => {
    document.addEventListener('click', onClick)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', onClick)
  })
}
