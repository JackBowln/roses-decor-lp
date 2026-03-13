<script setup lang="ts">
import { computed } from 'vue'
import { Motion } from 'motion-v'
import ProductMasonryGallery from './ProductMasonryGallery.vue'
import type { ProductDetail } from '@/lib/products'
import { buildWhatsAppUrl, sectionIds } from '@/lib/site'

const props = defineProps<{
  product: ProductDetail
}>()

const whatsappInquiryUrl = computed(() =>
  buildWhatsAppUrl(`Olá! Quero saber mais sobre ${props.product.title}. Podemos conversar sobre um projeto sob medida?`)
)
</script>

<template>
  <article class="product-page">
    <section class="hero-shell">
      <div class="hero-background">
        <img :src="product.heroImage" :alt="product.title" class="hero-background-image" loading="eager" />
        <div class="hero-overlay" />
        <div class="hero-glow hero-glow-left" />
        <div class="hero-glow hero-glow-right" />
      </div>

      <div class="container hero-grid">
        <Motion class="hero-copy-column" :initial="{ opacity: 0, y: 40 }" :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.7 }">
          <NuxtLink :to="`/#${sectionIds.products}`" class="back-link">
            Voltar ao catálogo
          </NuxtLink>

          <span class="hero-eyebrow">{{ product.eyebrow }}</span>
          <h1 class="hero-title">{{ product.heroTitle }}</h1>
          <p class="hero-lead">{{ product.heroLead }}</p>

          <div class="hero-actions">
            <NuxtLink :to="`/#${sectionIds.preQuote}`" class="hero-primary">
              Solicitar orçamento
            </NuxtLink>
            <a :href="whatsappInquiryUrl" target="_blank" rel="noopener noreferrer" class="hero-secondary">
              Falar com consultora
            </a>
          </div>

          <ul class="hero-bullets">
            <li v-for="bullet in product.persuasiveBullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </Motion>

        <Motion class="hero-visual-card" :initial="{ opacity: 0, scale: 0.92, rotate: -4 }"
          :animate="{ opacity: 1, scale: 1, rotate: 0 }" :transition="{ duration: 0.8, delay: 0.15 }">
          <div class="visual-card-inner">
            <NuxtImg :src="product.heroTextureImage" :alt="`${product.title} em destaque`" width="900" height="1200"
              class="visual-image" />
            <div class="visual-content">
              <span class="visual-label">{{ product.accentLabel }}</span>
              <p class="visual-text">{{ product.moodLine }}</p>
            </div>
          </div>
        </Motion>
      </div>
    </section>

    <section class="benefits-section">
      <div class="container">
        <Motion class="section-heading" :initial="{ opacity: 0, y: 30 }" :whileInView="{ opacity: 1, y: 0 }"
          :viewport="{ once: true, amount: 0.3 }" :transition="{ duration: 0.55 }">
          <span class="section-kicker">Por que escolher</span>
          <h2 class="section-title">{{ product.title }}</h2>
          <p class="section-copy">{{ product.shortDescription }}</p>
        </Motion>

        <div class="benefits-grid">
          <Motion v-for="(benefit, index) in product.benefits" :key="benefit.title" class="benefit-card"
            :initial="{ opacity: 0, y: 24 }" :whileInView="{ opacity: 1, y: 0 }" :viewport="{ once: true, amount: 0.2 }"
            :transition="{ duration: 0.5, delay: index * 0.08 }">
            <span class="benefit-index">0{{ index + 1 }}</span>
            <h3>{{ benefit.title }}</h3>
            <p>{{ benefit.description }}</p>
          </Motion>
        </div>
      </div>
    </section>

    <section class="narrative-section">
      <div class="container narrative-grid">
        <Motion class="narrative-intro" :initial="{ opacity: 0, x: -30 }" :whileInView="{ opacity: 1, x: 0 }"
          :viewport="{ once: true, amount: 0.3 }" :transition="{ duration: 0.55 }">
          <span class="section-kicker section-kicker-light">Sensação de projeto pronto</span>
          <h2 class="section-title section-title-light">Detalhes que fazem a escolha parecer óbvia no dia a dia.</h2>
          <p class="section-copy section-copy-light">
            Quando o acabamento está certo, o ambiente fica mais bonito sem esforço. É isso que faz um produto sob
            medida parecer parte natural da casa.
          </p>
        </Motion>

        <div class="narrative-cards">
          <Motion v-for="(block, index) in product.narrative" :key="block.title" class="narrative-card"
            :initial="{ opacity: 0, y: 24 }" :whileInView="{ opacity: 1, y: 0 }" :viewport="{ once: true, amount: 0.2 }"
            :transition="{ duration: 0.55, delay: index * 0.08 }">
            <span class="narrative-eyebrow">{{ block.eyebrow }}</span>
            <h3>{{ block.title }}</h3>
            <p>{{ block.description }}</p>
          </Motion>
        </div>
      </div>
    </section>

    <section class="gallery-section">
      <div class="container">
        <Motion class="section-heading section-heading-centered" :initial="{ opacity: 0, y: 30 }"
          :whileInView="{ opacity: 1, y: 0 }" :viewport="{ once: true, amount: 0.2 }" :transition="{ duration: 0.55 }">
          <span class="section-kicker">Inspiração</span>
          <h2 class="section-title">Referências que ajudam a imaginar o resultado final.</h2>
          <p class="section-copy">
            Selecionamos composições que traduzem o tipo de atmosfera que esse produto cria: elegante, funcional e
            visualmente memorável.
          </p>
        </Motion>

        <ProductMasonryGallery :items="product.gallery" />
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <Motion class="cta-card" :initial="{ opacity: 0, y: 36 }" :whileInView="{ opacity: 1, y: 0 }"
          :viewport="{ once: true, amount: 0.35 }" :transition="{ duration: 0.65 }">
          <span class="section-kicker">Próximo passo</span>
          <h2 class="section-title">Se o ambiente pede {{ product.title.toLowerCase() }}, o melhor momento de decidir é
            agora.</h2>
          <p class="section-copy">
            Um projeto bem orientado evita erro de proporção, excesso de luz, material inadequado e acabamento abaixo
            do nível do espaço. A conversa certa economiza tempo e eleva o resultado.
          </p>

          <div class="hero-actions">
            <a :href="whatsappInquiryUrl" target="_blank" rel="noopener noreferrer" class="hero-primary">
              Conversar no WhatsApp
            </a>
            <NuxtLink :to="`/#${sectionIds.preQuote}`" class="hero-secondary hero-secondary-light">
              Pedir orçamento guiado
            </NuxtLink>
          </div>
        </Motion>
      </div>
    </section>
  </article>
