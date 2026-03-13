<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const { refreshSession } = useAdminSession()

onMounted(async () => {
  const session = await refreshSession()
  await navigateTo(session.authenticated ? '/gestao/orcamentos' : '/gestao/login')
})
</script>

<template>
  <section class="redirect-shell">
    <div class="container">
      <p>Carregando área interna...</p>
    </div>
  </section>
</template>

<style scoped>
.redirect-shell {
  min-height: calc(100vh - 78px);
  display: flex;
  align-items: center;
}

p {
  color: rgba(61, 61, 61, 0.86);
}
</style>
