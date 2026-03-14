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
import type { FabricRecord } from '@/lib/quoteWorkspace'

const props = defineProps<{
  item: QuoteLineItem
  index: number
  disableRemove: boolean
  fabrics: FabricRecord[]
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

const addConsumption = () => {
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

  if (typeof balance !== 'number') {
    return 'Sem saldo cadastrado para esta costureira.'
  }

  return `Saldo atual: ${balance.toFixed(2)} m`
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
        <span>Ambiente</span>
        <input v-model="item.room" type="text" placeholder="Sala, suíte, escritório...">
      </label>

      <label class="field">
        <span>Vão / janela</span>
        <input v-model="item.openingLabel" type="text" placeholder="Janela principal, porta balcão...">
      </label>

      <label class="field">
        <span>Categoria</span>
        <select v-model="item.category">
          <option v-for="option in productCategoryOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <div class="fields-grid fields-grid-4">
      <label class="field">
        <span>Largura (m)</span>
        <input :value="item.width ?? ''" type="number" min="0" step="0.01" placeholder="2.40"
          @input="item.width = parseNullableNumber(($event.target as HTMLInputElement).value)">
      </label>

      <label class="field">
        <span>Altura (m)</span>
        <input :value="item.height ?? ''" type="number" min="0" step="0.01" placeholder="2.70"
          @input="item.height = parseNullableNumber(($event.target as HTMLInputElement).value)">
      </label>

      <label class="field">
        <span>Quantidade</span>
        <input v-model.number="item.quantity" type="number" min="1" step="1">
      </label>

      <label class="field">
        <span>Trilho</span>
        <select v-model="item.trackType">
          <option v-for="option in trackTypeOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <div class="fields-grid fields-grid-4">
      <label class="field">
        <span>Suporte parede</span>
        <select v-model="item.wallSupport">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <span>Deslizante</span>
        <select v-model="item.slider">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <span>Terminal</span>
        <select v-model="item.terminal">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <span>Instalação</span>
        <select v-model="item.installationIncluded">
          <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <div class="fields-grid fields-grid-4">
      <label class="field">
        <span>Blackout</span>
        <select v-model="item.blackout">
          <option v-for="option in blackoutOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <span>Tecido</span>
        <select v-model="item.fabric">
          <option v-for="option in fabricOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <span>Cor / coleção</span>
        <input v-model="item.fabricColor" type="text" placeholder="Off white, areia...">
      </label>

      <label class="field">
        <span>Pregas</span>
        <select v-model="item.pleatModel">
          <option v-for="option in pleatOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <div class="fields-grid fields-grid-3">
      <label class="field">
        <span>Fixação</span>
        <select v-model="item.mountType">
          <option v-for="option in mountTypeOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <span>Abertura</span>
        <select v-model="item.openingSide">
          <option v-for="option in openingSideOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="field">
        <span>Lado do comando</span>
        <input v-model="item.controlSide" type="text" placeholder="Direita, esquerda, motorizado...">
      </label>
    </div>

    <div class="fields-grid fields-grid-3">
      <label class="field">
        <span>Preço do produto (R$)</span>
        <input :value="item.unitPrice ?? ''" type="number" min="0" step="0.01" placeholder="0,00"
          @input="item.unitPrice = parseNullableNumber(($event.target as HTMLInputElement).value)">
      </label>

      <label class="field">
        <span>Preço da costura (R$)</span>
        <input :value="item.sewingPrice ?? ''" type="number" min="0" step="0.01" placeholder="0,00"
          @input="item.sewingPrice = parseNullableNumber(($event.target as HTMLInputElement).value)">
      </label>

      <label class="field">
        <span>Preço da instalação (R$)</span>
        <input :value="item.installationPrice ?? ''" type="number" min="0" step="0.01" placeholder="0,00"
          @input="item.installationPrice = parseNullableNumber(($event.target as HTMLInputElement).value)">
      </label>
    </div>

    <label class="field">
      <span>Observações</span>
      <input v-model="item.notes" type="text" placeholder="Recorte, emenda, obstáculo, ponto elétrico...">
    </label>

    <div class="consumption-shell">
      <div class="consumption-head">
        <div>
          <span class="item-card-kicker">Estoque</span>
          <h4>Consumo de tecido por item</h4>
        </div>
        <button type="button" class="ghost-button" @click="addConsumption">Adicionar tecido</button>
      </div>

      <p v-if="!seamstressSelected" class="consumption-empty">
        Selecione a costureira responsável na aba de costura antes de informar o consumo.
      </p>

      <div v-else-if="!item.fabricConsumptions.length" class="consumption-empty">
        Nenhum consumo vinculado a este item.
      </div>

      <div v-else class="consumption-list">
        <div v-for="consumption in item.fabricConsumptions" :key="consumption.id" class="consumption-row">
          <label class="field">
            <span>Tecido do estoque</span>
            <select v-model="consumption.fabricId">
              <option value="">Selecione</option>
              <option v-for="fabric in fabrics" :key="fabric.id" :value="fabric.id">
                {{ [fabric.name, fabric.colorOrCollection].filter(Boolean).join(' • ') }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Consumo (m)</span>
            <input :value="consumption.quantityMeters ?? ''" type="number" min="0" step="0.01" placeholder="8.50"
              @input="consumption.quantityMeters = parseNullableMeters(($event.target as HTMLInputElement).value)">
          </label>

          <div class="consumption-meta">
            <small class="field-hint">{{ getStockHint(consumption.fabricId) || 'Selecione o tecido para consultar saldo.' }}</small>
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

.field span {
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