</template>

<style scoped>
.product-page {
  background:
    radial-gradient(circle at top left, rgba(197, 160, 89, 0.1), transparent 28%),
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.7), transparent 24%),
    linear-gradient(180deg, #f7f1e7 0%, #fcfaf6 26%, #f4ebdd 54%, #f7efe4 76%, #fcfaf6 100%);
}

.hero-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--white);
}

.hero-background {
  position: absolute;
  inset: 0;
}

.hero-background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgba(10, 10, 10, 0.9) 14%, rgba(10, 10, 10, 0.58) 46%, rgba(10, 10, 10, 0.28) 100%);
}

.hero-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(60px);
  opacity: 0.45;
}

.hero-glow-left {
  width: 240px;
  height: 240px;
  left: -40px;
  top: 120px;
  background: rgba(197, 160, 89, 0.32);
}

.hero-glow-right {
  width: 320px;
  height: 320px;
  right: -50px;
  bottom: 120px;
  background: rgba(255, 255, 255, 0.14);
}

.hero-grid {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  gap: 48px;
  align-items: center;
  padding-top: 132px;
  padding-bottom: 80px;
}

.hero-copy-column {
  max-width: 760px;
}

.back-link {
  display: inline-flex;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.84);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.78rem;
  font-weight: 700;
}

.hero-eyebrow,
.visual-label {
  display: inline-flex;
  margin-bottom: 18px;
  color: #f0d696;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.76rem;
  font-weight: 700;
}

.section-kicker,
.narrative-eyebrow {
  display: inline-flex;
  margin-bottom: 18px;
  color: rgba(120, 84, 28, 0.92);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.76rem;
  font-weight: 700;
}

