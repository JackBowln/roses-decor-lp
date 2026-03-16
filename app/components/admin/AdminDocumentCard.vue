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
  <AppSectionCard class="grid gap-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="grid gap-2">
        <span class="app-kicker">Documento operacional</span>
        <div class="grid gap-1.5">
          <h3 class="text-[1.35rem] text-foreground">
            {{ title }}
          </h3>
          <p class="text-sm leading-6 text-muted/78">
            {{ description }}
          </p>
        </div>
      </div>
      <AppButton variant="secondary" size="sm" @click="$emit('download')">
        Baixar PDF
      </AppButton>
    </div>

    <div class="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
      <div class="grid gap-3 rounded-[24px] border border-line/10 bg-surface-soft/68 p-4">
        <span class="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted/68">Prévia rápida</span>
        <ul class="grid gap-2 pl-4 text-sm leading-6 text-muted/78">
          <li v-for="line in previewLines" :key="line">{{ line }}</li>
        </ul>
      </div>

      <div class="grid gap-3 rounded-[24px] border border-line/10 bg-white/88 p-4">
        <span class="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted/68">Canais de envio</span>
        <div class="grid gap-2 text-sm leading-6 text-muted/78">
          <span v-if="hasEmail">E-mail: {{ recipientEmail }}</span>
          <span v-if="hasWhatsApp">WhatsApp: {{ recipientWhatsapp }}</span>
          <span v-if="!hasEmail && !hasWhatsApp">Defina um canal de envio antes de disparar.</span>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3">
      <div
        class="group relative grid w-full gap-2 sm:w-auto"
        :tabindex="emailBlockReason ? 0 : -1"
      >
        <AppButton block class="sm:w-auto" :disabled="emailDisabled" @click="$emit('send-email')">
          {{ sendingEmail ? 'Enviando...' : 'Enviar por e-mail' }}
        </AppButton>
        <span
          v-if="emailBlockReason"
          class="hidden w-[min(280px,calc(100vw-3rem))] rounded-[16px] bg-foreground px-3 py-2 text-xs leading-5 text-white shadow-elevated sm:absolute sm:bottom-[calc(100%+0.75rem)] sm:left-1/2 sm:block sm:-translate-x-1/2 sm:translate-y-1 sm:opacity-0 sm:transition-all sm:duration-200 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100"
        >
          {{ emailBlockReason }}
        </span>
        <span v-if="emailBlockReason" class="text-sm leading-6 text-warning sm:hidden">{{ emailBlockReason }}</span>
      </div>

      <div
        class="group relative grid w-full gap-2 sm:w-auto"
        :tabindex="whatsappBlockReason ? 0 : -1"
      >
        <AppButton variant="secondary" block class="sm:w-auto" :disabled="whatsappDisabled" @click="$emit('send-whatsapp')">
          {{ sendingWhatsApp ? 'Enviando...' : 'Enviar por WhatsApp' }}
        </AppButton>
        <span
          v-if="whatsappBlockReason"
          class="hidden w-[min(280px,calc(100vw-3rem))] rounded-[16px] bg-foreground px-3 py-2 text-xs leading-5 text-white shadow-elevated sm:absolute sm:bottom-[calc(100%+0.75rem)] sm:left-1/2 sm:block sm:-translate-x-1/2 sm:translate-y-1 sm:opacity-0 sm:transition-all sm:duration-200 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100"
        >
          {{ whatsappBlockReason }}
        </span>
        <span v-if="whatsappBlockReason" class="text-sm leading-6 text-warning sm:hidden">{{ whatsappBlockReason }}</span>
      </div>
    </div>
  </AppSectionCard>
</template>
