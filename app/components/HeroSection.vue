<template>
  <header class="hero">
    <div class="hero-overlay"></div>
    <div class="container hero-content">
      <div class="hero-text">
        <span class="hero-tag">Exclusividades em Lisboa</span>
        <h1>Transforme sua casa com a elegância das cortinas sob medida</h1>
        <p>Design exclusivo, materiais premium e instalação profissional para criar o ambiente dos seus sonhos.</p>
        <div class="hero-ctas">
          <a href="#pre-orcamento" class="btn btn-primary">Pedir Orçamento Grátis</a>
          <a href="https://wa.me/5527998220461" target="_blank" class="btn btn-outline">Falar no WhatsApp</a>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  position: relative;
  height: 90vh;
  min-height: 600px;
  background-image: url('/images/hero.png');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  color: var(--white);
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-text {
  max-width: 650px;
}

.hero-tag {
  display: inline-block;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--primary);
  margin-bottom: 20px;
  font-size: 0.9rem;
}

h1 {
  font-size: 3.5rem;
  line-height: 1.1;
  margin-bottom: 24px;
}

p {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
}

.hero-ctas {
  display: flex;
  gap: 16px;
}

.btn-outline {
  border: 2px solid var(--white);
  color: var(--white);
}

.btn-outline:hover {
  background-color: var(--white);
  color: var(--text-dark);
}

@media (max-width: 768px) {
  h1 {
    font-size: 2.5rem;
  }

  .hero-ctas {
    flex-direction: column;
  }
}
</style>
