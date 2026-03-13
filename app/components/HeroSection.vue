<script setup lang="ts">
import FlipWords from './ui/FlipWords.vue'
import ScrollExpansionHero from './ui/ScrollExpansionHero.vue'
import { sectionIds, siteConfig, whatsappUrl } from '@/lib/site'
</script>

<template>
  <ScrollExpansionHero mediaType="video" :mediaSrc="siteConfig.hero.mediaSrc" :posterSrc="siteConfig.hero.posterSrc"
    :bgImageSrc="siteConfig.hero.bgImageSrc" :title="siteConfig.brand.heroName" :date="siteConfig.hero.date"
    :scrollToExpand="siteConfig.hero.scrollToExpand" :textBlend="false">
    <div class="max-w-5xl mx-auto text-center px-4 relative z-20">
      <span class="inline-block font-bold uppercase tracking-widest text-[#B48E48] mb-6 text-sm hero-badge">
        {{ siteConfig.hero.badge }}
      </span>
      <h2 class="text-4xl md:text-5xl lg:text-7xl font-bold mb-8 text-gray-900 leading-tight hero-title">
        {{ siteConfig.hero.title }}
        <FlipWords :words="[...siteConfig.hero.rotatingWords]" class="text-[#B48E48]" />
        <br />
        {{ siteConfig.hero.subtitle }}
      </h2>
      <p class="text-xl md:text-2xl mb-12 text-gray-700 max-w-3xl mx-auto leading-relaxed hero-copy">
        {{ siteConfig.hero.description }}
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <NuxtLink :to="`/#${sectionIds.preQuote}`"
          class="px-8 py-4 bg-[#C5A059] text-white font-bold uppercase tracking-wide rounded-lg shadow-lg hover:bg-[#B48E48] transition-all hover:-translate-y-1 hero-cta">
          {{ siteConfig.cta.quote }}
        </NuxtLink>
        <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer"
          class="px-8 py-4 border-2 border-gray-800 text-gray-800 font-bold uppercase tracking-wide rounded-lg hover:bg-gray-800 hover:text-white transition-all hover:-translate-y-1 bg-transparent hero-cta">
          {{ siteConfig.cta.whatsapp }}
        </a>
      </div>
    </div>
  </ScrollExpansionHero>
</template>

<style scoped>
.hero-badge,
.hero-copy,
.hero-cta {
  font-family: 'Montserrat', sans-serif;
}

.hero-title {
  font-family: 'Playfair Display', serif;
}
</style>
