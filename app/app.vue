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
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster position="top-right" rich-colors />
</template>
