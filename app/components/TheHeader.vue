<template>
  <header class="main-header" :class="{ 'header-scrolled': isScrolled }">
    <div class="container header-container">
      <div class="logo">
        <span class="logo-text">Rose's</span>
        <span class="logo-subtext">Cortinas & Persianas</span>
      </div>
      <nav class="nav-desktop">
        <a href="#produtos">Produtos</a>
        <a href="#pre-orcamento" class="btn btn-sm btn-primary">Orçamento</a>
      </nav>
    </div>
  </header>
</template>

<script setup>
const isScrolled = ref(false)

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 50
  })
}
</script>

<style scoped>
.main-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background: transparent;
  transition: all 0.3s ease;
  padding: 20px 0;
}

.header-scrolled {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 12px 0;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.logo-text {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 800;
  color: var(--primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.logo-subtext {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--white);
  font-weight: 700;
  margin-top: -4px;
}

.header-scrolled .logo-subtext {
  color: var(--text-dark);
}

.nav-desktop {
  display: flex;
  align-items: center;
  gap: 30px;
}

.nav-desktop a {
  text-decoration: none;
  font-weight: 600;
  color: var(--white);
  font-size: 0.9rem;
  transition: color 0.3s;
}

.header-scrolled .nav-desktop a {
  color: var(--text-dark);
}

.nav-desktop a:hover {
  color: var(--primary);
}

.btn-sm {
  padding: 8px 20px;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .nav-desktop {
    display: none;
  }
}
</style>
