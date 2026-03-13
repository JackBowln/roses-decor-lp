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

const props = defineProps<{
  item: QuoteLineItem
  index: number
  disableRemove: boolean
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

const item = toRef(props, 'item')
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

@media (max-width: 1024px) {
  .fields-grid-3,
  .fields-grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .item-card-actions,
  .ghost-button {
    width: 100%;
  }
}
</style>
