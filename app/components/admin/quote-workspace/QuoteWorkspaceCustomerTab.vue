<script setup lang="ts">
import type { QuoteCustomer } from '@/lib/adminQuote'

const props = defineProps<{
  customer: QuoteCustomer
  customerValidation: {
    phoneValid: boolean
    emailValid: boolean
    zipcodeValid: boolean
  }
  canLookupZipcode: boolean
  isResolvingZipcode: boolean
  zipcodeLookupError: string
}>()

const emit = defineEmits<{
  (event: 'update-phone', value: string): void
  (event: 'update-state', value: string): void
  (event: 'update-zipcode', value: string): void
  (event: 'lookup-zipcode', force?: boolean): void
}>()
</script>

<template>
  <AppSectionCard class="grid gap-5">
    <div class="grid gap-2">
      <span class="app-kicker">Cliente</span>
      <h2 class="text-[clamp(1.3rem,2vw,1.9rem)] text-foreground">Dados de contato e endereço</h2>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <AppField label="Nome do cliente">
        <AppInput v-model="customer.name" type="text" autocomplete="name" placeholder="Nome completo" />
      </AppField>

      <AppField
        label="WhatsApp"
        :error="customer.phone && !customerValidation.phoneValid ? 'Informe um telefone com DDD.' : ''"
      >
        <AppInput
          :model-value="customer.phone"
          type="text"
          inputmode="tel"
          autocomplete="tel"
          placeholder="(27) 99999-9999"
          :invalid="Boolean(customer.phone && !customerValidation.phoneValid)"
          @update:model-value="emit('update-phone', String($event ?? ''))"
        />
      </AppField>

      <AppField
        label="E-mail"
        :error="customer.email && !customerValidation.emailValid ? 'Use um e-mail válido.' : ''"
      >
        <AppInput
          v-model="customer.email"
          type="email"
          autocomplete="email"
          placeholder="cliente@email.com"
          :invalid="Boolean(customer.email && !customerValidation.emailValid)"
        />
      </AppField>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <AppField label="Endereço">
        <AppInput v-model="customer.address" type="text" autocomplete="street-address" placeholder="Rua e número" />
      </AppField>

      <AppField label="Bairro">
        <AppInput v-model="customer.neighborhood" type="text" autocomplete="address-level3" placeholder="Bairro" />
      </AppField>

      <AppField label="Cidade">
        <AppInput v-model="customer.city" type="text" autocomplete="address-level2" placeholder="Cidade" />
      </AppField>
    </div>

    <div class="grid gap-4 xl:grid-cols-[120px_minmax(0,1.5fr)_minmax(0,1fr)]">
      <AppField label="UF">
        <AppInput
          :model-value="customer.state"
          type="text"
          maxlength="2"
          autocomplete="address-level1"
          placeholder="ES"
          @update:model-value="emit('update-state', String($event ?? ''))"
        />
      </AppField>

      <AppField
        label="CEP"
        :error="zipcodeLookupError || (customer.zipcode && !customerValidation.zipcodeValid ? 'Use um CEP com 8 dígitos.' : '')"
        :description="!zipcodeLookupError && isResolvingZipcode
          ? 'Consultando endereço...'
          : (!zipcodeLookupError && customer.city && customer.state
            ? `Endereço localizado para ${customer.city}/${customer.state}.`
            : '')"
      >
        <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <AppInput
            :model-value="customer.zipcode"
            type="text"
            inputmode="numeric"
            autocomplete="postal-code"
            placeholder="00000-000"
            :invalid="Boolean(zipcodeLookupError || (customer.zipcode && !customerValidation.zipcodeValid))"
            @update:model-value="emit('update-zipcode', String($event ?? ''))"
            @blur="emit('lookup-zipcode', true)"
          />
          <AppButton
            variant="secondary"
            :disabled="isResolvingZipcode || !canLookupZipcode"
            @click="emit('lookup-zipcode', true)"
          >
            {{ isResolvingZipcode ? 'Buscando...' : 'Buscar CEP' }}
          </AppButton>
        </div>
      </AppField>

      <AppField label="Complemento rápido">
        <AppInput v-model="customer.complement" type="text" placeholder="Casa, apto, bloco..." />
      </AppField>
    </div>
  </AppSectionCard>
</template>
