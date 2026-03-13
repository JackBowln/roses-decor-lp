<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

onMounted(async () => {
  await navigateTo('/gestao/pre-orcamentos')
})
</script>

<template>
  <section class="redirect-shell">
    <div class="container">
      <p>Carregando gestão...</p>
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
