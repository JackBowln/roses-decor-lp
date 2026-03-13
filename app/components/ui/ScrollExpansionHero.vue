<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { Motion } from 'motion-v'
import { useScrollExpansionHero } from '@/composables/useScrollExpansionHero'

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

const {
  backgroundOpacity,
  mediaHeight,
  mediaOverlayOpacity,
  mediaWidth,
  showContent,
  textTranslateX,
} = useScrollExpansionHero({
  resetSource: [() => props.mediaType, () => props.mediaSrc],
})

const splitTitle = (title?: string) => {
  const parts = (title ?? '').trim().split(/\s+/).filter(Boolean)

  return {
    firstWord: parts[0] ?? '',
    restOfTitle: parts.slice(1).join(' '),
  }
}

const isYouTubeUrl = (url: string) => {
  try {
    const { hostname } = new URL(url)
    return hostname.includes('youtube.com') || hostname.includes('youtu.be')
  } catch {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }
}

const getYouTubeVideoId = (url: string) => {
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '')
    }

    if (parsedUrl.pathname.includes('/embed/')) {
      return parsedUrl.pathname.split('/embed/')[1]?.split('/')[0] ?? ''
    }

    return parsedUrl.searchParams.get('v') ?? ''
  } catch {
    return ''
  }
}

const buildYouTubeEmbedUrl = (url: string) => {
  const videoId = getYouTubeVideoId(url)

  if (!videoId) {
    return url
  }

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    controls: '0',
    showinfo: '0',
    rel: '0',
    disablekb: '1',
    modestbranding: '1',
    playlist: videoId,
  })

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

const buildTranslatedStyle = (direction: -1 | 1, extra: CSSProperties = {}): CSSProperties => ({
  transform: `translateX(${direction * textTranslateX.value}vw)`,
  ...extra,
})

const titleParts = computed(() => splitTitle(props.title))
const titleBlendClass = computed(() => (props.textBlend ? 'mix-blend-difference' : 'mix-blend-normal'))
const isYouTubeMedia = computed(() => props.mediaType === 'video' && isYouTubeUrl(props.mediaSrc))
const resolvedVideoSrc = computed(() => (isYouTubeMedia.value ? buildYouTubeEmbedUrl(props.mediaSrc) : props.mediaSrc))

const mediaFrameStyle = computed<CSSProperties>(() => ({
  width: `${mediaWidth.value}px`,
  height: `${mediaHeight.value}px`,
  maxWidth: '95vw',
  maxHeight: '85vh',
  boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.3)',
}))

const dateTextStyle = computed(() =>
  buildTranslatedStyle(-1, {
    fontFamily: "'Playfair Display', serif",
    fontStyle: 'italic',
    textShadow: '1px 2px 6px rgba(0,0,0,0.8)',
  })
)

const scrollHintTextStyle = computed(() =>
  buildTranslatedStyle(1, {
    fontFamily: "'Montserrat', sans-serif",
    textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
  })
)

const firstTitleStyle = computed(() =>
  buildTranslatedStyle(-1, {
    fontFamily: "'Playfair Display', serif",
    textShadow: '2px 4px 12px rgba(0,0,0,0.8)',
  })
)

const secondTitleStyle = computed(() =>
  buildTranslatedStyle(1, {
    fontFamily: "'Playfair Display', serif",
    textShadow: '2px 4px 12px rgba(0,0,0,0.8)',
  })
)
</script>

<template>
  <div class="transition-colors duration-700 ease-in-out overflow-x-hidden">
    <section class="relative flex flex-col items-center justify-start min-h-[100dvh]">
      <div class="relative w-full flex flex-col items-center min-h-[100dvh]">
        <Motion class="absolute inset-0 z-0 h-full" :initial="{ opacity: 0 }" :animate="{ opacity: backgroundOpacity }"
          :transition="{ duration: 0.1 }">
          <img :src="bgImageSrc" alt="Background" :width="1920" :height="1080" class="w-screen h-screen object-cover"
            loading="eager" fetchpriority="high" />
          <div class="absolute inset-0 bg-black/40" />
        </Motion>

        <div class="container mx-auto flex flex-col items-center justify-start relative z-10">
          <div class="flex flex-col items-center justify-center w-full h-[100dvh] relative">
            <div
              class="absolute z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl"
              :style="mediaFrameStyle">
              <template v-if="mediaType === 'video'">
                <div v-if="isYouTubeMedia" class="relative w-full h-full pointer-events-none">
                  <iframe width="100%" height="100%" :src="resolvedVideoSrc" class="w-full h-full rounded-xl"
                    frameborder="0"
                    :title="title || 'Vídeo de apresentação'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen />
                  <div class="absolute inset-0 z-10 pointer-events-none" />
                  <Motion class="absolute inset-0 bg-black/20 rounded-xl" :initial="{ opacity: 0.5 }"
                    :animate="{ opacity: mediaOverlayOpacity }" :transition="{ duration: 0.2 }" />
                </div>

                <div v-else class="relative w-full h-full pointer-events-none">
                  <video :src="resolvedVideoSrc" :poster="posterSrc" autoplay muted loop playsinline preload="auto"
                    class="w-full h-full object-cover rounded-xl" :controls="false" disablePictureInPicture
                    disableRemotePlayback />
                  <div class="absolute inset-0 z-10 pointer-events-none" />
                  <Motion class="absolute inset-0 bg-black/20 rounded-xl" :initial="{ opacity: 0.5 }"
                    :animate="{ opacity: mediaOverlayOpacity }" :transition="{ duration: 0.2 }" />
                </div>
              </template>

              <template v-else>
                <div class="relative w-full h-full">
                  <NuxtImg :src="mediaSrc" :alt="title || 'Media content'" :width="1280" :height="720"
                    class="w-full h-full object-cover rounded-xl" />
                  <Motion class="absolute inset-0 bg-black/20 rounded-xl" :initial="{ opacity: 0.5 }"
                    :animate="{ opacity: mediaOverlayOpacity }" :transition="{ duration: 0.2 }" />
                </div>
              </template>

              <div class="flex flex-col items-center text-center relative z-10 mt-4 transition-none">
                <p v-if="date" class="text-2xl text-[#E6C35C]" :style="dateTextStyle">
                  {{ date }}
                </p>
                <p v-if="scrollToExpand" class="text-white font-semibold tracking-widest uppercase text-sm mt-3"
                  :style="scrollHintTextStyle">
                  {{ scrollToExpand }}
                </p>
              </div>
            </div>

            <div
              class="flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col"
              :class="titleBlendClass">
              <Motion as="h2" class="text-6xl md:text-7xl lg:text-8xl font-bold text-white transition-none"
                :style="firstTitleStyle">
                {{ titleParts.firstWord }}
              </Motion>
              <Motion as="h2" class="text-5xl md:text-6xl lg:text-7xl italic text-[#E6C35C] transition-none"
                :style="secondTitleStyle">
                {{ titleParts.restOfTitle }}
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
