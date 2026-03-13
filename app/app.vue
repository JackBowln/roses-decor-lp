<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import { useSmoothAnchorLinks } from '@/composables/useSmoothAnchorLinks'
import { siteConfig } from '@/lib/site'

useSmoothAnchorLinks()

useHead({
  title: siteConfig.seo.title,
  meta: [
    {
      name: 'description',
      content: siteConfig.seo.description,
    },
  ],
})
</script>

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
