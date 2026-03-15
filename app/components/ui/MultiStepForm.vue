<script setup lang="ts">
import { computed } from 'vue'
import { Motion, AnimatePresence } from 'motion-v'
import { ChevronLeft, ChevronRight, Check, Loader2, MessageCircle, Plus } from 'lucide-vue-next'
import QuoteFormProgress from './quote-form/QuoteFormProgress.vue'
import QuoteSummaryCard from './quote-form/QuoteSummaryCard.vue'
import { publicQuoteFlowConfig } from '@/lib/publicQuoteConfig'
import { useQuoteForm } from '@/composables/useQuoteForm'

const {
  addAnotherRoom,
  contact,
  currentItem,
  currentStep,
  currentStepId,
  finish,
  formatPublicQuoteStatusLabel,
  isStepValid,
  isSubmitting,
  items,
  nextButtonLabel,
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
  successDescription,
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

const currentStepContent = computed(() => publicQuoteFlowConfig.steps[currentStepId.value])
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-8 font-montserrat text-black">
    <div v-if="submissionResult" class="overflow-hidden rounded-card border border-line/15 bg-white px-6 py-6 shadow-card md:px-8 md:py-8">
      <div class="flex flex-col space-y-1.5 text-center">
        <div class="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <Check class="h-8 w-8" />
        </div>
        <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
          {{ publicQuoteFlowConfig.success.title }}
        </h3>
        <p class="mt-2 text-sm text-muted/72">
          {{ successDescription }}
        </p>
      </div>

      <div class="mt-8 space-y-3 rounded-[22px] border border-line/20 bg-surface-soft/70 p-5">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="text-muted/68">{{ publicQuoteFlowConfig.success.summaryLabels.customer }}</span>
          <strong class="text-foreground">{{ contact.name }}</strong>
        </div>
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="text-muted/68">{{ publicQuoteFlowConfig.success.summaryLabels.location }}</span>
          <strong class="text-foreground">{{ contact.location }}</strong>
        </div>
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="text-muted/68">{{ publicQuoteFlowConfig.success.summaryLabels.items }}</span>
          <strong class="text-foreground">{{ submissionResult.preQuote.items.length }}</strong>
        </div>
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="text-muted/68">{{ publicQuoteFlowConfig.success.summaryLabels.status }}</span>
          <strong class="capitalize text-foreground">{{ formatPublicQuoteStatusLabel(submissionResult.preQuote.status) }}</strong>
        </div>
      </div>

      <div class="mt-6 grid gap-3 md:grid-cols-2">
        <AppButton type="button" class="bg-[#25D366] text-white hover:bg-[#22c35e]" @click="openWhatsApp">
          <MessageCircle class="h-4 w-4" />
          {{ publicQuoteFlowConfig.success.whatsappActionLabel }}
        </AppButton>
        <AppButton type="button" @click="resetForm">
          {{ publicQuoteFlowConfig.success.resetActionLabel }}
        </AppButton>
      </div>
    </div>

    <template v-else>
      <QuoteFormProgress :steps="steps" :current-step="currentStep" @select="selectStep" />

      <Motion :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5, delay: 0.2 }">
        <div class="overflow-hidden rounded-card border border-line/15 bg-white shadow-card">
          <AnimatePresence mode="wait">
            <Motion :key="currentStepId" initial="hidden" animate="visible" exit="exit" :variants="{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
              exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
            }" class="p-6 md:p-8">
              <template v-if="currentStepId === 'produto'">
                <div class="mb-8 flex flex-col space-y-1.5 text-center">
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    {{ currentStepContent.heading }}
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">{{ currentStepContent.description }}</p>
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Motion class="space-y-2"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }">
                    <button class="flex h-32 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all duration-300"
                      :class="outlineChoiceClass(currentItem.type === 'Cortina')" @click="selectType('Cortina')">
                      <span class="text-lg font-medium">Cortina</span>
                    </button>
                  </Motion>

                  <Motion class="space-y-2"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } } }">
                    <button class="flex h-32 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all duration-300"
                      :class="outlineChoiceClass(currentItem.type === 'Persiana')" @click="selectType('Persiana')">
                      <span class="text-lg font-medium">Persiana</span>
                    </button>
                  </Motion>
                </div>
              </template>

              <template v-else-if="currentStepId === 'ambiente'">
                <div class="mb-8 flex flex-col space-y-1.5 text-center">
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    {{ currentStepContent.heading }}
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">
                    {{ currentStepContent.descriptionPrefix }} {{ currentItem.type.toLowerCase() }} {{ currentStepContent.descriptionSuffix }}
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <Motion v-for="(environment, index) in environments" :key="environment"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: index * 0.05 } } }">
                    <button class="flex w-full flex-col items-center justify-center rounded-xl border-2 px-2 py-4 transition-all duration-300"
                      :class="outlineChoiceClass(currentItem.env === environment)" @click="selectEnvironment(environment)">
                      <span class="font-medium">{{ environment }}</span>
                    </button>
                  </Motion>
                </div>
              </template>

              <template v-else-if="currentStepId === 'material'">
                <div class="mb-8 flex flex-col space-y-1.5 text-center">
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    {{ currentStepContent.heading }}
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">
                    {{ currentStepContent.descriptionPrefix }} {{ currentItem.type.toLowerCase() }}
                  </p>
                </div>

                <div v-if="currentItem.type === 'Cortina'" class="space-y-6">
                  <div>
                    <p class="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/80">{{ currentStepContent.curtainLabel }}</p>
                    <div class="grid grid-cols-2 gap-3">
                      <button v-for="fabric in tecidos" :key="fabric" class="flex items-center justify-center rounded-lg border px-2 py-3 text-sm font-medium transition-all duration-300"
                        :class="filledChoiceClass(currentItem.material === fabric)" @click="currentItem.material = fabric">
                        {{ fabric }}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p class="mt-4 mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/80">
                      {{ currentStepContent.blackoutLabel }}
                    </p>
                    <div class="grid grid-cols-3 gap-3">
                      <button v-for="blackout in blackouts" :key="blackout"
                        class="flex items-center justify-center rounded-lg border px-2 py-3 text-sm font-medium transition-all duration-300"
                        :class="filledChoiceClass(currentItem.blackout === blackout)" @click="currentItem.blackout = blackout">
                        {{ blackout }}
                      </button>
                    </div>
                  </div>
                </div>

                <div v-else class="space-y-4">
                  <p class="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/80">{{ currentStepContent.blindLabel }}</p>
                  <div class="grid grid-cols-2 gap-3">
                    <button v-for="blind in persianas" :key="blind"
                      class="flex items-center justify-center rounded-xl border-2 px-2 py-4 text-sm font-medium transition-all duration-300"
                      :class="outlineChoiceClass(currentItem.material === blind)" @click="currentItem.material = blind">
                      {{ blind }}
                    </button>
                  </div>
                </div>
              </template>

              <template v-else-if="currentStepId === 'medidas'">
                <div class="mb-8 flex flex-col space-y-1.5 text-center">
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    {{ currentStepContent.heading }}
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">
                    {{ currentStepContent.description }}
                  </p>
                </div>

                <div class="space-y-6">
                  <Motion :variants="{ hidden: { opacity: 0 }, visible: { opacity: 1 } }"
                    :class="currentItem.dontKnowMeasures ? 'pointer-events-none opacity-50 transition-opacity' : 'transition-opacity'">
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <label class="text-sm font-medium text-foreground/80">{{ currentStepContent.widthLabel }}</label>
                        <input v-model="currentItem.width" type="number" step="0.1" :placeholder="currentStepContent.widthPlaceholder"
                          :class="inputClass" :disabled="currentItem.dontKnowMeasures" />
                      </div>

                      <div class="space-y-2">
                        <label class="text-sm font-medium text-foreground/80">{{ currentStepContent.heightLabel }}</label>
                        <input v-model="currentItem.height" type="number" step="0.1" :placeholder="currentStepContent.heightPlaceholder"
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
                      {{ currentStepContent.unknownMeasuresLabel }}
                      <span class="font-normal text-muted/68">{{ currentStepContent.unknownMeasuresHint }}</span>
                    </span>
                  </label>
                </div>
              </template>

              <template v-else-if="currentStepId === 'resumo'">
                <div class="mb-6 flex flex-col space-y-1.5">
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    {{ currentStepContent.heading }}
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">{{ currentStepContent.description }}</p>
                </div>

                <div class="space-y-4">
                  <QuoteSummaryCard v-for="(item, index) in items" :key="`${item.type}-${item.env}-${index}`" :item="item"
                    @remove="removeItem(index)" />

                  <button class="mt-2 flex w-full items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-black/15 py-4 font-medium text-muted transition-all hover:border-primary/35 hover:bg-surface-soft/35 hover:text-foreground"
                    @click="addAnotherRoom">
                    <Plus class="h-4 w-4" />
                    {{ publicQuoteFlowConfig.actions.addRoom }}
                  </button>
                </div>
              </template>

              <template v-else>
                <div class="mt-2 mb-8 flex flex-col space-y-1.5 text-center">
                  <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                    <MessageCircle class="h-8 w-8" />
                  </div>
                  <h3 class="font-playfair text-3xl font-semibold leading-none tracking-tight text-foreground">
                    {{ currentStepContent.heading }}
                  </h3>
                  <p class="mt-2 text-sm text-muted/72">
                    {{ currentStepContent.description }}
                  </p>
                </div>

                <div class="space-y-4">
                  <Motion class="space-y-2"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }">
                    <input v-model="contact.name" :placeholder="currentStepContent.namePlaceholder" :class="inputClass" autocomplete="name" />
                  </Motion>

                  <Motion class="space-y-2"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.05 } } }">
                    <input :value="contact.whatsapp" :placeholder="currentStepContent.whatsappPlaceholder" :class="inputClass" inputmode="tel"
                      autocomplete="tel" @input="updateWhatsapp(($event.target as HTMLInputElement).value)" />
                  </Motion>

                  <Motion class="space-y-2"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } } }">
                    <input v-model="contact.email" :placeholder="currentStepContent.emailPlaceholder" :class="inputClass" autocomplete="email" />
                  </Motion>

                  <Motion class="space-y-2"
                    :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.15 } } }">
                    <input v-model="contact.location" :placeholder="currentStepContent.locationPlaceholder" :class="inputClass" />
                  </Motion>
                </div>
              </template>
            </Motion>
          </AnimatePresence>

          <div class="mt-8 flex items-center justify-between border-t border-black/5 bg-surface-soft/35 px-4 py-6 md:px-8">
            <AppButton type="button" class="disabled:pointer-events-none disabled:opacity-0" :disabled="currentStep === 0" @click="prevStep">
              <ChevronLeft class="h-4 w-4" />
              {{ publicQuoteFlowConfig.actions.back }}
            </AppButton>

            <AppButton type="button" variant="primary" :disabled="!isStepValid || isSubmitting"
              @click="currentStepId === 'contato' ? finish() : nextStep()">
              <template v-if="isSubmitting">
                <Loader2 class="h-4 w-4 animate-spin" />
                {{ publicQuoteFlowConfig.steps.contato.submittingLabel }}
              </template>
              <template v-else>
                {{ nextButtonLabel }}
                <ChevronRight v-if="currentStepId !== 'contato'" class="h-4 w-4" />
              </template>
            </AppButton>
          </div>
        </div>
      </Motion>
    </template>
  </div>
</template>
