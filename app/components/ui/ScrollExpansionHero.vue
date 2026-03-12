<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Motion } from 'motion-v'

export interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image'
  mediaSrc: string
  posterSrc?: string
  bgImageSrc: string
  title?: string
  date?: string
  scrollToExpand?: string
  textBlend?: boolean
}

const props = withDefaults(defineProps<ScrollExpandMediaProps>(), {
  mediaType: 'video',
  textBlend: false,
})

const scrollProgress = ref(0)
const showContent = ref(false)
const mediaFullyExpanded = ref(false)
const touchStartY = ref(0)
const isMobileState = ref(false)

const sectionRef = ref<HTMLDivElement | null>(null)

watch(() => props.mediaType, () => {
  scrollProgress.value = 0
  showContent.value = false
  mediaFullyExpanded.value = false
})

const handleWheel = (e: WheelEvent) => {
  if (mediaFullyExpanded.value && e.deltaY < 0 && window.scrollY <= 5) {
    mediaFullyExpanded.value = false
    e.preventDefault()
  } else if (!mediaFullyExpanded.value) {
    e.preventDefault()
    const scrollDelta = e.deltaY * 0.0009
    const newProgress = Math.min(Math.max(scrollProgress.value + scrollDelta, 0), 1)
    scrollProgress.value = newProgress

    if (newProgress >= 1) {
      mediaFullyExpanded.value = true
      showContent.value = true
    } else if (newProgress < 0.75) {
      showContent.value = false
    }
  }
}

const handleTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0]?.clientY ?? 0
}

const handleTouchMove = (e: TouchEvent) => {
  if (!touchStartY.value) return

  const touchY = e.touches[0]?.clientY ?? 0
  const deltaY = touchStartY.value - touchY

  if (mediaFullyExpanded.value && deltaY < -20 && window.scrollY <= 5) {
    mediaFullyExpanded.value = false
    e.preventDefault()
  } else if (!mediaFullyExpanded.value) {
    e.preventDefault()
    // Increase sensitivity for mobile, especially when scrolling back
    const scrollFactor = deltaY < 0 ? 0.008 : 0.005 // Higher sensitivity for scrolling back
    const scrollDelta = deltaY * scrollFactor
    const newProgress = Math.min(Math.max(scrollProgress.value + scrollDelta, 0), 1)
    scrollProgress.value = newProgress

    if (newProgress >= 1) {
      mediaFullyExpanded.value = true
      showContent.value = true
    } else if (newProgress < 0.75) {
      showContent.value = false
    }

    touchStartY.value = touchY
  }
}

const handleTouchEnd = () => {
  touchStartY.value = 0
}

const handleScroll = () => {
  if (!mediaFullyExpanded.value) {
    window.scrollTo(0, 0)
  }
}

const checkIfMobile = () => {
  isMobileState.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('wheel', handleWheel, { passive: false })
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('touchstart', handleTouchStart, { passive: false })
  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('touchend', handleTouchEnd)

  checkIfMobile()
  window.addEventListener('resize', checkIfMobile)

  // reset on mount just in case
  scrollProgress.value = 0
  showContent.value = false
  mediaFullyExpanded.value = false
})

onUnmounted(() => {
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('resize', checkIfMobile)
})

const mediaWidth = computed(() => 300 + scrollProgress.value * (isMobileState.value ? 650 : 1250))
const mediaHeight = computed(() => 400 + scrollProgress.value * (isMobileState.value ? 200 : 400))
const textTranslateX = computed(() => scrollProgress.value * (isMobileState.value ? 180 : 150))

const firstWord = computed(() => props.title ? props.title.split(' ')[0] : '')
const restOfTitle = computed(() => props.title ? props.title.split(' ').slice(1).join(' ') : '')
</script>

