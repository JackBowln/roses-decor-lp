<script setup lang="ts">
import ProductExperiencePage from '@/components/product/ProductExperiencePage.vue'
import { getProductBySlug } from '@/lib/products'
import { siteConfig } from '@/lib/site'

const route = useRoute()
const slug = String(route.params.slug)
const product = getProductBySlug(slug)

if (!product) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Produto não encontrado',
  })
}

useSeoMeta({
  title: `${product.title} | ${siteConfig.brand.fullName}`,
  description: product.seoDescription,
  ogTitle: `${product.title} | ${siteConfig.brand.fullName}`,
  ogDescription: product.seoDescription,
  ogImage: product.heroImage,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <ProductExperiencePage :product="product" />
</template>
