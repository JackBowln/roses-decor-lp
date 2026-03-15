<script setup lang="ts">
import AdminDocumentCard from '@/components/admin/AdminDocumentCard.vue'
import type { DeliveryStatusItem, QuoteDocumentKind } from '@/lib/adminQuote'
import type { QuoteDocumentEntry } from '@/lib/adminQuoteDocumentState'

const props = defineProps<{
  deliveryChecklist: DeliveryStatusItem[]
  documentEntries: QuoteDocumentEntry[]
  sending: Record<string, boolean>
}>()

const emit = defineEmits<{
  (event: 'download', kind: QuoteDocumentKind): void
  (event: 'send-email', kind: QuoteDocumentKind): void
  (event: 'send-whatsapp', kind: QuoteDocumentKind): void
}>()
</script>

<template>
  <section class="grid gap-5">
    <AppSectionCard class="grid gap-5">
      <div class="grid gap-2">
        <span class="app-kicker">Checklist</span>
        <h2 class="text-[clamp(1.3rem,2vw,1.9rem)] text-foreground">Conferência antes do disparo</h2>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="item in deliveryChecklist"
          :key="item.label"
          class="grid gap-2 rounded-[20px] border p-4"
          :class="item.completed
            ? 'border-success/15 bg-success/5'
            : 'border-danger/15 bg-white/72'"
        >
          <strong :class="item.completed ? 'text-success' : 'text-danger'" class="text-xs uppercase tracking-[0.14em]">
            {{ item.completed ? 'OK' : 'Pendente' }}
          </strong>
          <span class="text-sm leading-6 text-foreground/88">{{ item.label }}</span>
        </div>
      </div>
    </AppSectionCard>

    <AppSectionCard class="grid gap-3">
      <div class="grid gap-2">
        <span class="app-kicker">Envio gratuito</span>
        <h2 class="text-[clamp(1.3rem,2vw,1.9rem)] text-foreground">E-mail por Brevo e WhatsApp por compartilhamento nativo</h2>
      </div>
      <p class="text-sm leading-6 text-muted/78">
        O e-mail usa a API do Brevo. O WhatsApp usa compartilhamento nativo com o PDF e, quando isso não for suportado
        no navegador, faz fallback para download do arquivo e abertura da conversa.
      </p>
    </AppSectionCard>

    <AdminDocumentCard
      v-for="document in documentEntries"
      :key="document.kind"
      :title="document.title"
      :description="document.summary.lines[0] || 'Documento pronto para revisão.'"
      :preview-lines="document.summary.lines.slice(1, 6)"
      :recipient-email="document.email"
      :recipient-whatsapp="document.whatsapp"
      :can-send="document.ready"
      :email-disabled-reason="document.emailDisabledReason"
      :whatsapp-disabled-reason="document.whatsappDisabledReason"
      :sending-email="sending[`${document.kind}-email`]"
      :sending-whats-app="sending[`${document.kind}-whatsapp`]"
      @download="emit('download', document.kind)"
      @send-email="emit('send-email', document.kind)"
      @send-whatsapp="emit('send-whatsapp', document.kind)"
    />
  </section>
</template>
