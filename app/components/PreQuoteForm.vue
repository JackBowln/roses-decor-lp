<template>
  <section id="pre-orcamento" class="pre-quote section-padding">
    <div class="container overflow-hidden">
      <!-- Title area for context -->
      <div class="text-center mb-10">
        <h2 class="text-3xl font-playfair font-bold text-[#E6C35C] mb-4" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Solicitar Orçamento</h2>
        <p class="text-gray-300 font-montserrat max-w-2xl mx-auto">
          Preencha os detalhes abaixo para que possamos entender melhor as suas necessidades e preparar um orçamento personalizado para você.
        </p>
      </div>

      <!-- Render the new MultiStepForm (converted from React OnboardingForm) -->
      <MultiStepForm />
    </div>
  </section>
</template>

<script setup>
import MultiStepForm from './ui/MultiStepForm.vue'
</script>

<style scoped>
.pre-quote {
  background-color: #1a1a1a;
  padding: 80px 0;
}
</style>
