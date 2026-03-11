<template>
  <footer class="footer section-padding">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h2 class="brand-logo">Rose's</h2>
          <p>Cortinas e Persianas sob medida.</p>
        </div>
        <div class="footer-links">
          <h3>Nossos Serviços</h3>
          <ul>
            <li>Cortinas em Tecido</li>
            <li>Persianas Modernas</li>
            <li>Automatização</li>
            <li>Instalação Profissional</li>
          </ul>
        </div>
        <div class="footer-contact">
          <h3>Contato</h3>
          <p>Atendimento personalizado</p>
          <p>WhatsApp: +55 27 99822-0461</p>
          <p>Instagram: @roses_cortinas_persianas</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Rose's Cortinas e Persianas. Todos os direitos reservados.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--text-dark);
  color: var(--white);
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  margin-bottom: 60px;
}

.brand-logo {
  font-size: 2rem;
  color: var(--primary);
  margin-bottom: 20px;
}

h3 {
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: var(--primary);
}

ul {
  list-style: none;
}

ul li {
  margin-bottom: 10px;
  opacity: 0.8;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 30px;
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.6;
}
</style>
