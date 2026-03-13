<script setup lang="ts">
import { computed } from 'vue'
import { Motion, AnimatePresence } from 'motion-v'
import { ChevronLeft, ChevronRight, Check, Loader2, Plus } from 'lucide-vue-next'
import QuoteFormProgress from './quote-form/QuoteFormProgress.vue'
import QuoteSummaryCard from './quote-form/QuoteSummaryCard.vue'
import { useQuoteForm } from '@/composables/useQuoteForm'

const {
  addAnotherRoom,
  contact,
  currentItem,
  currentStep,
  finish,
  isStepValid,
  isSubmitting,
  items,
  nextStep,
  prevStep,
  quoteFormOptions,
  removeItem,
  selectEnvironment,
  selectStep,
  selectType,
  steps,
} = useQuoteForm()

const environments = [...quoteFormOptions.environments]
const tecidos = [...quoteFormOptions.tecidos]
const blackouts = [...quoteFormOptions.blackouts]
const persianas = [...quoteFormOptions.persianas]

const inputClass =
  'flex h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] transition-all duration-300'

const outlineChoiceClass = (selected: boolean) =>
  selected
    ? 'border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059]'
    : 'border-gray-200 hover:border-[#C5A059]/50 bg-white text-gray-700'

const filledChoiceClass = (selected: boolean) =>
  selected
    ? 'border-[#C5A059] bg-[#C5A059] text-white'
    : 'border-gray-200 hover:border-[#C5A059]/50 bg-white text-gray-600'

const nextButtonLabel = computed(() => {
  if (currentStep.value === steps.length - 1) {
    return 'Finalizar no WhatsApp'
  }

  if (currentStep.value === 4) {
    return 'Tudo Pronto'
  }

  return 'Próximo Passo'
})
</script>

