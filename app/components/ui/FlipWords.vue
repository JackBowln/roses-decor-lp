<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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

const rootRef = ref<HTMLElement | null>(null)
const normalizedWords = computed(() => props.words.filter(Boolean))
const currentWord = ref<string>(normalizedWords.value[0] ?? '')
const isAnimating = ref(false)
const isVisible = ref(true)
let nextAnimationTimeout: ReturnType<typeof setTimeout> | null = null
let visibilityObserver: IntersectionObserver | null = null

const startAnimation = () => {
  if (!isVisible.value || isAnimating.value || normalizedWords.value.length <= 1) return

  const currentIndex = normalizedWords.value.indexOf(currentWord.value)
  const nextWord = normalizedWords.value[currentIndex + 1] || normalizedWords.value[0]
  currentWord.value = nextWord
  isAnimating.value = true
}

const clearAnimationTimer = () => {
  if (nextAnimationTimeout) {
    clearTimeout(nextAnimationTimeout)
    nextAnimationTimeout = null
  }
}

const queueNextAnimation = () => {
  clearAnimationTimer()

  if (!isVisible.value || normalizedWords.value.length <= 1) return

  nextAnimationTimeout = setTimeout(() => {
    startAnimation()
  }, props.duration)
}

onMounted(() => {
  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible.value = entry?.isIntersecting ?? false
    },
    { threshold: 0.2 }
  )

  if (rootRef.value instanceof Element) {
    visibilityObserver.observe(rootRef.value)
  }

  queueNextAnimation()
})

onUnmounted(() => {
  clearAnimationTimer()
  visibilityObserver?.disconnect()
})

const handleExitComplete = () => {
  isAnimating.value = false
}

watch(isAnimating, (newVal) => {
  if (!newVal) {
    queueNextAnimation()
  }
})

watch(isVisible, (visible) => {
  if (visible) {
    queueNextAnimation()
  } else {
    clearAnimationTimer()
  }
})

watch(normalizedWords, (words) => {
  currentWord.value = words[0] ?? ''

  if (words.length > 1 && isVisible.value) {
    queueNextAnimation()
  } else {
    clearAnimationTimer()
  }
})
</script>

<template>
  <span ref="rootRef" :class="cn('z-10 inline-block relative text-left text-foreground px-2', className)">
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
      }">
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
  </span>
</template>
