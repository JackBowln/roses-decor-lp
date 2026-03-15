<script setup lang="ts">
import MultiStepForm from './ui/MultiStepForm.vue'
import { publicQuoteFlowConfig } from '@/lib/publicQuoteConfig'
import { sectionIds } from '@/lib/site'
</script>

<template>
  <section :id="sectionIds.preQuote" class="section-padding bg-foreground text-white">
    <div class="container overflow-hidden">
      <div class="mb-10 text-center">
        <h2 class="pre-quote-title mb-4 text-3xl font-playfair font-bold text-primary">{{ publicQuoteFlowConfig.section.title }}</h2>
        <p class="mx-auto max-w-2xl font-montserrat text-white/76">
          {{ publicQuoteFlowConfig.section.description }}
        </p>
      </div>

      <MultiStepForm />
    </div>
  </section>
</template>

<style scoped>
.pre-quote-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}
</style>
