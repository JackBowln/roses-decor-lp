import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from '#imports'
import { INTERNAL_ANCHOR_NAVIGATION_EVENT } from '@/lib/navigation'

const HEADER_SELECTOR = '.main-header'
const EXTRA_OFFSET = 16

const normalizePath = (path: string) => {
  const normalized = path.replace(/\/+$/, '')
  return normalized || '/'
}

const getAnchorLinkData = (href: string) => {
  try {
    const url = new URL(href, window.location.origin)

    if (url.origin !== window.location.origin || !url.hash) {
      return null
    }

    return {
      path: normalizePath(url.pathname),
      anchorId: decodeURIComponent(url.hash.replace(/^#/, '')),
    }
  } catch {
    return null
  }
}

const getScrollTopForElement = (element: Element) => {
  const header = document.querySelector(HEADER_SELECTOR)
  const headerOffset = header instanceof HTMLElement ? header.offsetHeight + EXTRA_OFFSET : EXTRA_OFFSET

  return Math.max(0, window.scrollY + element.getBoundingClientRect().top - headerOffset)
}

const findAnchorTarget = (anchorId: string) => {
  return anchorId ? document.getElementById(anchorId) : document.documentElement
}

export function useSmoothAnchorLinks() {
  const route = useRoute()

  const scrollToAnchor = (anchorId: string, updateHistory = true) => {
    const target = findAnchorTarget(anchorId)
    if (!target) {
      return false
    }

    window.dispatchEvent(new CustomEvent(INTERNAL_ANCHOR_NAVIGATION_EVENT))

    const scrollTop = getScrollTopForElement(target)

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      })
    })

    if (updateHistory) {
      const hash = anchorId ? `#${anchorId}` : ''
      const url = `${window.location.pathname}${window.location.search}${hash}`
      window.history.pushState(null, '', url)
    }

    return true
  }

  const handleDocumentClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    const target = event.target instanceof Element ? event.target.closest('a[href]') : null

    if (!(target instanceof HTMLAnchorElement)) {
      return
    }

    if (target.target === '_blank' || target.hasAttribute('download')) {
      return
    }

    const linkData = getAnchorLinkData(target.getAttribute('href') ?? '')

    if (!linkData) {
      return
    }

    if (linkData.path !== normalizePath(window.location.pathname)) {
      return
    }

    event.preventDefault()
    scrollToAnchor(linkData.anchorId)
  }

  const syncRouteHash = async (hash: string) => {
    if (!hash) {
      return
    }

    await nextTick()

    const anchorId = hash.replace(/^#/, '')
    let attempts = 0

    const tryScroll = () => {
      if (scrollToAnchor(anchorId, false)) {
        return
      }

      if (attempts >= 10) {
        return
      }

      attempts += 1
      window.requestAnimationFrame(tryScroll)
    }

    tryScroll()
  }

  onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick)
  })

  watch(
    () => route.fullPath,
    () => {
      syncRouteHash(route.hash)
    },
    { immediate: true }
  )

  return {
    scrollToAnchor,
  }
}