.hero-title,
.section-title {
  font-family: 'Playfair Display', serif;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.hero-title {
  max-width: 11ch;
  font-size: clamp(3rem, 7vw, 5.8rem);
  margin-bottom: 24px;
}

.hero-lead,
.section-copy,
.benefit-card p,
.narrative-card p,
.visual-text {
  font-family: 'Montserrat', sans-serif;
  line-height: 1.8;
}

.hero-lead {
  max-width: 58ch;
  color: rgba(255, 255, 255, 0.86);
  font-size: clamp(1.05rem, 2vw, 1.22rem);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 34px;
}

.hero-primary,
.hero-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: transform 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
  font-size: 0.8rem;
}

.hero-primary {
  background: var(--primary);
  color: var(--white);
}

.hero-secondary {
  border: 1px solid rgba(255, 255, 255, 0.24);
  color: var(--white);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.hero-secondary-light {
  border-color: rgba(21, 21, 21, 0.14);
  color: var(--text-dark);
  background: rgba(255, 255, 255, 0.72);
}

.hero-primary:hover,
.hero-secondary:hover {
  transform: translateY(-2px);
}

.hero-bullets {
  margin-top: 28px;
  display: grid;
  gap: 14px;
  padding-left: 18px;
  color: rgba(255, 255, 255, 0.82);
}

.hero-bullets li::marker {
  color: #f0d696;
}

.hero-visual-card {
  justify-self: end;
  width: min(100%, 460px);
}

.visual-card-inner {
  overflow: hidden;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(12px);
}

.visual-image {
  width: 100%;
  height: 540px;
  object-fit: cover;
}

.visual-content {
  padding: 24px;
}

.visual-label {
  margin-bottom: 12px;
}

.visual-text {
  color: rgba(255, 255, 255, 0.88);
}

.benefits-section,
.gallery-section {
  padding: 96px 0;
}

.section-heading {
  max-width: 780px;
  margin-bottom: 42px;
}

.section-heading-centered {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

.section-title {
  font-size: clamp(2.2rem, 4vw, 4rem);
  color: var(--text-dark);
  margin-bottom: 20px;
}

.section-copy {
  color: var(--text-muted);
  font-size: 1.05rem;
}

.benefits-grid {
  display: grid;
  gap: 22px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.benefit-card {
  padding: 28px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(197, 160, 89, 0.16);
  box-shadow: 0 16px 40px rgba(25, 25, 25, 0.08);
}

.benefit-index {
  display: inline-flex;
  margin-bottom: 18px;
  color: var(--primary);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.benefit-card h3,
.narrative-card h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.6rem;
  margin-bottom: 14px;
  color: var(--text-dark);
}

.narrative-section {
  padding: 96px 0;
  background:
    radial-gradient(circle at top right, rgba(197, 160, 89, 0.16), transparent 28%),
    linear-gradient(180deg, rgba(246, 239, 228, 0.96) 0%, rgba(240, 231, 216, 0.98) 100%);
  border-top: 1px solid rgba(197, 160, 89, 0.12);
  border-bottom: 1px solid rgba(197, 160, 89, 0.12);
}

.narrative-grid {
  display: grid;
  gap: 32px;
  align-items: start;
}

.section-kicker-light,
.section-title-light,
.section-copy-light,
.narrative-card p,
.narrative-card h3 {
  color: var(--text-dark);
}

.section-copy-light {
  color: var(--text-muted);
}

.narrative-cards {
  display: grid;
  gap: 20px;
}

.narrative-card {
  padding: 28px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(197, 160, 89, 0.14);
  box-shadow: 0 16px 50px rgba(36, 29, 17, 0.08);
}

.narrative-eyebrow {
  margin-bottom: 12px;
}

.cta-section {
  padding: 0 0 110px;
}

.cta-card {
  padding: 42px;
  border-radius: 34px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(247, 241, 231, 0.96) 100%);
  border: 1px solid rgba(197, 160, 89, 0.18);
  box-shadow: 0 20px 60px rgba(25, 25, 25, 0.1);
}

@media (min-width: 980px) {

  .hero-grid,
  .narrative-grid {
    grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
  }
}

@media (max-width: 979px) {
  .hero-visual-card {
    justify-self: start;
  }
}

@media (max-width: 768px) {

  .hero-grid,
  .benefits-section,
  .gallery-section,
  .narrative-section {
    padding-top: 84px;
    padding-bottom: 84px;
  }

  .hero-grid {
    padding-top: 116px;
  }

  .visual-image {
    height: 420px;
  }

  .cta-card {
    padding: 30px 22px;
  }
}
</style>
