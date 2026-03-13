<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  previewLines: string[]
  recipientEmail?: string
  recipientWhatsapp?: string
  canSend: boolean
  sendingEmail?: boolean
  sendingWhatsApp?: boolean
}>()

defineEmits<{
  (event: 'download'): void
  (event: 'send-email'): void
  (event: 'send-whatsapp'): void
}>()

const hasEmail = computed(() => Boolean(props.recipientEmail))
const hasWhatsApp = computed(() => Boolean(props.recipientWhatsapp))
</script>

<template>
  <article class="document-card">
    <div class="document-card-head">
      <div>
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
      </div>
      <button type="button" class="download-button" @click="$emit('download')">Baixar PDF</button>
    </div>

    <ul class="preview-list">
      <li v-for="line in previewLines" :key="line">{{ line }}</li>
    </ul>

    <div class="recipient-list">
      <span v-if="hasEmail">E-mail: {{ recipientEmail }}</span>
      <span v-if="hasWhatsApp">WhatsApp: {{ recipientWhatsapp }}</span>
      <span v-if="!hasEmail && !hasWhatsApp">Defina um canal de envio antes de disparar.</span>
    </div>

    <div class="actions-row">
      <button type="button" class="action-button" :disabled="!canSend || !hasEmail || sendingEmail"
        @click="$emit('send-email')">
        {{ sendingEmail ? 'Enviando...' : 'Enviar por e-mail' }}
      </button>
      <button type="button" class="action-button action-button-secondary"
        :disabled="!canSend || !hasWhatsApp || sendingWhatsApp" @click="$emit('send-whatsapp')">
        {{ sendingWhatsApp ? 'Enviando...' : 'Enviar por WhatsApp' }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.document-card {
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(197, 160, 89, 0.16);
  box-shadow: 0 18px 44px rgba(22, 22, 22, 0.08);
}

.document-card-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.document-card-head h3 {
  color: var(--text-dark);
  font-size: 1.35rem;
  margin-bottom: 8px;
}

.document-card-head p,
.preview-list,
.recipient-list {
  color: rgba(61, 61, 61, 0.86);
}

.download-button,
.action-button {
  padding: 12px 16px;
  border-radius: 999px;
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.86);
  color: var(--text-dark);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.action-button {
  background: var(--primary);
  color: var(--white);
  border-color: transparent;
}

.action-button-secondary {
  background: rgba(26, 26, 26, 0.9);
}

.download-button:disabled,
.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-list {
  display: grid;
  gap: 8px;
  padding-left: 18px;
  margin-bottom: 18px;
}

.recipient-list {
  display: grid;
  gap: 6px;
  margin-bottom: 18px;
  font-size: 0.94rem;
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 720px) {
  .document-card {
    padding: 18px;
    border-radius: 24px;
  }

  .document-card-head {
    flex-direction: column;
  }

  .download-button,
  .action-button,
  .actions-row {
    width: 100%;
  }

  .actions-row {
    flex-direction: column;
  }
}
</style>
