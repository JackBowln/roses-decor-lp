<script setup lang="ts">
defineProps<{
  title: string
  description: string
  image: string
}>()
</script>

<template>
  <article class="product-card">
    <div class="product-image">
      <NuxtImg :src="image" :alt="title" loading="lazy" width="640" height="480" class="product-media" />
    </div>
    <div class="product-info">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
  transform: translateY(-10px);
  box-shadow: var(--shadow-md);
}

.product-image {
  height: 250px;
  overflow: hidden;
}

.product-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 24px;
}

.product-info h3 {
  font-size: 1.5rem;
  margin-bottom: 12px;
}

.product-info p {
  color: var(--text-muted);
}
</style>
