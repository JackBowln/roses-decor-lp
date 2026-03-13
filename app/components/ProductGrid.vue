<script setup lang="ts">
import ProductCard from './ui/ProductCard.vue'
import { productCatalog } from '@/lib/products'
import { sectionIds } from '@/lib/site'
</script>

<template>
  <section :id="sectionIds.products" class="products section-padding">
    <div class="container">
      <div class="section-header">
        <h2>Soluções Sob Medida</h2>
        <p>Qualidade premium para todos os ambientes</p>
      </div>

      <div class="product-grid">
        <ProductCard v-for="product in productCatalog" :key="product.title" v-bind="product" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: clamp(2rem, 4vw, 2.5rem);
  margin-bottom: 10px;
}

.section-header p {
  color: var(--text-muted);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}
</style>
