<script setup lang="ts">
import { Motion } from 'motion-v'
import type { ProductGalleryImage } from '@/lib/products'

defineProps<{
  items: ProductGalleryImage[]
}>()
</script>

<template>
  <div class="gallery-columns">
    <Motion v-for="(item, index) in items" :key="`${item.src}-${index}`" class="gallery-item"
      :initial="{ opacity: 0, y: 32 }" :whileInView="{ opacity: 1, y: 0 }" :viewport="{ once: true, amount: 0.2 }"
      :transition="{ duration: 0.55, delay: index * 0.06 }">
      <figure class="gallery-card">
        <NuxtImg
          :src="item.src"
          :alt="item.alt"
          :width="item.width ?? 900"
          :height="item.height ?? 1200"
          :modifiers="item.modifiers"
          class="gallery-image"
          loading="lazy"
        />
        <figcaption class="gallery-caption">{{ item.caption }}</figcaption>
      </figure>
    </Motion>
  </div>
</template>

<style scoped>
.gallery-columns {
  columns: 1;
  column-gap: 20px;
}

.gallery-item {
  break-inside: avoid;
  margin-bottom: 20px;
}

.gallery-card {
  overflow: hidden;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 48px rgba(22, 22, 22, 0.12);
}

.gallery-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.gallery-caption {
  padding: 16px 18px 18px;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

@media (min-width: 768px) {
  .gallery-columns {
    columns: 2;
  }
}

@media (min-width: 1200px) {
  .gallery-columns {
    columns: 3;
  }
}
</style>
