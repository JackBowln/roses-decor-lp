<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QuoteTabId, QuoteWorkbookTab } from '@/lib/adminQuote'

interface SummaryStat {
  label: string
  value: string
}

const props = defineProps<{
  tabs: QuoteWorkbookTab[]
  activeTab: QuoteTabId
  summaryStats: SummaryStat[]
}>()

const emit = defineEmits<{
  (event: 'select', tab: QuoteTabId): void
}>()

const isQuickNavOpen = ref(false)
const isSummaryOpen = ref(false)

const activeTabMeta = computed(() =>
  props.tabs.find((tab) => tab.id === props.activeTab) ?? props.tabs[0])

const handleSelectChange = (value: string | number) => {
  if (typeof value !== 'string') {
    return
  }

  const selectedTab = props.tabs.find((tab) => tab.id === value)

  if (selectedTab) {
    emit('select', selectedTab.id)
  }
}
</script>

<template>
  <div class="sticky top-24 z-20 xl:hidden">
    <AppSectionCard variant="hero" class="grid gap-4">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div class="grid gap-2">
          <span class="app-kicker">Navegação do orçamento</span>
          <strong class="text-lg text-foreground">{{ activeTabMeta.label }}</strong>
          <p class="text-sm leading-6 text-muted/78">{{ activeTabMeta.description }}</p>
        </div>

        <div class="grid gap-2 sm:grid-cols-2 lg:min-w-[240px]">
          <AppButton
            variant="secondary"
            block
            :class="isQuickNavOpen ? 'border-primary/30 bg-surface-soft/80' : ''"
            @click="isQuickNavOpen = !isQuickNavOpen"
          >
            {{ isQuickNavOpen ? 'Ocultar seções' : 'Seções' }}
          </AppButton>
          <AppButton
            variant="secondary"
            block
            :class="isSummaryOpen ? 'border-primary/30 bg-surface-soft/80' : ''"
            @click="isSummaryOpen = !isSummaryOpen"
          >
            {{ isSummaryOpen ? 'Ocultar resumo' : 'Resumo' }}
          </AppButton>
        </div>
      </div>

      <AppField label="Ir para a seção">
        <AppSelect :model-value="activeTab" @update:model-value="handleSelectChange">
          <option v-for="tab in tabs" :key="tab.id" :value="tab.id">{{ tab.label }}</option>
        </AppSelect>
      </AppField>

      <div v-if="isQuickNavOpen" class="grid gap-3 rounded-[22px] border border-line/15 bg-surface-soft/75 p-4">
        <div class="flex items-center justify-between gap-3">
          <span class="app-kicker">Atalhos rápidos</span>
          <AppButton variant="ghost" size="sm" @click="isQuickNavOpen = false">Fechar</AppButton>
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="grid min-h-16 gap-1 rounded-[20px] border px-4 py-3 text-left transition-colors"
            :class="tab.id === activeTab
              ? 'border-transparent bg-primary text-white'
              : 'border-black/10 bg-white/90 text-foreground hover:bg-white'"
            @click="$emit('select', tab.id)"
          >
            <span class="text-sm font-bold">{{ tab.label }}</span>
            <small class="text-xs leading-5 opacity-80">{{ tab.description }}</small>
          </button>
        </div>
      </div>

      <div v-if="isSummaryOpen" class="grid gap-3 rounded-[22px] border border-line/15 bg-surface-soft/75 p-4">
        <div class="flex items-center justify-between gap-3">
          <span class="app-kicker">Resumo rápido</span>
          <AppButton variant="ghost" size="sm" @click="isSummaryOpen = false">Fechar</AppButton>
        </div>

        <div class="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            v-for="stat in summaryStats"
            :key="stat.label"
            class="grid min-w-[144px] gap-1 rounded-[18px] border border-line/10 bg-white/90 px-4 py-3"
          >
            <span class="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted/68">{{ stat.label }}</span>
            <strong class="text-sm text-foreground">{{ stat.value }}</strong>
          </div>
        </div>
      </div>
    </AppSectionCard>
  </div>
</template>
