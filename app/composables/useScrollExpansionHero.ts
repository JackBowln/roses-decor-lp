import { computed, onMounted, onUnmounted, ref, watch, type WatchSource } from 'vue'
import { INTERNAL_ANCHOR_NAVIGATION_EVENT } from '@/lib/navigation'

interface UseScrollExpansionHeroOptions {
  mobileBreakpoint?: number
  resetSource?: WatchSource<unknown> | WatchSource<unknown>[]
}

const BASE_MEDIA_WIDTH = 300
const BASE_MEDIA_HEIGHT = 400
const DESKTOP_MEDIA_GROWTH = { width: 1250, height: 400, textTranslateX: 150 }
const MOBILE_MEDIA_GROWTH = { width: 650, height: 200, textTranslateX: 180 }
const CONTENT_VISIBILITY_THRESHOLD = 0.75
const WHEEL_SCROLL_FACTOR = 0.0009
const TOUCH_SCROLL_FACTORS = {
  forward: 0.005,
  backward: 0.008,
} as const

export function useScrollExpansionHero(options: UseScrollExpansionHeroOptions = {}) {
  const mobileBreakpoint = options.mobileBreakpoint ?? 768

  const scrollProgress = ref(0)
  const showContent = ref(false)
  const mediaFullyExpanded = ref(false)
  const touchStartY = ref(0)
  const isMobile = ref(false)

  const clampProgress = (value: number) => Math.min(Math.max(value, 0), 1)

  const resetState = () => {
    scrollProgress.value = 0
    showContent.value = false
    mediaFullyExpanded.value = false
    touchStartY.value = 0
  }

  const syncExpansionState = (progress: number) => {
    if (progress >= 1) {
      mediaFullyExpanded.value = true
      showContent.value = true
      return
    }

    mediaFullyExpanded.value = false

    if (progress < CONTENT_VISIBILITY_THRESHOLD) {
      showContent.value = false
    }
  }

  const applyProgressDelta = (delta: number) => {
    const nextProgress = clampProgress(scrollProgress.value + delta)
    scrollProgress.value = nextProgress
    syncExpansionState(nextProgress)
  }

  const collapseExpandedMedia = () => {
    mediaFullyExpanded.value = false
  }

  const unlockForAnchorNavigation = () => {
    scrollProgress.value = 1
    mediaFullyExpanded.value = true
    showContent.value = true
    touchStartY.value = 0
  }

  const shouldCollapseExpandedMedia = (deltaY: number) => {
    return mediaFullyExpanded.value && deltaY < 0 && window.scrollY <= 5
  }

  const updateViewportState = () => {
    isMobile.value = window.innerWidth < mobileBreakpoint
  }

  const handleWheel = (event: WheelEvent) => {
    if (shouldCollapseExpandedMedia(event.deltaY)) {
      collapseExpandedMedia()
      event.preventDefault()
      return
    }

    if (mediaFullyExpanded.value) {
      return
    }

    event.preventDefault()
    applyProgressDelta(event.deltaY * WHEEL_SCROLL_FACTOR)
  }

  const handleTouchStart = (event: TouchEvent) => {
    touchStartY.value = event.touches[0]?.clientY ?? 0
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!touchStartY.value) {
      return
    }

    const touchY = event.touches[0]?.clientY ?? 0
    const deltaY = touchStartY.value - touchY

    if (shouldCollapseExpandedMedia(deltaY)) {
      collapseExpandedMedia()
      event.preventDefault()
      return
    }

    if (mediaFullyExpanded.value) {
      return
    }

    event.preventDefault()

    const scrollFactor = deltaY < 0 ? TOUCH_SCROLL_FACTORS.backward : TOUCH_SCROLL_FACTORS.forward
    applyProgressDelta(deltaY * scrollFactor)
    touchStartY.value = touchY
  }

  const handleTouchEnd = () => {
    touchStartY.value = 0
  }

  const handleWindowScroll = () => {
    if (!mediaFullyExpanded.value) {
      window.scrollTo(0, 0)
    }
  }

  if (options.resetSource) {
    watch(options.resetSource, resetState)
  }

  onMounted(() => {
    updateViewportState()
    resetState()

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('scroll', handleWindowScroll)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('resize', updateViewportState)
    window.addEventListener(INTERNAL_ANCHOR_NAVIGATION_EVENT, unlockForAnchorNavigation)
  })

  onUnmounted(() => {
    window.removeEventListener('wheel', handleWheel)
    window.removeEventListener('scroll', handleWindowScroll)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
    window.removeEventListener('resize', updateViewportState)
    window.removeEventListener(INTERNAL_ANCHOR_NAVIGATION_EVENT, unlockForAnchorNavigation)
  })

  const responsiveGrowth = computed(() => (isMobile.value ? MOBILE_MEDIA_GROWTH : DESKTOP_MEDIA_GROWTH))

  const mediaWidth = computed(() => BASE_MEDIA_WIDTH + scrollProgress.value * responsiveGrowth.value.width)
  const mediaHeight = computed(() => BASE_MEDIA_HEIGHT + scrollProgress.value * responsiveGrowth.value.height)
  const textTranslateX = computed(() => scrollProgress.value * responsiveGrowth.value.textTranslateX)
  const backgroundOpacity = computed(() => 1 - scrollProgress.value)
  const mediaOverlayOpacity = computed(() => Math.max(0, 0.3 - scrollProgress.value * 0.3))

  return {
    backgroundOpacity,
    mediaHeight,
    mediaOverlayOpacity,
    mediaWidth,
    showContent,
    textTranslateX,
  }
}
