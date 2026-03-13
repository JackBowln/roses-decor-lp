<script setup lang="ts">
import { ref, computed } from 'vue'
import { Motion, AnimatePresence } from 'motion-v'
import { ChevronLeft, ChevronRight, Check, Loader2, Plus, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const steps = [
  { id: "produto", title: "Produto" },
  { id: "ambiente", title: "Ambiente" },
  { id: "material", title: "Material" },
  { id: "medidas", title: "Medidas" },
  { id: "resumo", title: "Resumo" },
  { id: "contato", title: "Contato" },
]

interface QuoteItem {
  type: string
  env: string
  material: string
  blackout: string
  width: string
  height: string
  dontKnowMeasures: boolean
}

const currentItem = ref<QuoteItem>({
  type: '',
  env: '',
  material: '',
  blackout: 'Sem Blackout',
  width: '1.0',
  height: '2.0',
  dontKnowMeasures: false
})

const items = ref<QuoteItem[]>([])

const contact = ref({
  name: '',
  location: ''
})

const currentStep = ref(0)
const isSubmitting = ref(false)
const whatsappPhone = '5527998220461'

const environments = ['Sala', 'Quarto', 'Escritório', 'Cozinha', 'Outro']
const tecidos = ['Linho', 'Linho Rústico', 'Voil', 'Não sei ainda']
const blackouts = ['70%', '100%', 'Sem Blackout']
const persianas = ['Rolo', 'Madeira', 'Double Vision', 'Romana', "Não sei ainda"]

const nextStep = () => {
  if (currentStep.value === 3) {
    // Before moving to summary, push the current item to items array
    if (currentItem.value.type && currentItem.value.env && currentItem.value.material) {
      items.value.push({ ...currentItem.value })
    }
  }
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    if (currentStep.value === 4) {
      // If we are on summary going back, pop the last item to edit it
      if (items.value.length > 0) {
        const lastItem = items.value.pop()
        if (lastItem) currentItem.value = { ...lastItem }
      }
    }
    currentStep.value--
  }
}

const resetCurrentItem = () => {
  currentItem.value = {
    type: '',
    env: '',
    material: '',
    blackout: 'Sem Blackout',
    width: '',
    height: '',
    dontKnowMeasures: false
  }
}

const addAnotherRoom = () => {
  resetCurrentItem()
  currentStep.value = 0
}

const removeItem = (index: number) => {
  items.value.splice(index, 1)
  if (items.value.length === 0) {
    resetCurrentItem()
    currentStep.value = 0
  }
}

