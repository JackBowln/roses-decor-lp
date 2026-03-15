<script setup lang="ts">
import { cn } from '@/lib/utils'

interface AdminNavLink {
  label: string
  to: string
}

defineProps<{
  links: AdminNavLink[]
  activePath: string
}>()
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-mobile-nav border-t border-line/15 bg-white/92 px-3 py-2 backdrop-blur md:hidden safe-pb">
    <div class="flex gap-2 overflow-x-auto pb-1">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :class="cn('inline-flex min-h-touch shrink-0 items-center justify-center rounded-pill px-4 text-xs font-bold text-foreground/72 transition-colors', activePath === link.to ? 'bg-primary text-white' : 'bg-surface-soft/70')"
      >
        {{ link.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
