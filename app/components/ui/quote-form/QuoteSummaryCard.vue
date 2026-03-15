<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'

interface QuoteItem {
  type: string
  env: string
  material: string
  blackout: string
  width: string
  height: string
  dontKnowMeasures: boolean
}

defineProps<{
  item: QuoteItem
}>()

const emit = defineEmits<{
  remove: []
}>()
</script>

<template>
  <div class="grid gap-3 rounded-[22px] border border-line/25 bg-surface-soft/45 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
    <div class="min-w-0">
      <h4 class="font-semibold text-foreground">{{ item.type }} - {{ item.env }}</h4>
      <p class="mt-1 text-sm leading-6 text-muted/82">
        {{ item.material }}
        <template v-if="item.blackout && item.blackout !== 'Sem Blackout'"> • Blackout {{ item.blackout }}</template>
      </p>
      <p class="mt-1 text-sm text-muted/68">
        <span v-if="item.dontKnowMeasures">Medidas a confirmar</span>
        <span v-else>{{ item.width }}m x {{ item.height }}m</span>
      </p>
    </div>

    <AppIconButton label="Remover ambiente" @click="emit('remove')">
      <Trash2 class="h-5 w-5" />
    </AppIconButton>
  </div>
</template>
