<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  title?: string
  description: string
  class?: string
}>(), {
  title: '',
  class: '',
})

const root = ref<HTMLElement | null>(null)
const isMobile = ref(false)
const isOpen = ref(false)

const updateViewportMode = () => {
  if (!import.meta.client) {
    return
  }

  isMobile.value = window.matchMedia('(max-width: 720px), (hover: none), (pointer: coarse)').matches

  if (!isMobile.value) {
    isOpen.value = false
  }
}

const close = () => {
  isOpen.value = false
}

const toggle = () => {
  if (!isMobile.value) {
    return
  }

  isOpen.value = !isOpen.value
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!isMobile.value || !isOpen.value || !root.value) {
    return
  }

  if (event.target instanceof Node && !root.value.contains(event.target)) {
    close()
  }
}

onMounted(() => {
  updateViewportMode()
  window.addEventListener('resize', updateViewportMode)
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  window.removeEventListener('resize', updateViewportMode)
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <span ref="root" :class="cn('group relative inline-flex', props.class)">
    <button
      type="button"
      class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line/20 bg-white/90 text-[11px] font-bold text-muted shadow-sm transition-colors duration-200 hover:border-line/40 hover:bg-surface-soft/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      :aria-expanded="isMobile ? isOpen : undefined"
      :aria-label="title ? `Ajuda sobre ${title}` : 'Ajuda do campo'"
      @click.stop="toggle"
    >
      i
    </button>

    <span
      class="pointer-events-none absolute left-1/2 top-full z-20 mt-3 hidden w-64 -translate-x-1/2 rounded-2xl border border-line/20 bg-foreground px-3 py-2.5 text-left text-xs font-medium leading-5 text-white shadow-2xl opacity-0 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100 md:block"
    >
      <strong v-if="title" class="mb-1 block text-[11px] uppercase tracking-[0.18em] text-white/70">{{ title }}</strong>
      {{ description }}
    </span>

    <teleport to="body">
      <button
        v-if="isMobile && isOpen"
        type="button"
        class="fixed inset-0 z-[80] bg-black/20 backdrop-blur-[1px] md:hidden"
        aria-label="Fechar ajuda"
        @click="close"
      />

      <div
        v-if="isMobile && isOpen"
        class="fixed inset-x-4 bottom-4 z-[81] rounded-3xl border border-line/15 bg-white/96 p-4 shadow-[0_24px_60px_rgba(22,22,22,0.18)] md:hidden"
      >
        <div class="mb-2 flex items-start justify-between gap-4">
          <div>
            <strong v-if="title" class="block text-xs uppercase tracking-[0.18em] text-muted/70">{{ title }}</strong>
          </div>

          <button
            type="button"
            class="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-line/15 px-3 text-xs font-semibold text-foreground"
            @click="close"
          >
            Fechar
          </button>
        </div>

        <p class="text-sm leading-6 text-foreground/85">
          {{ description }}
        </p>
      </div>
    </teleport>
  </span>
</template>
