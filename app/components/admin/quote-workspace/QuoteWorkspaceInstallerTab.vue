<script setup lang="ts">
import type { QuoteCustomer, QuoteProject, QuoteStakeholder } from '@/lib/adminQuote'
import type { InstallerDispatchRecord, InstallerRecord } from '@/lib/quoteWorkspace'

const props = defineProps<{
  selectedInstallerId: string | null
  installers: InstallerRecord[]
  installer: QuoteStakeholder
  project: QuoteProject
  customer: QuoteCustomer
  installationSummary: {
    installableItemCount: number
    totalMeters: number
  }
  previewLines: string[]
  installerDispatches: InstallerDispatchRecord[]
}>()

const emit = defineEmits<{
  (event: 'update:selectedInstallerId', value: string | null): void
}>()

const updateInstallerId = (value: string | number) => {
  emit('update:selectedInstallerId', typeof value === 'string' && value ? value : null)
}
</script>

<template>
  <AppSectionCard class="grid gap-5">
    <div class="grid gap-2">
      <span class="app-kicker">Pedido do instalador</span>
      <h2 class="text-[clamp(1.3rem,2vw,1.9rem)] text-foreground">Contato e instruções de instalação</h2>
    </div>

    <div class="grid gap-4 lg:grid-cols-4">
      <AppField label="Instalador responsável">
        <AppSelect :model-value="selectedInstallerId ?? ''" @update:model-value="updateInstallerId">
          <option value="">Selecione</option>
          <option v-for="installerOption in installers" :key="installerOption.id" :value="installerOption.id">
            {{ installerOption.name }}
          </option>
        </AppSelect>
      </AppField>

      <AppField label="E-mail">
        <AppInput v-model="installer.email" type="email" placeholder="instalacao@email.com" readonly />
      </AppField>

      <AppField label="WhatsApp">
        <AppInput :model-value="installer.whatsapp" type="text" inputmode="tel" placeholder="(27) 99999-9999" readonly />
      </AppField>

      <AppField label="Data de instalação / entrega">
        <AppInput v-model="project.installationDate" type="date" />
      </AppField>
    </div>

    <AppField label="Observações para instalação">
      <AppTextarea
        v-model="installer.notes"
        rows="5"
        placeholder="Altura de trilho, acesso, andaime, elétrica, restrições de obra..."
      />
    </AppField>

    <div class="grid gap-4 lg:grid-cols-2">
      <AdminRecordCard kicker="Resumo operacional" title="Instalação / entrega" subtitle="Conferência rápida para o instalador">
        <ul class="grid gap-2 pl-4 text-sm leading-6 text-muted/78">
          <li>Data de instalação / entrega: {{ project.installationDate || 'Pendente' }}</li>
          <li>Itens instaláveis: {{ installationSummary.installableItemCount }}</li>
          <li>Total de metros: {{ installationSummary.totalMeters.toFixed(2) }} m</li>
        </ul>
      </AdminRecordCard>

      <AdminRecordCard kicker="Contato do cliente" title="Base para a visita" subtitle="Dados usados na ficha do instalador">
        <ul class="grid gap-2 pl-4 text-sm leading-6 text-muted/78">
          <li>{{ customer.name || 'Cliente não informado' }}</li>
          <li>{{ customer.phone || customer.email || 'Contato pendente' }}</li>
          <li>
            {{ customer.address || 'Endereço pendente' }}
            <span v-if="customer.neighborhood"> • {{ customer.neighborhood }}</span>
            <span v-if="customer.city"> • {{ customer.city }}</span>
          </li>
        </ul>
      </AdminRecordCard>
    </div>

    <AdminRecordCard kicker="Prévia" title="Resumo do pedido" subtitle="Trecho inicial do documento operacional">
      <ul class="grid gap-2 pl-4 text-sm leading-6 text-muted/78">
        <li v-for="line in previewLines" :key="line">{{ line }}</li>
      </ul>
    </AdminRecordCard>

    <AdminRecordCard kicker="Histórico de envio" title="Ficha do instalador" subtitle="Registros de disparo por canal">
      <ul v-if="installerDispatches.length" class="grid gap-2 pl-4 text-sm leading-6 text-muted/78">
        <li v-for="dispatch in installerDispatches.slice(0, 6)" :key="dispatch.id">
          {{ new Date(dispatch.createdAt).toLocaleString('pt-BR') }} • {{ dispatch.channel }} • {{ dispatch.status }}
          <span v-if="dispatch.errorMessage"> • {{ dispatch.errorMessage }}</span>
        </li>
      </ul>
      <p v-else class="text-sm leading-6 text-muted/78">Nenhum envio da ficha do instalador foi registrado ainda.</p>
    </AdminRecordCard>
  </AppSectionCard>
</template>
