<script setup lang="ts">
import { computed } from 'vue'
import { Motion, AnimatePresence } from 'motion-v'
import { ChevronLeft, ChevronRight, Check, Loader2, MessageCircle, Plus } from 'lucide-vue-next'
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
  openWhatsApp,
  prevStep,
  quoteFormOptions,
  removeItem,
  resetForm,
  selectEnvironment,
  selectStep,
  selectType,
  steps,
  submissionResult,
  updateWhatsapp,
} = useQuoteForm()

const environments = [...quoteFormOptions.environments]
const tecidos = [...quoteFormOptions.tecidos]
const blackouts = [...quoteFormOptions.blackouts]
const persianas = [...quoteFormOptions.persianas]

const inputClass =
  'app-control h-12 rounded-field text-base text-foreground placeholder:text-muted/42'

const outlineChoiceClass = (selected: boolean) =>
  selected
    ? 'border-primary/50 bg-primary/10 text-primary-strong shadow-sm'
    : 'border-black/10 hover:border-primary/35 bg-white text-muted'

const filledChoiceClass = (selected: boolean) =>
  selected
    ? 'border-primary bg-primary text-white'
    : 'border-black/10 hover:border-primary/35 bg-white text-muted'

const nextButtonLabel = computed(() => {
  if (currentStep.value === steps.length - 1) {
    return 'Salvar pré-orçamento'
  }

  if (currentStep.value === 4) {
    return 'Tudo pronto'
  }

  return 'Próximo passo'
})
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-8 font-montserrat text-black">
    <div v-if="submissionResult" class="overflow-hidden rounded-card border border-line/15 bg-white px-6 py-6 shadow-card md:px-8 md:py-8">
      <div class="flex flex-col space-y-1.5 text-center">
        <div class="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <Check class="h-8 w-8" />
        </div>
        <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
          Pré-orçamento salvo
        </h3>
        <p class="mt-2 text-sm text-muted/72">
          Código {{ submissionResult.preQuote.code }}. Sua solicitação já entrou na área de gestão da Roses Decor.
        </p>
      </div>

      <div class="mt-8 space-y-3 rounded-[22px] border border-line/20 bg-surface-soft/70 p-5">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="text-muted/68">Cliente</span>
          <strong class="text-foreground">{{ contact.name }}</strong>
        </div>
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="text-muted/68">Localização</span>
          <strong class="text-foreground">{{ contact.location }}</strong>
        </div>
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="text-muted/68">Itens</span>
          <strong class="text-foreground">{{ submissionResult.preQuote.items.length }}</strong>
        </div>
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="text-muted/68">Status</span>
          <strong class="capitalize text-foreground">{{ submissionResult.preQuote.status.replace('_', ' ') }}</strong>
        </div>
      </div>

      <div class="mt-6 grid gap-3 md:grid-cols-2">
        <AppButton type="button" class="bg-[#25D366] text-white hover:bg-[#22c35e]" @click="openWhatsApp">
          <MessageCircle class="h-4 w-4" />
          Falar no WhatsApp
        </AppButton>
        <AppButton type="button" @click="resetForm">
          Fazer novo pré-orçamento
        </AppButton>
      </div>
    </div>

    <template v-else>
      <QuoteFormProgress :steps="steps" :current-step="currentStep" @select="selectStep" />

      <Motion :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5, delay: 0.2 }">
        <div class="overflow-hidden rounded-card border border-line/15 bg-white shadow-card">
          <AnimatePresence mode="wait">
            <Motion :key="currentStep" initial="hidden" animate="visible" exit="exit" :variants="{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
              exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
            }" class="p-6 md:p-8">
              <template v-if="currentStep === 0">
                <div class="flex flex-col space-y-1.5 mb-8 text-center">
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    O que você procura?
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">Escolha o tipo de produto para iniciarmos seu pré-orçamento</p>
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
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    Para qual ambiente?
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">
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
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    Qual a sua preferência de material?
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">
                    Personalize o estilo da sua {{ currentItem.type.toLowerCase() }}
                  </p>
                </div>

                <div v-if="currentItem.type === 'Cortina'" class="space-y-6">
                  <div>
                    <p class="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/80">Tecido principal</p>
                    <div class="grid grid-cols-2 gap-3">
                      <button v-for="fabric in tecidos" :key="fabric" class="py-3 px-2 rounded-lg border flex items-center justify-center transition-all duration-300 font-medium text-sm"
                        :class="filledChoiceClass(currentItem.material === fabric)" @click="currentItem.material = fabric">
                        {{ fabric }}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p class="mt-4 mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/80">
                      Nível de blackout
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
                  <p class="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/80">Modelo de persiana</p>
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
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    Quais as medidas aproximadas?
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">
                    Para uma triagem mais precisa, informe o tamanho aproximado do espaço.
                  </p>
                </div>

                <div class="space-y-6">
                  <Motion :variants="{ hidden: { opacity: 0 }, visible: { opacity: 1 } }"
                    :class="currentItem.dontKnowMeasures ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'">
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <label class="text-sm font-medium text-foreground/80">Largura (m)</label>
                        <input v-model="currentItem.width" type="number" step="0.1" placeholder="Ex: 2.5"
                          :class="inputClass" :disabled="currentItem.dontKnowMeasures" />
                      </div>

                      <div class="space-y-2">
                        <label class="text-sm font-medium text-foreground/80">Altura (m)</label>
                        <input v-model="currentItem.height" type="number" step="0.1" placeholder="Ex: 2.6"
                          :class="inputClass" :disabled="currentItem.dontKnowMeasures" />
                      </div>
                    </div>
                  </Motion>

                  <label
                    class="mt-4 flex cursor-pointer items-center space-x-3 rounded-field border border-black/10 p-4 transition-colors hover:bg-surface-soft/45"
                    :class="currentItem.dontKnowMeasures ? 'border-primary/30 bg-primary/5' : ''">
                    <div class="flex h-5 w-5 items-center justify-center rounded-md border border-black/20"
                      :class="currentItem.dontKnowMeasures ? 'border-primary bg-primary' : 'bg-white'">
                      <Check v-if="currentItem.dontKnowMeasures" class="h-4 w-4 text-white" />
                    </div>
                    <input v-model="currentItem.dontKnowMeasures" type="checkbox" class="hidden" />
                    <span class="text-sm font-medium text-foreground/80">
                      Não sei as medidas exatas
                      <span class="font-normal text-muted/68">(agendaremos uma visita para medição)</span>
                    </span>
                  </label>
                </div>
              </template>

              <template v-else-if="currentStep === 4">
                <div class="flex flex-col space-y-1.5 mb-6">
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    Resumo da solicitação
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">Revise os ambientes antes de salvar o pré-orçamento</p>
                </div>

                <div class="space-y-4">
                  <QuoteSummaryCard v-for="(item, index) in items" :key="`${item.type}-${item.env}-${index}`" :item="item"
                    @remove="removeItem(index)" />

                  <button class="mt-2 flex w-full items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-black/15 py-4 font-medium text-muted transition-all hover:border-primary/35 hover:bg-surface-soft/35 hover:text-foreground"
                    @click="addAnotherRoom">
                    <Plus class="w-4 h-4" />
                    Adicionar outro cômodo
                  </button>
                </div>
              </template>

              <template v-else>
                <div class="flex flex-col space-y-1.5 mb-8 text-center mt-2">
                  <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                    <MessageCircle class="h-8 w-8" />
                  </div>
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    Como podemos te chamar?
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">
                    Salve o seu pré-orçamento agora. O WhatsApp continua disponível como próximo passo opcional.
                  </p>
                </div>

                <div class="space-y-4">
                  <Motion class="space-y-2"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }">
                    <input v-model="contact.name" placeholder="Seu nome completo" :class="inputClass" autocomplete="name" />
                  </Motion>

                  <Motion class="space-y-2"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.05 } } }">
                    <input :value="contact.whatsapp" placeholder="Seu WhatsApp" :class="inputClass" inputmode="tel"
                      autocomplete="tel" @input="updateWhatsapp(($event.target as HTMLInputElement).value)" />
                  </Motion>

                  <Motion class="space-y-2"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } } }">
                    <input v-model="contact.email" placeholder="Seu e-mail (opcional)" :class="inputClass" autocomplete="email" />
                  </Motion>

                  <Motion class="space-y-2"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.15 } } }">
                    <input v-model="contact.location" placeholder="Seu bairro ou cidade" :class="inputClass" />
                  </Motion>
                </div>
              </template>
            </Motion>
          </AnimatePresence>

          <div class="mt-8 flex items-center justify-between border-t border-black/5 bg-surface-soft/35 px-4 py-6 md:px-8">
            <AppButton type="button" class="disabled:pointer-events-none disabled:opacity-0" :disabled="currentStep === 0" @click="prevStep">
              <ChevronLeft class="h-4 w-4" />
              Voltar
            </AppButton>

            <AppButton type="button" variant="primary" :disabled="!isStepValid || isSubmitting"
              @click="currentStep === steps.length - 1 ? finish() : nextStep()">
              <template v-if="isSubmitting">
                <Loader2 class="h-4 w-4 animate-spin" />
                Salvando...
              </template>
              <template v-else>
                {{ nextButtonLabel }}
                <ChevronRight v-if="currentStep !== steps.length - 1" class="h-4 w-4" />
              </template>
            </AppButton>
          </div>
        </div>
      </Motion>
    </template>
  </div>
</template>
