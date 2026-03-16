<script setup lang="ts">
import { computed } from 'vue'
import { resolveAppEnvironmentMeta, shouldShowEnvironmentIndicator } from '@/lib/appEnvironment'

const config = useRuntimeConfig()

const environmentMeta = computed(() => resolveAppEnvironmentMeta(config.public.appDbTarget))
const visible = computed(() => shouldShowEnvironmentIndicator(config.public.appDbTarget))
</script>

<template>
  <div
    v-if="visible"
    class="pointer-events-none fixed right-3 top-3 z-overlay flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-pill px-3 py-2 text-xs font-extrabold uppercase tracking-[0.22em] shadow-lg ring-1 backdrop-blur md:right-4 md:top-4"
    :class="[environmentMeta.toneClass, environmentMeta.ringClass]"
    :title="environmentMeta.description"
    :aria-label="environmentMeta.label"
  >
    <span>{{ environmentMeta.shortLabel }}</span>
    <span class="hidden text-[0.68rem] font-semibold tracking-[0.14em] opacity-90 md:inline">{{ environmentMeta.label }}</span>
  </div>
</template>
