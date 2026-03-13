<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const { login, refreshSession, session } = useAdminSession()
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

onMounted(async () => {
  const currentSession = await refreshSession()

  if (currentSession.authenticated) {
    await navigateTo('/gestao/orcamentos')
  }
})

const handleSubmit = async () => {
  errorMessage.value = ''

  try {
    isSubmitting.value = true
    const currentSession = await login(password.value)

    if (currentSession.authenticated) {
      await navigateTo('/gestao/orcamentos')
    }
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível autenticar.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="login-shell">
    <div class="container login-grid">
      <div class="login-copy">
        <span class="login-kicker">Orçamentos internos</span>
        <h1>Central de propostas, pedidos e envio técnico.</h1>
        <p>
          Esta área concentra orçamento comercial, pedido da costureira, pedido do instalador e envio dos PDFs com um
          fluxo único e menos sujeito a erro.
        </p>
      </div>

      <div class="login-card">
        <template v-if="session.loaded && !session.configured">
          <span class="login-card-kicker">Configuração pendente</span>
          <h2>Área interna desabilitada</h2>
          <p>
            Defina a variável <code>ADMIN_QUOTE_PASSWORD</code> no ambiente para liberar o acesso administrativo.
          </p>
        </template>

        <form v-else class="login-form" @submit.prevent="handleSubmit">
          <span class="login-card-kicker">Acesso restrito</span>
          <h2>Entrar</h2>
          <p>Use a senha da gestão para acessar a central de orçamento.</p>

          <label class="field">
            <span>Senha</span>
            <input v-model="password" type="password" autocomplete="current-password" placeholder="Digite a senha">
          </label>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

          <button type="submit" class="submit-button" :disabled="isSubmitting || !password.trim()">
            {{ isSubmitting ? 'Validando...' : 'Entrar na central' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-shell {
  min-height: calc(100vh - 78px);
  display: flex;
  align-items: center;
  padding: 48px 0 72px;
}

.login-grid {
  display: grid;
  gap: 28px;
  align-items: center;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 420px);
}

.login-copy,
.login-card {
  padding: 36px;
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(197, 160, 89, 0.16);
  box-shadow: 0 22px 58px rgba(22, 22, 22, 0.08);
}

.login-kicker,
.login-card-kicker {
  display: inline-flex;
  margin-bottom: 16px;
  color: rgba(120, 84, 28, 0.92);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.login-copy h1,
.login-card h2 {
  color: var(--text-dark);
  font-size: clamp(2.2rem, 4vw, 4rem);
  line-height: 1.02;
  margin-bottom: 16px;
}

.login-copy p,
.login-card p {
  color: rgba(61, 61, 61, 0.86);
  line-height: 1.8;
}

.login-form {
  display: grid;
  gap: 18px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: rgba(26, 26, 26, 0.82);
  font-size: 0.84rem;
  font-weight: 700;
}

.field input {
  min-height: 52px;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.92);
  font: inherit;
}

.submit-button {
  min-height: 52px;
  border: 0;
  border-radius: 999px;
  background: var(--primary);
  color: var(--white);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #8d2c1f;
  font-size: 0.92rem;
}

@media (max-width: 900px) {
  .login-grid {
    grid-template-columns: 1fr;
  }

  .login-copy,
  .login-card {
    padding: 28px;
  }
}
</style>
