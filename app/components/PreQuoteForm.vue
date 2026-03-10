<template>
  <section id="pre-orcamento" class="pre-quote section-padding">
    <div class="container">
      <div class="quote-card">
        <div class="quote-header">
          <h2>Receba uma Estimativa Rápida</h2>
          <p>Responda 3 perguntas e receba uma proposta personalizada no WhatsApp.</p>
        </div>

        <div class="steps-container">
          <!-- Step 1: Type -->
          <div v-if="step === 1" class="step">
            <h3>1. O que você procura?</h3>
            <div class="options">
              <button @click="selectType('Cortina')" :class="{ active: form.type === 'Cortina' }">Cortina</button>
              <button @click="selectType('Persiana')" :class="{ active: form.type === 'Persiana' }">Persiana</button>
            </div>
          </div>

          <!-- Step 2: Environment -->
          <div v-if="step === 2" class="step">
            <h3>2. Para qual ambiente?</h3>
            <div class="options">
              <button @click="selectEnv('Sala')" :class="{ active: form.env === 'Sala' }">Sala</button>
              <button @click="selectEnv('Quarto')" :class="{ active: form.env === 'Quarto' }">Quarto</button>
              <button @click="selectEnv('Escritório')"
                :class="{ active: form.env === 'Escritório' }">Escritório</button>
            </div>
          </div>

          <!-- Step 3: Contact -->
          <div v-if="step === 3" class="step">
            <h3>3. Como podemos te chamar?</h3>
            <div class="input-group">
              <input v-model="form.name" type="text" placeholder="Seu Nome" required />
              <button @click="finish" class="btn btn-primary" :disabled="!form.name">Finalizar no WhatsApp</button>
            </div>
          </div>

          <div class="step-navigation">
            <button v-if="step > 1" @click="step--" class="btn-back">← Voltar</button>
            <div class="dots">
              <span :class="{ active: step === 1 }"></span>
              <span :class="{ active: step === 2 }"></span>
              <span :class="{ active: step === 3 }"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const step = ref(1)
const form = ref({
  type: '',
  env: '',
  name: ''
})

const selectType = (val) => {
  form.value.type = val
  step.value = 2
}

const selectEnv = (val) => {
  form.value.env = val
  step.value = 3
}

const finish = () => {
  const message = `Olá! Meu nome é ${form.value.name}. Gostaria de um orçamento para ${form.value.type} na ${form.value.env}.`
  const encoded = encodeURIComponent(message)
  window.open(`https://wa.me/5527998220461?text=${encoded}`, '_blank')
}
</script>

<style scoped>
.quote-card {
  background: var(--white);
  padding: 60px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  max-width: 800px;
  margin: 0 auto;
}

.quote-header {
  text-align: center;
  margin-bottom: 40px;
}

.quote-header h2 {
  font-size: 2.2rem;
  margin-bottom: 10px;
}

.options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.options button {
  padding: 20px;
  border: 2px solid #eee;
  background: none;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.options button:hover,
.options button.active {
  border-color: var(--primary);
  color: var(--primary);
  background-color: rgba(197, 160, 89, 0.05);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

input {
  padding: 15px;
  border: 2px solid #eee;
  border-radius: var(--radius-md);
  font-size: 1rem;
}

.step-navigation {
  margin-top: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-back {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-weight: 600;
}

.dots {
  display: flex;
  gap: 8px;
}

.dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #eee;
}

.dots span.active {
  background: var(--primary);
}

@media (max-width: 768px) {
  .quote-card {
    padding: 30px 20px;
  }
}
</style>
