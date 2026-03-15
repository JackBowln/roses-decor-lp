<script setup lang="ts">
import {
  blackoutOptions,
  createEmptyItemFabricConsumption,
  fabricOptions,
  mountTypeOptions,
  openingSideOptions,
  pleatOptions,
  productCategoryOptions,
  trackTypeOptions,
  yesNoOptions,
  type QuoteLineItem,
} from '@/lib/adminQuote'
import { resolveFabricConsumptionMeters } from '@/lib/adminQuoteManagement'
import type { FabricRecord } from '@/lib/quoteWorkspace'

const props = defineProps<{
  item: QuoteLineItem
  index: number
  disableRemove: boolean
  fabrics: FabricRecord[]
  fabricPriceById: Record<string, number>
  stockByFabricId: Record<string, number>
  seamstressSelected: boolean
}>()

defineEmits<{
  (event: 'duplicate'): void
  (event: 'remove'): void
}>()

const parseNullableNumber = (value: string) => {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseNullableMeters = (value: string) => {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

const item = toRef(props, 'item')

const canManageFabricConsumptions = computed(() => props.seamstressSelected && props.fabrics.length > 0)

const fabricConsumptionDisabledReason = computed(() => {
  if (!props.seamstressSelected) {
    return 'Selecione a costureira responsável antes de vincular tecido de estoque.'
  }

  if (!props.fabrics.length) {
    return 'Cadastre ou ative um tecido no estoque antes de informar consumo.'
  }

  return ''
})

const fieldHelp = {
  room: 'Nome interno do ambiente que vai aparecer no orçamento e nos pedidos operacionais.',
  openingLabel: 'Identificação do vão, janela ou porta onde a peça será instalada.',
  category: 'Categoria principal do produto para orientar descrição técnica, PDF e operação.',
  width: 'Largura final estimada da peça ou do vão em metros.',
  height: 'Altura final estimada da peça ou do vão em metros.',
  quantity: 'Quantidade de peças iguais dentro deste mesmo item.',
  trackType: 'Tipo de trilho ou ferragem principal usado no ambiente.',
  wallSupport: 'Indica se haverá suporte de parede no conjunto.',
  slider: 'Define se o item utiliza deslizante na operação do trilho.',
  terminal: 'Define se o item leva terminal no acabamento da ferragem.',
  installationIncluded: 'Controla se o item entra na ficha de instalação e nos cálculos operacionais.',
  blackout: 'Nível de blackout pretendido para o conjunto.',
  customerFabric: 'Referência comercial escolhida pelo cliente no pré-orçamento ou na venda. Não movimenta estoque.',
  fabricColor: 'Cor, coleção ou observação comercial do tecido apresentado ao cliente.',
  pleatModel: 'Modelo de prega ou acabamento principal da cortina.',
  mountType: 'Forma de fixação do item: teto, parede ou vão.',
  openingSide: 'Sentido de abertura da peça ou configuração do recolhimento.',
  controlSide: 'Lado do comando, recolhimento ou observação operacional do acionamento.',
  installationMeters: 'Metragem efetiva usada para instalação. Se ficar vazio, o sistema usa a largura do item.',
  unitPrice: 'Valor do material. Pode ser manual ou calculado automaticamente a partir do tecido de estoque.',
  sewingPrice: 'Custo ou repasse de costura deste item.',
  installationPrice: 'Custo ou repasse de instalação deste item.',
  notes: 'Observações técnicas ou de obra que precisam acompanhar o item.',
  stockSection: 'Área operacional para vincular o tecido físico usado pela costureira e dar baixa no estoque.',
  stockFabric: 'Tecido real separado no estoque da costureira para este item.',
  stockConsumption: 'Quantidade em metros consumida desse tecido no item.',
} as const

const hasAutomaticMaterialPrice = computed(() =>
  (item.value.fabricConsumptions || []).some((consumption) => {
    const quantityMeters = resolveFabricConsumptionMeters(item.value, consumption)
    return Boolean(consumption.fabricId)
      && typeof props.fabricPriceById[consumption.fabricId] === 'number'
      && props.fabricPriceById[consumption.fabricId] > 0
      && quantityMeters !== null
      && quantityMeters > 0
  }))

const addConsumption = () => {
  if (!canManageFabricConsumptions.value) {
    return
  }

  item.value.fabricConsumptions = [...(item.value.fabricConsumptions || []), createEmptyItemFabricConsumption()]
}

const removeConsumption = (id: string) => {
  item.value.fabricConsumptions = (item.value.fabricConsumptions || []).filter((consumption) => consumption.id !== id)
}

const getStockHint = (fabricId: string) => {
  if (!fabricId) {
    return ''
  }

  const balance = props.stockByFabricId[fabricId]
  const pricePerMeter = props.fabricPriceById[fabricId]
  const details = []

  if (typeof balance === 'number') {
    details.push(`Saldo atual: ${balance.toFixed(2)} m`)
  }
  else {
    details.push('Sem saldo cadastrado para esta costureira.')
  }

  if (typeof pricePerMeter === 'number') {
    details.push(`R$ ${pricePerMeter.toFixed(2)}/m`)
  }

  return details.join(' • ')
}

const getConsumptionHint = (consumption: QuoteLineItem['fabricConsumptions'][number]) => {
  const stockHint = getStockHint(consumption.fabricId)

  if (!consumption.fabricId) {
    return stockHint || 'Selecione o tecido para consultar saldo.'
  }

  const explicitMeters = parseNullableMeters(String(consumption.quantityMeters ?? '').trim())

  if (explicitMeters && explicitMeters > 0) {
    return stockHint
  }

  const estimatedMeters = resolveFabricConsumptionMeters(item.value, consumption)

  if (!estimatedMeters || estimatedMeters <= 0) {
    return stockHint || 'Informe a metragem consumida para calcular o material.'
  }

  const estimatedLabel = `Estimativa automática: ${estimatedMeters.toFixed(2)} m pela largura x quantidade do item.`
  return stockHint ? `${stockHint} • ${estimatedLabel}` : estimatedLabel
}
</script>

<template>
  <article class="item-card">
    <div class="item-card-head">
      <div>
        <span class="item-card-kicker">Ambiente {{ index + 1 }}</span>
        <h3>{{ item.room || item.openingLabel || 'Novo ambiente' }}</h3>
      </div>

      <div class="item-card-actions">
        <button type="button" class="ghost-button" @click="$emit('duplicate')">Duplicar</button>
        <button type="button" class="ghost-button ghost-button-danger" :disabled="disableRemove" @click="$emit('remove')">
          Remover
        </button>
      </div>
    </div>

    <div class="fields-grid fields-grid-3">
      <label class="field">
        <div class="field-label">
          <span>Ambiente</span>
          <AppFieldHelp title="Ambiente" :description="fieldHelp.room" />
        </div>
        <input v-model="item.room" type="text" placeholder="Sala, suíte, escritório...">
      </label>

      <label class="field">
        <div class="field-label">
          <span>Vão / janela</span>
          <AppFieldHelp title="Vão / janela" :description="fieldHelp.openingLabel" />
        </div>
        <input v-model="item.openingLabel" type="text" placeholder="Janela principal, porta balcão...">
      </label>

      <label class="field">
        <div class="field-label">
          <span>Categoria</span>
          <AppFieldHelp title="Categoria" :description="fieldHelp.category" />
        </div>
        <select v-model="item.category">
          <option v-for="option in productCategoryOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <div class="fields-grid fields-grid-4">
      <label class="field">
        <div class="field-label">
          <span>Largura (m)</span>
          <AppFieldHelp title="Largura" :description="fieldHelp.width" />
        </div>
        <input :value="item.width ?? ''" type="number" min="0" step="0.01" placeholder="2.40"
          @input="item.width = parseNullableNumber(($event.target as HTMLInputElement).value)">
      </label>

      <label class="field">
        <div class="field-label">
          <span>Altura (m)</span>
          <AppFieldHelp title="Altura" :description="fieldHelp.height" />
        </div>
        <input :value="item.height ?? ''" type="number" min="0" step="0.01" placeholder="2.70"
          @input="item.height = parseNullableNumber(($event.target as HTMLInputElement).value)">
      </label>

      <label class="field">
        <div class="field-label">
          <span>Quantidade</span>
          <AppFieldHelp title="Quantidade" :description="fieldHelp.quantity" />
        </div>
        <input v-model.number="item.quantity" type="number" min="1" step="1">
      </label>

      <label class="field">
        <div class="field-label">
          <span>Trilho</span>
          <AppFieldHelp title="Trilho" :description="fieldHelp.trackType" />
        </div>
        <select v-model="item.trackType">
          <option v-for="option in trackTypeOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <div class="fields-grid fields-grid-4">
      <label class="field">
        <div class="field-label">
          <span>Suporte parede</span>
          <AppFieldHelp title="Suporte parede" :description="fieldHelp.wallSupport" />
        </div>
        <select v-model="item.wallSupport">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <div class="field-label">
          <span>Deslizante</span>
          <AppFieldHelp title="Deslizante" :description="fieldHelp.slider" />
        </div>
        <select v-model="item.slider">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <div class="field-label">
          <span>Terminal</span>
          <AppFieldHelp title="Terminal" :description="fieldHelp.terminal" />
        </div>
        <select v-model="item.terminal">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <div class="field-label">
          <span>Instalação</span>
          <AppFieldHelp title="Instalação" :description="fieldHelp.installationIncluded" />
        </div>
        <select v-model="item.installationIncluded">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <div class="fields-grid fields-grid-4">
      <label class="field">
        <div class="field-label">
          <span>Blackout</span>
          <AppFieldHelp title="Blackout" :description="fieldHelp.blackout" />
        </div>
        <select v-model="item.blackout">
          <option v-for="option in blackoutOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <div class="field-label">
          <span>Tecido escolhido pelo cliente</span>
          <AppFieldHelp title="Tecido do cliente" :description="fieldHelp.customerFabric" />
        </div>
        <select v-model="item.fabric">
          <option v-for="option in fabricOptions" :key="option" :value="option">{{ option }}</option>
        </select>
        <small class="field-hint">
          Referência comercial do pré-orçamento ou da venda. Não baixa estoque.
        </small>
      </label>

      <label class="field">
        <div class="field-label">
          <span>Cor / coleção</span>
          <AppFieldHelp title="Cor / coleção" :description="fieldHelp.fabricColor" />
        </div>
        <input v-model="item.fabricColor" type="text" placeholder="Off white, areia...">
      </label>

      <label class="field">
        <div class="field-label">
          <span>Pregas</span>
          <AppFieldHelp title="Pregas" :description="fieldHelp.pleatModel" />
        </div>
        <select v-model="item.pleatModel">
          <option v-for="option in pleatOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <div class="fields-grid fields-grid-3">
      <label class="field">
        <div class="field-label">
          <span>Fixação</span>
          <AppFieldHelp title="Fixação" :description="fieldHelp.mountType" />
        </div>
        <select v-model="item.mountType">
          <option v-for="option in mountTypeOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <div class="field-label">
          <span>Abertura</span>
          <AppFieldHelp title="Abertura" :description="fieldHelp.openingSide" />
        </div>
        <select v-model="item.openingSide">
          <option v-for="option in openingSideOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <div class="field-label">
          <span>Lado do comando</span>
          <AppFieldHelp title="Lado do comando" :description="fieldHelp.controlSide" />
        </div>
        <input v-model="item.controlSide" type="text" placeholder="Direita, esquerda, motorizado...">
      </label>

      <label v-if="item.installationIncluded === 'SIM'" class="field">
        <div class="field-label">
          <span>Metros de instalação</span>
          <AppFieldHelp title="Metros de instalação" :description="fieldHelp.installationMeters" />
        </div>
        <input :value="item.installationMeters ?? ''" type="number" min="0.01" step="0.01" placeholder="3.50"
          @input="item.installationMeters = parseNullableNumber(($event.target as HTMLInputElement).value)">
        <small class="field-hint">Se ficar vazio, o sistema usa a largura do item como metragem de instalação.</small>
      </label>
    </div>

    <div class="fields-grid fields-grid-3">
      <label class="field">
        <div class="field-label">
          <span>Preço do material (R$)</span>
          <AppFieldHelp title="Preço do material" :description="fieldHelp.unitPrice" />
        </div>
        <input :value="item.unitPrice ?? ''" type="number" min="0" step="0.01" placeholder="0,00"
          :readonly="hasAutomaticMaterialPrice"
          @input="item.unitPrice = parseNullableNumber(($event.target as HTMLInputElement).value)">
        <small class="field-hint">
          {{ hasAutomaticMaterialPrice ? 'Calculado automaticamente pelos tecidos consumidos. Sem metragem informada, usa largura x quantidade como estimativa.' : 'Pode ser preenchido manualmente quando nao houver tecido precificado.' }}
        </small>
      </label>

      <label class="field">
        <div class="field-label">
          <span>Preço da costura (R$)</span>
          <AppFieldHelp title="Preço da costura" :description="fieldHelp.sewingPrice" />
        </div>
        <input :value="item.sewingPrice ?? ''" type="number" min="0" step="0.01" placeholder="0,00"
          @input="item.sewingPrice = parseNullableNumber(($event.target as HTMLInputElement).value)">
      </label>

      <label class="field">
        <div class="field-label">
          <span>Preço da instalação (R$)</span>
          <AppFieldHelp title="Preço da instalação" :description="fieldHelp.installationPrice" />
        </div>
        <input :value="item.installationPrice ?? ''" type="number" min="0" step="0.01" placeholder="0,00"
          @input="item.installationPrice = parseNullableNumber(($event.target as HTMLInputElement).value)">
      </label>
    </div>

    <label class="field">
      <div class="field-label">
        <span>Observações</span>
        <AppFieldHelp title="Observações" :description="fieldHelp.notes" />
      </div>
      <input v-model="item.notes" type="text" placeholder="Recorte, emenda, obstáculo, ponto elétrico...">
    </label>

    <div class="consumption-shell">
      <div class="consumption-head">
        <div>
          <div class="field-label field-label-inline">
            <span class="item-card-kicker">Estoque da costureira</span>
            <AppFieldHelp title="Baixa de estoque" :description="fieldHelp.stockSection" />
          </div>
          <h4>Tecido real para baixa de estoque</h4>
          <p class="consumption-intro">
            Use aqui o tecido físico separado no estoque. Esse vínculo é o que movimenta saldo e calcula o material automaticamente.
          </p>
        </div>
        <button type="button" class="ghost-button" :disabled="!canManageFabricConsumptions" @click="addConsumption">
          Adicionar tecido
        </button>
      </div>

      <p v-if="fabricConsumptionDisabledReason" class="consumption-empty">
        {{ fabricConsumptionDisabledReason }}
      </p>

      <div v-else-if="!item.fabricConsumptions.length" class="consumption-empty">
        Nenhum consumo vinculado a este item.
      </div>

      <div v-else class="consumption-list">
        <div v-for="consumption in item.fabricConsumptions" :key="consumption.id" class="consumption-row">
          <label class="field">
            <div class="field-label">
              <span>Tecido do estoque da costureira</span>
              <AppFieldHelp title="Tecido de estoque" :description="fieldHelp.stockFabric" />
            </div>
            <select v-model="consumption.fabricId">
              <option value="">Selecione</option>
              <option v-for="fabric in fabrics" :key="fabric.id" :value="fabric.id">
                {{ [fabric.name, fabric.colorOrCollection, `R$ ${fabric.pricePerMeter.toFixed(2)}/m`].filter(Boolean).join(' • ') }}
              </option>
            </select>
          </label>

          <label class="field">
            <div class="field-label">
              <span>Consumo (m)</span>
              <AppFieldHelp title="Consumo" :description="fieldHelp.stockConsumption" />
            </div>
            <input :value="consumption.quantityMeters ?? ''" type="number" min="0" step="0.01" placeholder="8.50"
              @input="consumption.quantityMeters = parseNullableMeters(($event.target as HTMLInputElement).value)">
          </label>

          <div class="consumption-meta">
            <small class="field-hint">{{ getConsumptionHint(consumption) }}</small>
            <button type="button" class="ghost-button ghost-button-danger" @click="removeConsumption(consumption.id)">
              Remover tecido
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.item-card {
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(197, 160, 89, 0.16);
  box-shadow: 0 18px 44px rgba(22, 22, 22, 0.08);
}

.item-card-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 22px;
}

.item-card-head h3 {
  font-size: 1.5rem;
  color: var(--text-dark);
}

.item-card-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  color: rgba(120, 84, 28, 0.92);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.item-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ghost-button {
  border: 1px solid rgba(26, 26, 26, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  color: var(--text-dark);
  padding: 10px 16px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.ghost-button-danger {
  color: #8d2c1f;
  border-color: rgba(141, 44, 31, 0.16);
}

.ghost-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fields-grid {
  display: grid;
  gap: 14px;
  margin-bottom: 14px;
}

.fields-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.fields-grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 8px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
}

.field-label-inline {
  justify-content: flex-start;
}

.field-label > span {
  color: rgba(26, 26, 26, 0.82);
  font-size: 0.84rem;
  font-weight: 700;
}

.field input,
.field select {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-dark);
  font: inherit;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: rgba(197, 160, 89, 0.62);
  box-shadow: 0 0 0 4px rgba(197, 160, 89, 0.12);
}

.field input[readonly] {
  background: rgba(247, 239, 226, 0.72);
  cursor: default;
}

.consumption-shell {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(247, 239, 226, 0.56);
  border: 1px solid rgba(197, 160, 89, 0.16);
}

.consumption-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.consumption-head h4 {
  color: var(--text-dark);
  font-size: 1.02rem;
}

.consumption-intro {
  margin-top: 6px;
  color: rgba(61, 61, 61, 0.78);
  font-size: 0.88rem;
  line-height: 1.45;
}

.consumption-empty {
  color: rgba(61, 61, 61, 0.76);
  font-size: 0.92rem;
}

.consumption-list {
  display: grid;
  gap: 12px;
}

.consumption-row {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1.2fr) minmax(180px, 0.55fr) minmax(200px, 0.65fr);
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
}

.consumption-meta {
  display: grid;
  align-content: center;
  gap: 10px;
}

.field-hint {
  color: rgba(61, 61, 61, 0.72);
  font-size: 0.82rem;
}

@media (max-width: 1024px) {
  .fields-grid-3,
  .fields-grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .consumption-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 720px) {
  .item-card {
    padding: 18px;
    border-radius: 24px;
  }

  .item-card-head {
    flex-direction: column;
    margin-bottom: 18px;
  }

  .fields-grid-3,
  .fields-grid-4 {
    grid-template-columns: 1fr;
  }

  .consumption-head,
  .consumption-row {
    grid-template-columns: 1fr;
  }

  .consumption-head {
    display: grid;
  }

  .item-card-actions,
  .ghost-button {
    width: 100%;
  }
}
</style>
