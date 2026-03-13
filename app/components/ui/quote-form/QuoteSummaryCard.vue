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
  <div class="flex items-start justify-between p-4 border border-[#C5A059]/30 bg-[#C5A059]/5 rounded-xl">
    <div>
      <h4 class="font-medium text-gray-900">{{ item.type }} - {{ item.env }}</h4>
      <p class="text-sm text-gray-600 mt-1">
        {{ item.material }}
        <template v-if="item.blackout && item.blackout !== 'Sem Blackout'">• Blackout {{ item.blackout }}</template>
      </p>
      <p class="text-sm text-gray-500 mt-1">
        <span v-if="item.dontKnowMeasures">Medidas a confirmar</span>
        <span v-else>{{ item.width }}m x {{ item.height }}m</span>
      </p>
    </div>
    <button class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
      @click="emit('remove')">
      <Trash2 class="w-5 h-5" />
    </button>
  </div>
</template>
