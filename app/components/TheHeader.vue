<script setup lang="ts">
import { cn } from '@/lib/utils'
import { navigationLinks, siteConfig } from '@/lib/site'
import { useStickyThreshold } from '@/composables/useStickyThreshold'

const { scrolled: isScrolled } = useStickyThreshold(50)
</script>

<template>
  <header
    :class="cn(
      'fixed inset-x-0 top-0 z-sticky transition-all duration-300',
      isScrolled
        ? 'border-b border-white/10 bg-white/95 py-3 shadow-sticky backdrop-blur-lg'
        : 'bg-transparent py-5',
    )"
  >
    <div class="container flex items-center justify-between gap-6">
      <div class="flex flex-col leading-none">
        <span
          :class="cn(
            'font-playfair text-[clamp(1.75rem,2vw,2rem)] font-extrabold text-primary transition-colors',
            isScrolled ? 'drop-shadow-none' : 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]',
          )"
        >
          {{ siteConfig.brand.shortName }}
        </span>
        <span
          :class="cn(
            'mt-[-4px] text-[0.72rem] font-bold uppercase tracking-[0.3em] transition-colors',
            isScrolled ? 'text-foreground/78' : 'text-white',
          )"
        >
          {{ siteConfig.brand.subLabel }}
        </span>
      </div>

      <nav class="hidden items-center gap-7 md:flex" aria-label="Navegacao principal">
        <NuxtLink
          v-for="link in navigationLinks"
          :key="link.to"
          :to="link.to"
          :class="cn(
            link.variant === 'primary'
              ? 'btn btn-sm btn-primary'
              : [
                  'text-sm font-semibold transition-colors',
                  isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary',
                ],
          )"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