<template>
  <div ref="sectionRef" class="transition-colors duration-700 ease-in-out overflow-x-hidden">
    <section class="relative flex flex-col items-center justify-start min-h-[100dvh]">
      <div class="relative w-full flex flex-col items-center min-h-[100dvh]">
        <Motion class="absolute inset-0 z-0 h-full" :initial="{ opacity: 0 }" :animate="{ opacity: 1 - scrollProgress }"
          :transition="{ duration: 0.1 }">
          <img :src="bgImageSrc" alt="Background" :width="1920" :height="1080" class="w-screen h-screen"
            style="object-fit: cover; object-position: center;" preload />
          <div class="absolute inset-0 bg-black/40" />
        </Motion>

        <div class="container mx-auto flex flex-col items-center justify-start relative z-10">
          <div class="flex flex-col items-center justify-center w-full h-[100dvh] relative">
            <div
              class="absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl"
              :style="{
                width: `${mediaWidth}px`,
                height: `${mediaHeight}px`,
                maxWidth: '95vw',
                maxHeight: '85vh',
                boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.3)',
              }">
              <template v-if="mediaType === 'video'">
                <div v-if="mediaSrc.includes('youtube.com')" class="relative w-full h-full pointer-events-none">
                  <iframe width="100%" height="100%"
                    :src="mediaSrc.includes('embed') ? mediaSrc + (mediaSrc.includes('?') ? '&' : '?') + 'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1' : mediaSrc.replace('watch?v=', 'embed/') + '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' + mediaSrc.split('v=')[1]"
                    class="w-full h-full rounded-xl" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen></iframe>
                  <div class="absolute inset-0 z-10" style="pointer-events: none"></div>
                  <Motion class="absolute inset-0 bg-black/20 rounded-xl" :initial="{ opacity: 0.5 }"
                    :animate="{ opacity: Math.max(0, 0.3 - scrollProgress * 0.3) }" :transition="{ duration: 0.2 }" />
                </div>
                <div v-else class="relative w-full h-full pointer-events-none">
                  <video :src="mediaSrc" :poster="posterSrc" autoplay muted loop playsinline preload="auto"
                    class="w-full h-full object-cover rounded-xl" :controls="false" disablePictureInPicture
                    disableRemotePlayback></video>
                  <div class="absolute inset-0 z-10" style="pointer-events: none"></div>
                  <Motion class="absolute inset-0 bg-black/20 rounded-xl" :initial="{ opacity: 0.5 }"
                    :animate="{ opacity: Math.max(0, 0.3 - scrollProgress * 0.3) }" :transition="{ duration: 0.2 }" />
                </div>
              </template>
              <template v-else>
                <div class="relative w-full h-full">
                  <NuxtImg :src="mediaSrc" :alt="title || 'Media content'" :width="1280" :height="720"
                    class="w-full h-full object-cover rounded-xl" />
                  <Motion class="absolute inset-0 bg-black/20 rounded-xl" :initial="{ opacity: 0.5 }"
                    :animate="{ opacity: Math.max(0, 0.3 - scrollProgress * 0.3) }" :transition="{ duration: 0.2 }" />
                </div>
              </template>

              <div class="flex flex-col items-center text-center relative z-10 mt-4 transition-none">
                <p v-if="date" class="text-2xl text-[#E6C35C]"
                  :style="{ transform: `translateX(-${textTranslateX}vw)`, fontFamily: '\'Playfair Display\', serif', fontStyle: 'italic', textShadow: '1px 2px 6px rgba(0,0,0,0.8)' }">
                  {{ date }}
                </p>
                <p v-if="scrollToExpand" class="text-white font-semibold tracking-widest uppercase text-sm mt-3"
                  :style="{ transform: `translateX(${textTranslateX}vw)`, fontFamily: '\'Montserrat\', sans-serif', textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }">
                  {{ scrollToExpand }}
                </p>
              </div>
            </div>

            <div
              :class="`flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col ${textBlend ? 'mix-blend-difference' : 'mix-blend-normal'}`">
              <Motion as="h2" class="text-6xl md:text-7xl lg:text-8xl font-bold text-white transition-none"
                :style="{ transform: `translateX(-${textTranslateX}vw)`, fontFamily: '\'Playfair Display\', serif', textShadow: '2px 4px 12px rgba(0,0,0,0.8)' }">
                {{ firstWord }}
              </Motion>
              <Motion as="h2" class="text-5xl md:text-6xl lg:text-7xl italic text-[#E6C35C] transition-none"
                :style="{ transform: `translateX(${textTranslateX}vw)`, fontFamily: '\'Playfair Display\', serif', textShadow: '2px 4px 12px rgba(0,0,0,0.8)' }">
                {{ restOfTitle }}
              </Motion>
            </div>
          </div>

          <Motion as="section" class="flex flex-col w-full px-8 py-10 md:px-16 lg:py-20" :initial="{ opacity: 0 }"
            :animate="{ opacity: showContent ? 1 : 0 }" :transition="{ duration: 0.7 }">
            <slot />
          </Motion>
        </div>
      </div>
    </section>
  </div>
</template>
