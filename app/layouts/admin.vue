<script setup lang="ts">
const route = useRoute()
const { logout, session } = useAdminSession()
const isLoggingOut = ref(false)

const handleLogout = async () => {
  try {
    isLoggingOut.value = true
    await logout()
    await navigateTo('/gestao/login')
  }
  finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="admin-header-inner container">
        <div>
          <span class="admin-kicker">Área interna</span>
          <strong class="admin-title">Roses Decor</strong>
        </div>

        <div class="admin-header-actions">
          <NuxtLink v-if="route.path !== '/gestao/orcamentos'" to="/gestao/orcamentos" class="admin-link">
            Ir para orçamentos
          </NuxtLink>
          <button v-if="session.authenticated" type="button" class="admin-button" :disabled="isLoggingOut"
            @click="handleLogout">
            {{ isLoggingOut ? 'Saindo...' : 'Sair' }}
          </button>
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(197, 160, 89, 0.12), transparent 28%),
    linear-gradient(180deg, #f8f4ed 0%, #fcfaf6 38%, #f3eadb 100%);
}

.admin-header {
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(16px);
  background: rgba(248, 244, 237, 0.8);
  border-bottom: 1px solid rgba(197, 160, 89, 0.14);
}

.admin-header-inner {
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.admin-kicker {
  display: block;
  color: rgba(120, 84, 28, 0.92);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.admin-title {
  color: var(--text-dark);
  font-size: 1.05rem;
}

.admin-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.admin-button,
.admin-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-dark);
  text-decoration: none;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
