import { onMounted, onUnmounted } from 'vue'
import { INTERNAL_ANCHOR_NAVIGATION_EVENT } from '@/lib/navigation'

const HEADER_SELECTOR = '.main-header'
const EXTRA_OFFSET = 16

const getAnchorIdFromHref = (href: string) => {
  if (!href.startsWith('#')) {
    return null
  }

  return href.slice(1)
}

const getScrollTopForElement = (element: Element) => {
  const header = document.querySelector(HEADER_SELECTOR)
  const headerOffset = header instanceof HTMLElement ? header.offsetHeight + EXTRA_OFFSET : EXTRA_OFFSET

  return Math.max(0, window.scrollY + element.getBoundingClientRect().top - headerOffset)
}

export function useSmoothAnchorLinks() {
  const scrollToAnchor = (anchorId: string, updateHistory = true) => {
    const decodedId = decodeURIComponent(anchorId)
    const target = decodedId ? document.getElementById(decodedId) : document.documentElement

    if (!target) {
      return
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
      const nextHash = decodedId ? `#${decodedId}` : `${window.location.pathname}${window.location.search}`
      window.history.pushState(null, '', nextHash)
    }
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

    const anchorId = getAnchorIdFromHref(target.getAttribute('href') ?? '')

    if (anchorId === null) {
      return
    }

    event.preventDefault()
    scrollToAnchor(anchorId)
  }

  const handleHashNavigation = (allowEmptyHash = false) => {
    const hash = window.location.hash.replace(/^#/, '')

    if (!hash && !allowEmptyHash) {
      return
    }

    scrollToAnchor(hash, false)
  }

  const handleHashChange = () => {
    handleHashNavigation(true)
  }

  onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
    window.addEventListener('hashchange', handleHashChange)
    handleHashNavigation()
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick)
    window.removeEventListener('hashchange', handleHashChange)
  })

  return {
    scrollToAnchor,
  }
}
