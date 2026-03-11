<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Motion, AnimatePresence } from 'motion-v'
import { cn } from '@/lib/utils'

interface Props {
  words: string[]
  duration?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  duration: 1500,
})

const currentWord = ref<string>(props.words[0])
const isAnimating = ref(false)

const startAnimation = () => {
  const currentIndex = props.words.indexOf(currentWord.value)
  const nextWord = props.words[currentIndex + 1] || props.words[0]
  currentWord.value = nextWord
  isAnimating.value = true
}

// Timer logic
onMounted(() => {
  setTimeout(() => {
    startAnimation()
  }, props.duration)
})

const handleExitComplete = () => {
  isAnimating.value = false
}

// When animation ends, start new timer
watch(isAnimating, (newVal) => {
  if (!newVal) {
    setTimeout(() => {
      startAnimation()
    }, props.duration)
  }
})
</script>

<template>
  <AnimatePresence @exit-complete="handleExitComplete">
    <Motion :key="currentWord" :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }" :transition="{
      type: 'spring',
      stiffness: 100,
      damping: 10,
    }" :exit="{
      opacity: 0,
      y: -40,
      x: 40,
      filter: 'blur(8px)',
      scale: 2,
      position: 'absolute',
    }" :class="cn(
      'z-10 inline-block relative text-left text-foreground px-2',
      className
    )">
      <span v-for="(word, wordIndex) in currentWord.split(' ')" :key="word + wordIndex"
        class="inline-block whitespace-nowrap">
        <Motion v-for="(letter, letterIndex) in word.split('')" :key="word + letterIndex"
          :initial="{ opacity: 0, y: 10, filter: 'blur(8px)' }" :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :transition="{
            delay: wordIndex * 0.3 + letterIndex * 0.05,
            duration: 0.2,
          }" class="inline-block">
          {{ letter }}
        </Motion>
        <span class="inline-block">&nbsp;</span>
      </span>
    </Motion>
  </AnimatePresence>
</template>
