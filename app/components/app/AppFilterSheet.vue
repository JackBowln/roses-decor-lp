<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
}>(), {
  open: false,
})

const emit = defineEmits<{
  (event: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-overlay bg-foreground/35" @click="emit('close')">
      <div class="absolute inset-x-0 bottom-0 z-sheet rounded-t-[28px] bg-white p-5 shadow-elevated safe-pb" @click.stop>
        <div class="mb-4 flex items-center justify-between gap-3">
          <strong class="text-sm font-bold uppercase tracking-[0.16em] text-primary-strong">{{ title }}</strong>
          <AppButton variant="ghost" size="sm" @click="emit('close')">Fechar</AppButton>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
