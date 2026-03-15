<script setup lang="ts">
import {
  blackoutOptions,
  fabricOptions,
  mountTypeOptions,
  openingSideOptions,
  pleatOptions,
  productCategoryOptions,
  trackTypeOptions,
  yesNoOptions,
  type QuoteLineItem,
} from '@/lib/adminQuote'
import {
  adminQuoteItemFieldHelp,
  parseNullableNumber,
} from '@/lib/adminQuoteItemCard'

const props = defineProps<{
  item: QuoteLineItem
}>()
</script>

<template>
  <div class="grid gap-4">
    <div class="grid gap-4 lg:grid-cols-3">
      <AppField>
        <template #label>
          <span>Ambiente</span>
          <AppFieldHelp title="Ambiente" :description="adminQuoteItemFieldHelp.room" />
        </template>
        <AppInput v-model="item.room" type="text" placeholder="Sala, suíte, escritório..." />
      </AppField>

      <AppField>
        <template #label>
          <span>Vão / janela</span>
          <AppFieldHelp title="Vão / janela" :description="adminQuoteItemFieldHelp.openingLabel" />
        </template>
        <AppInput v-model="item.openingLabel" type="text" placeholder="Janela principal, porta balcão..." />
      </AppField>

      <AppField>
        <template #label>
          <span>Categoria</span>
          <AppFieldHelp title="Categoria" :description="adminQuoteItemFieldHelp.category" />
        </template>
        <AppSelect v-model="item.category">
          <option v-for="option in productCategoryOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>
    </div>

    <div class="grid gap-4 xl:grid-cols-4">
      <AppField>
        <template #label>
          <span>Largura (m)</span>
          <AppFieldHelp title="Largura" :description="adminQuoteItemFieldHelp.width" />
        </template>
        <AppInput
          :model-value="item.width"
          type="number"
          min="0"
          step="0.01"
          placeholder="2.40"
          @update:model-value="item.width = parseNullableNumber(String($event ?? ''))"
        />
      </AppField>

      <AppField>
        <template #label>
          <span>Altura (m)</span>
          <AppFieldHelp title="Altura" :description="adminQuoteItemFieldHelp.height" />
        </template>
        <AppInput
          :model-value="item.height"
          type="number"
          min="0"
          step="0.01"
          placeholder="2.70"
          @update:model-value="item.height = parseNullableNumber(String($event ?? ''))"
        />
      </AppField>

      <AppField>
        <template #label>
          <span>Quantidade</span>
          <AppFieldHelp title="Quantidade" :description="adminQuoteItemFieldHelp.quantity" />
        </template>
        <AppInput v-model.number="item.quantity" type="number" min="1" step="1" />
      </AppField>

      <AppField>
        <template #label>
          <span>Trilho</span>
          <AppFieldHelp title="Trilho" :description="adminQuoteItemFieldHelp.trackType" />
        </template>
        <AppSelect v-model="item.trackType">
          <option v-for="option in trackTypeOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>
    </div>

    <div class="grid gap-4 xl:grid-cols-4">
      <AppField>
        <template #label>
          <span>Suporte parede</span>
          <AppFieldHelp title="Suporte parede" :description="adminQuoteItemFieldHelp.wallSupport" />
        </template>
        <AppSelect v-model="item.wallSupport">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>

      <AppField>
        <template #label>
          <span>Deslizante</span>
          <AppFieldHelp title="Deslizante" :description="adminQuoteItemFieldHelp.slider" />
        </template>
        <AppSelect v-model="item.slider">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>

      <AppField>
        <template #label>
          <span>Terminal</span>
          <AppFieldHelp title="Terminal" :description="adminQuoteItemFieldHelp.terminal" />
        </template>
        <AppSelect v-model="item.terminal">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>

      <AppField>
        <template #label>
          <span>Instalação</span>
          <AppFieldHelp title="Instalação" :description="adminQuoteItemFieldHelp.installationIncluded" />
        </template>
        <AppSelect v-model="item.installationIncluded">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>
    </div>

    <div class="grid gap-4 xl:grid-cols-4">
      <AppField>
        <template #label>
          <span>Blackout</span>
          <AppFieldHelp title="Blackout" :description="adminQuoteItemFieldHelp.blackout" />
        </template>
        <AppSelect v-model="item.blackout">
          <option v-for="option in blackoutOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>

      <AppField description="Referência comercial do pré-orçamento ou da venda. Não baixa estoque.">
        <template #label>
          <span>Tecido escolhido pelo cliente</span>
          <AppFieldHelp title="Tecido do cliente" :description="adminQuoteItemFieldHelp.customerFabric" />
        </template>
        <AppSelect v-model="item.fabric">
          <option v-for="option in fabricOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>

      <AppField>
        <template #label>
          <span>Cor / coleção</span>
          <AppFieldHelp title="Cor / coleção" :description="adminQuoteItemFieldHelp.fabricColor" />
        </template>
        <AppInput v-model="item.fabricColor" type="text" placeholder="Off white, areia..." />
      </AppField>

      <AppField>
        <template #label>
          <span>Pregas</span>
          <AppFieldHelp title="Pregas" :description="adminQuoteItemFieldHelp.pleatModel" />
        </template>
        <AppSelect v-model="item.pleatModel">
          <option v-for="option in pleatOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>
    </div>

    <div class="grid gap-4 xl:grid-cols-4">
      <AppField>
        <template #label>
          <span>Fixação</span>
          <AppFieldHelp title="Fixação" :description="adminQuoteItemFieldHelp.mountType" />
        </template>
        <AppSelect v-model="item.mountType">
          <option v-for="option in mountTypeOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>

      <AppField>
        <template #label>
          <span>Abertura</span>
          <AppFieldHelp title="Abertura" :description="adminQuoteItemFieldHelp.openingSide" />
        </template>
        <AppSelect v-model="item.openingSide">
          <option v-for="option in openingSideOptions" :key="option" :value="option">{{ option }}</option>
        </AppSelect>
      </AppField>

      <AppField>
        <template #label>
          <span>Lado do comando</span>
          <AppFieldHelp title="Lado do comando" :description="adminQuoteItemFieldHelp.controlSide" />
        </template>
        <AppInput v-model="item.controlSide" type="text" placeholder="Direita, esquerda, motorizado..." />
      </AppField>

      <AppField
        v-if="item.installationIncluded === 'SIM'"
        description="Se ficar vazio, o sistema usa a largura do item como metragem de instalação."
      >
        <template #label>
          <span>Metros de instalação</span>
          <AppFieldHelp title="Metros de instalação" :description="adminQuoteItemFieldHelp.installationMeters" />
        </template>
        <AppInput
          :model-value="item.installationMeters"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="3.50"
          @update:model-value="item.installationMeters = parseNullableNumber(String($event ?? ''))"
        />
      </AppField>
    </div>

    <AppField>
      <template #label>
        <span>Observações</span>
        <AppFieldHelp title="Observações" :description="adminQuoteItemFieldHelp.notes" />
      </template>
      <AppInput v-model="item.notes" type="text" placeholder="Recorte, emenda, obstáculo, ponto elétrico..." />
    </AppField>
  </div>
</template>
