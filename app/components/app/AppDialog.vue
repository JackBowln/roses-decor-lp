<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, useAttrs, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  size?: DialogSize
  closeLabel?: string
  closeOnBackdrop?: boolean
}>(), {
  open: false,
  description: '',
  size: 'lg',
  closeLabel: 'Fechar',
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  (event: 'close'): void
}>()

const attrs = useAttrs()
const instanceId = getCurrentInstance()?.uid ?? 'dialog'
const titleId = `dialog-title-${instanceId}`
const descriptionId = `dialog-description-${instanceId}`

const sizeClassMap: Record<DialogSize, string> = {
  sm: 'max-w-[min(92vw,36rem)]',
  md: 'max-w-[min(94vw,44rem)]',
  lg: 'max-w-[min(95vw,68rem)]',
  xl: 'max-w-[min(96vw,1100px)]',
}

const forwardedAttrs = computed(() => {
  const attrsObject = { ...attrs }
  delete attrsObject.class
  return attrsObject
})

const panelClasses = computed(() => cn(
  'relative mx-auto flex w-full flex-col overflow-hidden bg-white ring-1 ring-line/10 shadow-elevated',
  'max-h-[min(94dvh,960px)] rounded-[28px] sm:rounded-[30px]',
  sizeClassMap[props.size],
  attrs.class as string,
))

const close = () => emit('close')

const handleBackdrop = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.open) {
    close()
  }
}

let previousBodyOverflow = ''
let previousBodyPaddingRight = ''

const unlockBody = () => {
  if (!import.meta.client) {
    return
  }

  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = previousBodyOverflow
  document.body.style.paddingRight = previousBodyPaddingRight
}

watch(() => props.open, (isOpen) => {
  if (!import.meta.client) {
    return
  }

  if (!isOpen) {
    unlockBody()
    return
  }

  previousBodyOverflow = document.body.style.overflow
  previousBodyPaddingRight = document.body.style.paddingRight

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  document.body.style.overflow = 'hidden'
  document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : previousBodyPaddingRight

  window.addEventListener('keydown', handleKeydown)
}, { immediate: true })

onBeforeUnmount(() => {
  unlockBody()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-overlay flex items-center justify-center bg-foreground/45 px-3 py-4 sm:px-6 sm:py-8"
        @click="handleBackdrop"
      >
        <Transition name="dialog-panel">
          <section
            v-if="open"
            v-bind="forwardedAttrs"
            :aria-describedby="description ? descriptionId : undefined"
            :aria-labelledby="titleId"
            aria-modal="true"
            class="flex w-full justify-center"
            role="dialog"
          >
            <div :class="panelClasses" @click.stop>
              <header class="border-b border-line/10 bg-white/96 px-4 py-4 backdrop-blur sm:px-6 sm:py-5">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div class="grid gap-1.5">
                    <strong :id="titleId" class="text-base font-bold text-foreground sm:text-lg">
                      {{ title }}
                    </strong>
                    <p v-if="description" :id="descriptionId" class="text-sm leading-6 text-muted/78">
                      {{ description }}
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center justify-end gap-2">
                    <slot name="actions" />
                    <AppButton variant="ghost" size="icon" :aria-label="closeLabel" @click="close">
                      <X class="h-4 w-4" />
                    </AppButton>
                  </div>
                </div>
              </header>

              <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 safe-pb sm:px-6 sm:py-5">
                <slot />
              </div>
            </div>
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-panel-enter-active,
.dialog-panel-leave-active {
  transition: transform 0.22s ease, opacity 0.18s ease;
}

.dialog-panel-enter-from,
.dialog-panel-leave-to {
  opacity: 0;
  transform: translateY(18px);
}

@media (min-width: 640px) {
  .dialog-panel-enter-from,
  .dialog-panel-leave-to {
    transform: translateY(10px) scale(0.98);
  }
}
</style>
