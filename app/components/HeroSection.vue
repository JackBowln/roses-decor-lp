<script setup lang="ts">
import ScrollExpansionHero from './ui/ScrollExpansionHero.vue'
import FlipWords from './ui/FlipWords.vue'

const words = ["elegantes", "sofisticados", "exclusivos", "modernos"]
</script>

<template>
  <ScrollExpansionHero
    mediaType="video"
    mediaSrc="https://videos.pexels.com/video-files/4462151/4462151-uhd_2732_1440_25fps.mp4"
    posterSrc="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop"
    bgImageSrc="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1920&auto=format&fit=crop"
    title="Roses Decor"
    date="Sofisticação"
    scrollToExpand="Descubra a Elegância"
    :textBlend="false"
  >
    <div class="max-w-5xl mx-auto text-center px-4 relative z-20">
      <span class="inline-block font-bold uppercase tracking-widest text-[#B48E48] mb-6 text-sm" style="font-family: 'Montserrat', sans-serif;">Alta Costura para Janelas</span>
      <h2 class="text-4xl md:text-5xl lg:text-7xl font-bold mb-8 text-gray-900 leading-tight" style="font-family: 'Playfair Display', serif;">
        Ambientes
        <FlipWords :words="words" class="text-[#B48E48]" /> <br />
        com cortinas sob medida
      </h2>
      <p class="text-xl md:text-2xl mb-12 text-gray-700 max-w-3xl mx-auto leading-relaxed" style="font-family: 'Montserrat', sans-serif; font-weight: 400;">
        Design exclusivo, materiais premium e caimento impecável. 
        Vestimos sua casa com a elegância que apenas a Roses Decor entrega.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a href="#pre-orcamento" class="px-8 py-4 bg-[#C5A059] text-white font-bold uppercase tracking-wide rounded-lg shadow-lg hover:bg-[#B48E48] transition-all hover:-translate-y-1" style="font-family: 'Montserrat', sans-serif;">
          Solicitar Orçamento Grátis
        </a>
        <a href="https://wa.me/5527998220461" target="_blank" class="px-8 py-4 border-2 border-gray-800 text-gray-800 font-bold uppercase tracking-wide rounded-lg hover:bg-gray-800 hover:text-white transition-all hover:-translate-y-1 bg-transparent" style="font-family: 'Montserrat', sans-serif;">
          Falar no WhatsApp
        </a>
      </div>
    </div>
  </ScrollExpansionHero>
</template>

<style scoped>
/* Additional component-specific styling if needed. The primary UI leverages Tailwind utility classes */
</style>
