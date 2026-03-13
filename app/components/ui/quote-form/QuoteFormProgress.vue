<script setup lang="ts">
import { Motion } from 'motion-v'

interface Step {
  id: string
  title: string
}

defineProps<{
  steps: Step[]
  currentStep: number
}>()

const emit = defineEmits<{
  select: [index: number]
}>()
</script>

<template>
  <Motion class="mb-8" :initial="{ opacity: 0, y: -20 }" :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.5 }">
    <div class="flex justify-between mb-2 relative px-2">
      <Motion v-for="(step, index) in steps" :key="step.id" class="flex flex-col items-center relative z-10"
        :whileHover="{ scale: 1.1 }">
        <Motion :class="[
          'w-4 h-4 rounded-full cursor-pointer transition-colors duration-300',
          index < currentStep ? 'bg-[#C5A059]' : index === currentStep ? 'bg-[#C5A059] ring-4 ring-[#C5A059]/30' : 'bg-gray-300',
        ]" :whileTap="{ scale: 0.95 }" @click="emit('select', index)" />
        <span :class="[
          'text-xs mt-1.5 hidden sm:block',
          index === currentStep ? 'text-[#C5A059] font-medium' : 'text-gray-400',
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
</template>