const buildWhatsAppMessage = () => {
  let msg = `Olá! Gostaria de fazer um orçamento.\n\nMeu nome: ${contact.value.name}\nLocal: ${contact.value.location}\n\n*Itens:*\n`

  items.value.forEach((item, index) => {
    msg += `\n${index + 1}. ${item.type} para ${item.env}\n`
    msg += `   Material: ${item.material}`
    if (item.type === 'Cortina') {
      msg += ` (Blackout: ${item.blackout})`
    }
    msg += '\n'
    if (item.dontKnowMeasures) {
      msg += `   Medidas: Não sei as medidas exatas\n`
    } else {
      msg += `   Medidas: ${item.width}m x ${item.height}m\n`
    }
  })

  return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`
}

const resetForm = () => {
  currentStep.value = 0
  items.value = []
  contact.value = { name: '', location: '' }
  resetCurrentItem()
}

const finish = () => {
  if (isSubmitting.value) return

  isSubmitting.value = true

  const whatsappUrl = buildWhatsAppMessage()

  toast.success("Redirecionando para o WhatsApp...")

  const whatsappWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer')

  resetForm()
  isSubmitting.value = false
}

const selectType = (val: string) => {
  currentItem.value.type = val
  setTimeout(() => nextStep(), 300)
}

const selectEnv = (val: string) => {
  currentItem.value.env = val
  setTimeout(() => nextStep(), 300)
}

const selectPersiana = (val: string) => {
  currentItem.value.material = val
  setTimeout(() => nextStep(), 300)
}

const isStepValid = computed(() => {
  switch (currentStep.value) {
    case 0:
      return currentItem.value.type !== ''
    case 1:
      return currentItem.value.env !== ''
    case 2:
      return currentItem.value.material !== ''
    case 3:
      return currentItem.value.dontKnowMeasures || (currentItem.value.width !== '' && currentItem.value.height !== '')
    case 4:
      return items.value.length > 0
    case 5:
      return contact.value.name.trim() !== '' && contact.value.location.trim() !== ''
    default:
      return true
  }
})
</script>

<template>
  <div class="w-full max-w-2xl mx-auto py-8 text-black font-montserrat">
    <!-- Progress indicator -->
    <Motion class="mb-8" :initial="{ opacity: 0, y: -20 }" :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5 }">
      <div class="flex justify-between mb-2 relative px-2">
        <Motion v-for="(step, index) in steps" :key="index" class="flex flex-col items-center relative z-10"
          :whileHover="{ scale: 1.1 }">
          <Motion :class="[
            'w-4 h-4 rounded-full cursor-pointer transition-colors duration-300',
            index < currentStep ? 'bg-[#C5A059]' : index === currentStep ? 'bg-[#C5A059] ring-4 ring-[#C5A059]/30' : 'bg-gray-300'
          ]" @click="index <= currentStep && index !== 4 ? currentStep = index : null" :whileTap="{ scale: 0.95 }" />
          <span :class="[
            'text-xs mt-1.5 hidden sm:block',
            index === currentStep ? 'text-[#C5A059] font-medium' : 'text-gray-400'
          ]">
            {{ step.title }}
          </span>
        </Motion>
      </div>
      <div class="w-full bg-gray-200 h-1 rounded-full overflow-hidden mt-2 relative">
        <Motion class="h-full bg-[#C5A059] absolute top-0 left-0" :initial="{ width: 0 }"
          :animate="{ width: `${(currentStep / (steps.length - 1)) * 100}%` }" :transition="{ duration: 0.3 }" />
      </div>
    </Motion>

    <!-- Form card -->
    <Motion :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5, delay: 0.2 }">
      <div class="border border-gray-100 shadow-xl rounded-2xl overflow-hidden bg-white">
        <AnimatePresence mode="wait">
          <Motion :key="currentStep" initial="hidden" animate="visible" exit="exit" :variants="{
            hidden: { opacity: 0, x: 20 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
            exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
          }" class="p-6 md:p-8">
            <!-- Step 1: Produto -->
            <template v-if="currentStep === 0">
              <div class="flex flex-col space-y-1.5 mb-8 text-center">
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">O que você
                  procura?</h3>
                <p class="text-sm text-gray-500 mt-2">Escolha o tipo de produto para iniciarmos seu orçamento</p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Motion
                  :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }"
                  class="space-y-2">
                  <button @click="selectType('Cortina')"
                    class="w-full h-32 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300"
                    :class="currentItem.type === 'Cortina' ? 'border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059]' : 'border-gray-200 hover:border-[#C5A059]/50 bg-white text-gray-700'">
                    <span class="font-medium text-lg">Cortina</span>
                  </button>
                </Motion>
                <Motion
                  :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } } }"
                  class="space-y-2">
                  <button @click="selectType('Persiana')"
                    class="w-full h-32 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300"
                    :class="currentItem.type === 'Persiana' ? 'border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059]' : 'border-gray-200 hover:border-[#C5A059]/50 bg-white text-gray-700'">
                    <span class="font-medium text-lg">Persiana</span>
                  </button>
                </Motion>
              </div>
            </template>

            <!-- Step 2: Ambiente -->
            <template v-if="currentStep === 1">
              <div class="flex flex-col space-y-1.5 mb-8 text-center">
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">Para qual
                  ambiente?</h3>
                <p class="text-sm text-gray-500 mt-2">Onde a sua nova {{ currentItem.type.toLowerCase() }} será
                  instalada?</p>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Motion v-for="(env, index) in environments" :key="env"
                  :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: index * 0.05 } } }">
                  <button @click="selectEnv(env)"
                    class="w-full py-4 px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300"
                    :class="currentItem.env === env ? 'border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059]' : 'border-gray-200 hover:border-[#C5A059]/50 bg-white text-gray-700'">
                    <span class="font-medium">{{ env }}</span>
                  </button>
                </Motion>
              </div>
            </template>

            <!-- Step 3: Material -->
            <template v-if="currentStep === 2">
              <div class="flex flex-col space-y-1.5 mb-8 text-center">
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">Qual a sua
                  preferência de material?</h3>
                <p class="text-sm text-gray-500 mt-2">Personalize o estilo da sua {{ currentItem.type.toLowerCase() }}
                </p>
              </div>

              <div v-if="currentItem.type === 'Cortina'" class="space-y-6">
                <div>
                  <p class="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wider">Tecido Principal</p>
                  <div class="grid grid-cols-2 gap-3">
                    <button v-for="t in tecidos" :key="t" @click="currentItem.material = t"
                      class="py-3 px-2 rounded-lg border flex items-center justify-center transition-all duration-300 font-medium text-sm"
                      :class="currentItem.material === t ? 'border-[#C5A059] bg-[#C5A059] text-white' : 'border-gray-200 hover:border-[#C5A059]/50 bg-white text-gray-600'">
                      {{ t }}
                    </button>
                  </div>
                </div>
                <div>
                  <p class="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wider mt-4">Nível de Blackout
                  </p>
                  <div class="grid grid-cols-3 gap-3">
                    <button v-for="b in blackouts" :key="b" @click="currentItem.blackout = b"
                      class="py-3 px-2 rounded-lg border flex items-center justify-center transition-all duration-300 font-medium text-sm"
                      :class="currentItem.blackout === b ? 'border-[#C5A059] bg-[#C5A059] text-white' : 'border-gray-200 hover:border-[#C5A059]/50 bg-white text-gray-600'">
                      {{ b }}
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="space-y-4">
                <p class="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wider">Modelo de Persiana</p>
                <div class="grid grid-cols-2 gap-3">
                  <button v-for="p in persianas" :key="p" @click="selectPersiana(p)"
                    class="py-4 px-2 rounded-xl border-2 flex items-center justify-center transition-all duration-300 font-medium text-sm"
                    :class="currentItem.material === p ? 'border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059]' : 'border-gray-200 hover:border-[#C5A059]/50 bg-white text-gray-600'">
                    {{ p }}
                  </button>
                </div>
              </div>
            </template>

            <!-- Step 4: Medidas -->
            <template v-if="currentStep === 3">
              <div class="flex flex-col space-y-1.5 mb-8 text-center">
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">Quais as
                  medidas aproximadas?</h3>
                <p class="text-sm text-gray-500 mt-2">Para um orçamento mais preciso, nos informe o tamanho do espaço
                </p>
              </div>

              <div class="space-y-6">
                <Motion :variants="{ hidden: { opacity: 0 }, visible: { opacity: 1 } }"
                  :class="currentItem.dontKnowMeasures ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label class="text-sm font-medium text-gray-700">Largura (m)</label>
                      <input v-model="currentItem.width" type="number" step="0.1" placeholder="Ex: 2.5"
                        class="flex h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] transition-all duration-300"
                        :disabled="currentItem.dontKnowMeasures" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-medium text-gray-700">Altura (m)</label>
                      <input v-model="currentItem.height" type="number" step="0.1" placeholder="Ex: 2.6"
                        class="flex h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] transition-all duration-300"
                        :disabled="currentItem.dontKnowMeasures" />
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
                  <input type="checkbox" v-model="currentItem.dontKnowMeasures" class="hidden" />
                  <span class="text-sm font-medium text-gray-700">Não sei as medidas exatas (<span
                      class="font-normal text-gray-500">Agendaremos uma visita para medição</span>)</span>
                </label>
              </div>
            </template>

            <!-- Step 5: Resumo -->
            <template v-if="currentStep === 4">
              <div class="flex flex-col space-y-1.5 mb-6">
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">Resumo do
                  seu Pedido</h3>
                <p class="text-sm text-gray-500 mt-2">Verifique os itens antes de prosseguir</p>
              </div>

              <div class="space-y-4">
                <div v-for="(item, index) in items" :key="index"
                  class="flex items-start justify-between p-4 border border-[#C5A059]/30 bg-[#C5A059]/5 rounded-xl">
                  <div>
                    <h4 class="font-medium text-gray-900">{{ item.type }} - {{ item.env }}</h4>
                    <p class="text-sm text-gray-600 mt-1">
                      {{ item.material }}
                      <template v-if="item.blackout && item.blackout !== 'Sem Blackout'">• Blackout {{ item.blackout
                        }}</template>
                    </p>
                    <p class="text-sm text-gray-500 mt-1">
                      <span v-if="item.dontKnowMeasures">Medidas a confirmar</span>
                      <span v-else>{{ item.width }}m x {{ item.height }}m</span>
                    </p>
                  </div>
                  <button @click="removeItem(index)"
                    class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>

                <button @click="addAnotherRoom"
                  class="w-full flex items-center justify-center gap-2 py-4 mt-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all font-medium">
                  <Plus class="w-4 h-4" /> Adicionar outro cômodo
                </button>
              </div>
            </template>

            <!-- Step 6: Contato -->
            <template v-if="currentStep === 5">
              <div class="flex flex-col space-y-1.5 mb-8 text-center mt-2">
                <div
                  class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/-2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-message-circle">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                  </svg>
                </div>
                <h3 class="text-3xl font-playfair font-semibold leading-none tracking-tight text-[#2B2B2B]">Como podemos
                  te chamar?</h3>
                <p class="text-sm text-gray-500 mt-2">Insira seus dados para enviarmos a solicitação direto para a nossa
                  equipe no WhatsApp.</p>
              </div>
              <div class="space-y-4">
                <Motion
                  :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }"
                  class="space-y-2">
                  <input v-model="contact.name" placeholder="Seu Nome Completo"
                    class="flex h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] transition-all duration-300" />
                </Motion>
                <Motion
                  :variants="{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } } }"
                  class="space-y-2">
                  <input v-model="contact.location" placeholder="Seu Bairro ou Cidade"
                    class="flex h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] transition-all duration-300" />
                </Motion>
              </div>
            </template>
          </Motion>
        </AnimatePresence>

        <div class="flex items-center justify-between p-6 px-4 md:px-8 border-t border-gray-100 bg-gray-50 mt-8">
          <button type="button" @click="prevStep" :disabled="currentStep === 0"
            class="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none h-11 px-5 py-2 border border-gray-200 hover:bg-gray-100 gap-2 text-gray-700 bg-white shadow-sm">
            <ChevronLeft class="h-4 w-4" /> Voltar
          </button>

          <button type="button" @click="currentStep === steps.length - 1 ? finish() : nextStep()"
            :disabled="!isStepValid || isSubmitting"
            class="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-6 py-2 bg-[#C5A059] text-white hover:bg-[#b5952f] gap-2 shadow-md hover:shadow-lg"
            :class="currentStep === steps.length - 1 ? 'bg-green-600 hover:bg-green-700 ring-4 ring-green-600/20 w-auto' : ''">
            <template v-if="isSubmitting">
              <Loader2 class="h-4 w-4 animate-spin" /> Processando...
            </template>
            <template v-else>
              {{ currentStep === steps.length - 1 ? "Finalizar no WhatsApp" : (currentStep === 4 ? "Tudo Pronto" :
                "Próximo Passo") }}
              <ChevronRight v-if="currentStep !== steps.length - 1" class="h-4 w-4" />
            </template>
          </button>
        </div>
      </div>
    </Motion>

  </div>
</template>
