<template>
  <section class="products section-padding">
    <div class="container">
      <div class="section-header">
        <h2>Soluções Sob Medida</h2>
        <p>Qualidade premium para todos os ambientes</p>
      </div>

      <div class="product-grid">
        <div v-for="product in products" :key="product.title" class="product-card">
          <div class="product-image">
            <img :src="product.image" :alt="product.title" />
          </div>
          <div class="product-info">
            <h3>{{ product.title }}</h3>
            <p>{{ product.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const products = [
  {
    title: 'Cortinas em Tecido',
    description: 'Elegância clássica com tecidos nobres e acabamento impecável.',
    image: '/images/hero.png' // Using hero as fallback for fabric
  },
  {
    title: 'Persianas Rolo',
    description: 'Minimalismo e controle de luz preciso para ambientes modernos.',
    image: '/images/roller-blinds.png'
  },
  {
    title: 'Persianas de Madeira',
    description: 'O toque natural e sofisticado que seu ambiente merece.',
    image: '/images/wooden-blinds.png'
  }
]
</script>

<style scoped>
.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.product-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-10px);
  box-shadow: var(--shadow-md);
}

.product-image {
  height: 250px;
  overflow: hidden;
}

.product-image img {
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
