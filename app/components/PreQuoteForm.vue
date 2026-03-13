<script setup lang="ts">
import MultiStepForm from './ui/MultiStepForm.vue'
import { sectionIds } from '@/lib/site'
</script>

<template>
  <section :id="sectionIds.preQuote" class="pre-quote section-padding">
    <div class="container overflow-hidden">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-playfair font-bold text-[#E6C35C] mb-4 pre-quote-title">Solicitar Orçamento</h2>
        <p class="text-gray-300 font-montserrat max-w-2xl mx-auto">
          Preencha os detalhes abaixo para que possamos entender melhor as suas necessidades e preparar um orçamento
          personalizado para você.
        </p>
      </div>

      <MultiStepForm />
    </div>
  </section>
</template>

<style scoped>
.pre-quote {
  background-color: #1a1a1a;
}

.pre-quote-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}
</style>
