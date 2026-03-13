<script setup lang="ts">
defineProps<{
  title: string
  description: string
  image: string
  slug: string
  eyebrow: string
}>()
</script>

<template>
  <NuxtLink :to="`/produtos/${slug}`" class="product-card group">
    <div class="product-image">
      <NuxtImg :src="image" :alt="title" loading="lazy" width="640" height="480" class="product-media" />
      <div class="product-overlay">
        <span class="product-badge">{{ eyebrow }}</span>
      </div>
    </div>
    <div class="product-info">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
      <span class="product-link">
        Descobrir coleção
      </span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.product-card {
  display: block;
  background: var(--white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
  text-decoration: none;
}

.product-card:hover {
  transform: translateY(-10px);
  box-shadow: var(--shadow-md);
}

.product-image {
  position: relative;
  height: 250px;
  overflow: hidden;
}

.product-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.product-card:hover .product-media {
  transform: scale(1.04);
}

.product-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 18px;
  background: linear-gradient(180deg, rgba(14, 14, 14, 0.55) 0%, rgba(14, 14, 14, 0) 60%);
}

.product-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--white);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
}

.product-info h3 {
  font-size: 1.5rem;
  color: var(--text-dark);
}

.product-info p {
  color: var(--text-muted);
}

.product-link {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--primary);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.product-link::after {
  content: '→';
  transition: transform 0.25s ease;
}

.product-card:hover .product-link::after {
  transform: translateX(4px);
}
</style>
