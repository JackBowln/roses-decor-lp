<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  previewLines: string[]
  recipientEmail?: string
  recipientWhatsapp?: string
  canSend: boolean
  emailDisabledReason?: string
  whatsappDisabledReason?: string
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
const emailBlockReason = computed(() => props.emailDisabledReason || (!props.canSend ? 'Este documento ainda não pode ser enviado.' : ''))
const whatsappBlockReason = computed(() => props.whatsappDisabledReason || (!props.canSend ? 'Este documento ainda não pode ser enviado.' : ''))
const emailDisabled = computed(() => Boolean(emailBlockReason.value) || props.sendingEmail)
const whatsappDisabled = computed(() => Boolean(whatsappBlockReason.value) || props.sendingWhatsApp)
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
      <div class="action-shell" :class="{ 'action-shell-disabled': Boolean(emailBlockReason) }"
        :tabindex="emailBlockReason ? 0 : -1">
        <button type="button" class="action-button" :disabled="emailDisabled" @click="$emit('send-email')">
          {{ sendingEmail ? 'Enviando...' : 'Enviar por e-mail' }}
        </button>
        <span v-if="emailBlockReason" class="action-tooltip">{{ emailBlockReason }}</span>
        <span v-if="emailBlockReason" class="action-reason-mobile">{{ emailBlockReason }}</span>
      </div>

      <div class="action-shell" :class="{ 'action-shell-disabled': Boolean(whatsappBlockReason) }"
        :tabindex="whatsappBlockReason ? 0 : -1">
        <button type="button" class="action-button action-button-secondary" :disabled="whatsappDisabled"
          @click="$emit('send-whatsapp')">
          {{ sendingWhatsApp ? 'Enviando...' : 'Enviar por WhatsApp' }}
        </button>
        <span v-if="whatsappBlockReason" class="action-tooltip">{{ whatsappBlockReason }}</span>
        <span v-if="whatsappBlockReason" class="action-reason-mobile">{{ whatsappBlockReason }}</span>
      </div>
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

.action-shell {
  position: relative;
  display: grid;
  gap: 8px;
}

.action-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  z-index: 3;
  width: min(260px, calc(100vw - 48px));
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(22, 22, 22, 0.96);
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.78rem;
  line-height: 1.45;
  box-shadow: 0 14px 28px rgba(22, 22, 22, 0.18);
  transform: translateX(-50%) translateY(6px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.action-tooltip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 10px;
  height: 10px;
  background: rgba(22, 22, 22, 0.96);
  transform: translate(-50%, -50%) rotate(45deg);
}

.action-shell-disabled:hover .action-tooltip,
.action-shell-disabled:focus .action-tooltip,
.action-shell-disabled:focus-within .action-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.action-reason-mobile {
  display: none;
  color: rgba(120, 84, 28, 0.92);
  font-size: 0.84rem;
  line-height: 1.5;
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
  .actions-row,
  .action-shell {
    width: 100%;
  }

  .actions-row {
    flex-direction: column;
  }

  .action-tooltip {
    display: none;
  }

  .action-reason-mobile {
    display: block;
  }
}
</style>
