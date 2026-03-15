<script setup lang="ts">
import { Motion } from 'motion-v'
import { cn } from '@/lib/utils'

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
  <Motion class="mb-8" :initial="{ opacity: 0, y: -20 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.5 }">
    <div class="relative flex justify-between px-2">
      <Motion v-for="(step, index) in steps" :key="step.id" class="relative z-10 flex flex-col items-center" :whileHover="{ scale: 1.04 }">
        <Motion
          :class="cn(
            'h-4 w-4 cursor-pointer rounded-full transition-colors duration-300',
            index < currentStep
              ? 'bg-primary'
              : index === currentStep
                ? 'bg-primary ring-4 ring-primary/25'
                : 'bg-black/20',
          )"
          :whileTap="{ scale: 0.95 }"
          @click="emit('select', index)"
        />
        <span :class="cn('mt-1.5 hidden text-xs sm:block', index === currentStep ? 'font-medium text-primary-strong' : 'text-muted/42')">
          {{ step.title }}
        </span>
      </Motion>
    </div>
    <div class="relative mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10">
      <Motion
        class="absolute left-0 top-0 h-full bg-primary"
        :initial="{ width: 0 }"
        :animate="{ width: `${(currentStep / (steps.length - 1)) * 100}%` }"
        :transition="{ duration: 0.3 }"
      />
    </div>
  </Motion>
</template>