<template>
  <div class="w-full max-w-2xl mx-auto py-8 text-black font-montserrat">
    <QuoteFormProgress :steps="steps" :current-step="currentStep" @select="selectStep" />

    <Motion :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5, delay: 0.2 }">
      <div class="border border-gray-100 shadow-xl rounded-2xl overflow-hidden bg-white">
        <AnimatePresence mode="wait">
          <Motion :key="currentStep" initial="hidden" animate="visible" exit="exit" :variants="{
            hidden: { opacity: 0, x: 20 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
            exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
          }" class="p-6 md:p-8">
            <template v-if="currentStep === 0">
              <div class="flex flex-col space-y-1.5 mb-8 text-center">
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">
                  O que você procura?
                </h3>
                <p class="text-sm text-gray-500 mt-2">Escolha o tipo de produto para iniciarmos seu orçamento</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Motion class="space-y-2"
                  :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }">
                  <button class="w-full h-32 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300"
                    :class="outlineChoiceClass(currentItem.type === 'Cortina')" @click="selectType('Cortina')">
                    <span class="font-medium text-lg">Cortina</span>
                  </button>
                </Motion>

                <Motion class="space-y-2"
                  :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } } }">
                  <button class="w-full h-32 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300"
                    :class="outlineChoiceClass(currentItem.type === 'Persiana')" @click="selectType('Persiana')">
                    <span class="font-medium text-lg">Persiana</span>
                  </button>
                </Motion>
              </div>
            </template>

            <template v-else-if="currentStep === 1">
              <div class="flex flex-col space-y-1.5 mb-8 text-center">
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">
                  Para qual ambiente?
                </h3>
                <p class="text-sm text-gray-500 mt-2">
                  Onde a sua nova {{ currentItem.type.toLowerCase() }} será instalada?
                </p>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Motion v-for="(environment, index) in environments" :key="environment"
                  :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: index * 0.05 } } }">
                  <button class="w-full py-4 px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300"
                    :class="outlineChoiceClass(currentItem.env === environment)" @click="selectEnvironment(environment)">
                    <span class="font-medium">{{ environment }}</span>
                  </button>
                </Motion>
              </div>
            </template>

            <template v-else-if="currentStep === 2">
              <div class="flex flex-col space-y-1.5 mb-8 text-center">
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">
                  Qual a sua preferência de material?
                </h3>
                <p class="text-sm text-gray-500 mt-2">
                  Personalize o estilo da sua {{ currentItem.type.toLowerCase() }}
                </p>
              </div>

              <div v-if="currentItem.type === 'Cortina'" class="space-y-6">
                <div>
                  <p class="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wider">Tecido Principal</p>
                  <div class="grid grid-cols-2 gap-3">
                    <button v-for="fabric in tecidos" :key="fabric" class="py-3 px-2 rounded-lg border flex items-center justify-center transition-all duration-300 font-medium text-sm"
                      :class="filledChoiceClass(currentItem.material === fabric)" @click="currentItem.material = fabric">
                      {{ fabric }}
                    </button>
                  </div>
                </div>

                <div>
                  <p class="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wider mt-4">
                    Nível de Blackout
                  </p>
                  <div class="grid grid-cols-3 gap-3">
                    <button v-for="blackout in blackouts" :key="blackout"
                      class="py-3 px-2 rounded-lg border flex items-center justify-center transition-all duration-300 font-medium text-sm"
                      :class="filledChoiceClass(currentItem.blackout === blackout)" @click="currentItem.blackout = blackout">
                      {{ blackout }}
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="space-y-4">
                <p class="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wider">Modelo de Persiana</p>
                <div class="grid grid-cols-2 gap-3">
                  <button v-for="blind in persianas" :key="blind"
                    class="py-4 px-2 rounded-xl border-2 flex items-center justify-center transition-all duration-300 font-medium text-sm"
                    :class="outlineChoiceClass(currentItem.material === blind)" @click="currentItem.material = blind">
                    {{ blind }}
                  </button>
                </div>
              </div>
            </template>

            <template v-else-if="currentStep === 3">
              <div class="flex flex-col space-y-1.5 mb-8 text-center">
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">
                  Quais as medidas aproximadas?
                </h3>
                <p class="text-sm text-gray-500 mt-2">
                  Para um orçamento mais preciso, nos informe o tamanho do espaço
                </p>
              </div>

              <div class="space-y-6">
                <Motion :variants="{ hidden: { opacity: 0 }, visible: { opacity: 1 } }"
                  :class="currentItem.dontKnowMeasures ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label class="text-sm font-medium text-gray-700">Largura (m)</label>
                      <input v-model="currentItem.width" type="number" step="0.1" placeholder="Ex: 2.5"
                        :class="inputClass" :disabled="currentItem.dontKnowMeasures" />
                    </div>

                    <div class="space-y-2">
                      <label class="text-sm font-medium text-gray-700">Altura (m)</label>
                      <input v-model="currentItem.height" type="number" step="0.1" placeholder="Ex: 2.6"
                        :class="inputClass" :disabled="currentItem.dontKnowMeasures" />
                    </div>
                  </div>
                </Motion>

                <label
                  class="flex items-center space-x-3 cursor-pointer mt-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  :class="currentItem.dontKnowMeasures ? 'bg-[#C5A059]/5 border-[#C5A059]/30' : ''">
                  <div class="flex items-center justify-center w-5 h-5 rounded-md border border-gray-300"
                    :class="currentItem.dontKnowMeasures ? 'bg-[#C5A059] border-[#C5A059]' : 'bg-white'">
                    <Check v-if="currentItem.dontKnowMeasures" class="h-4 w-4 text-white" />
                  </div>
                  <input v-model="currentItem.dontKnowMeasures" type="checkbox" class="hidden" />
                  <span class="text-sm font-medium text-gray-700">
                    Não sei as medidas exatas
                    <span class="font-normal text-gray-500">(Agendaremos uma visita para medição)</span>
                  </span>
                </label>
              </div>
            </template>

            <template v-else-if="currentStep === 4">
              <div class="flex flex-col space-y-1.5 mb-6">
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">
                  Resumo do seu Pedido
                </h3>
                <p class="text-sm text-gray-500 mt-2">Verifique os itens antes de prosseguir</p>
              </div>

              <div class="space-y-4">
                <QuoteSummaryCard v-for="(item, index) in items" :key="`${item.type}-${item.env}-${index}`" :item="item"
                  @remove="removeItem(index)" />

                <button class="w-full flex items-center justify-center gap-2 py-4 mt-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all font-medium"
                  @click="addAnotherRoom">
                  <Plus class="w-4 h-4" />
                  Adicionar outro cômodo
                </button>
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col space-y-1.5 mb-8 text-center mt-2">
                <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-message-circle">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                  </svg>
                </div>
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">
                  Como podemos te chamar?
                </h3>
                <p class="text-sm text-gray-500 mt-2">
                  Insira seus dados para enviarmos a solicitação direto para a nossa equipe no WhatsApp.
                </p>
              </div>

              <div class="space-y-4">
                <Motion class="space-y-2"
                  :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }">
                  <input v-model="contact.name" placeholder="Seu Nome Completo" :class="inputClass" />
                </Motion>

                <Motion class="space-y-2"
                  :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } } }">
                  <input v-model="contact.location" placeholder="Seu Bairro ou Cidade" :class="inputClass" />
                </Motion>
              </div>
            </template>
          </Motion>
        </AnimatePresence>

        <div class="flex items-center justify-between p-6 px-4 md:px-8 border-t border-gray-100 bg-gray-50 mt-8">
          <button type="button" class="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none h-11 px-5 py-2 border border-gray-200 hover:bg-gray-100 gap-2 text-gray-700 bg-white shadow-sm"
            :disabled="currentStep === 0" @click="prevStep">
            <ChevronLeft class="h-4 w-4" />
            Voltar
          </button>

          <button type="button" class="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-6 py-2 bg-[#C5A059] text-white hover:bg-[#b5952f] gap-2 shadow-md hover:shadow-lg"
            :class="currentStep === steps.length - 1 ? 'bg-green-600 hover:bg-green-700 ring-4 ring-green-600/20 w-auto' : ''"
            :disabled="!isStepValid || isSubmitting" @click="currentStep === steps.length - 1 ? finish() : nextStep()">
            <template v-if="isSubmitting">
              <Loader2 class="h-4 w-4 animate-spin" />
              Processando...
            </template>
            <template v-else>
              {{ nextButtonLabel }}
              <ChevronRight v-if="currentStep !== steps.length - 1" class="h-4 w-4" />
            </template>
          </button>
        </div>
      </div>
    </Motion>
  </div>
</template>
