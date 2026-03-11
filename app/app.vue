<template>
  <div class="lp-wrapper">
    <TheHeader />
    <HeroSection />
    <ProductGrid />
    <PreQuoteForm />
    <FooterSection />
    <WhatsAppButton />
    <Toaster position="top-right" rich-colors />
  </div>
</template>

<script setup>
import { Toaster } from 'vue-sonner'

useHead({
  title: "Rose's Cortinas e Persianas | Design sob Medida Premium",
  meta: [
    { name: 'description', content: 'Elegância e sofisticação em cortinas e persianas premium sob medida no Brasil. Transforme seu ambiente com exclusividade.' }
  ]
})
</script>

<style>
/* Global page styles can go here if needed */
</style>
