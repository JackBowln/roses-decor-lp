<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  BriefcaseBusiness,
  ChevronDown,
  LogOut,
} from 'lucide-vue-next'
import type { AdminNavigationGroup } from '@/lib/adminNavigation'
import { adminHeaderConfig } from '@/lib/adminNavigation'
import { cn } from '@/lib/utils'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock'
import { useClickOutside } from '@/composables/useClickOutside'
import { useExpandableSet } from '@/composables/useExpandableSet'
import { useStickyThreshold } from '@/composables/useStickyThreshold'
import MenuToggleIcon from '@/components/ui/MenuToggleIcon.vue'

const props = withDefaults(defineProps<{
  groups: AdminNavigationGroup[]
  authenticated?: boolean
  loggingOut?: boolean
  brandLabel?: string
  brandName?: string
  brandDestination?: string
  quickAction?: {
    label: string
    to: string
  } | null
  logoutLabel?: string
  logoutLoadingLabel?: string
  mobileMenuAriaLabel?: string
  mobileLogoutLabel?: string
}>(), {
  authenticated: false,
  loggingOut: false,
  brandLabel: adminHeaderConfig.brandLabel,
  brandName: adminHeaderConfig.brandName,
  brandDestination: adminHeaderConfig.brandDestination,
  quickAction: () => adminHeaderConfig.quickAction,
  logoutLabel: adminHeaderConfig.logoutLabel,
  logoutLoadingLabel: adminHeaderConfig.logoutLoadingLabel,
  mobileMenuAriaLabel: adminHeaderConfig.mobileMenuAriaLabel,
  mobileLogoutLabel: adminHeaderConfig.mobileLogoutLabel,
})

const emit = defineEmits<{
  (event: 'logout'): void
}>()

const route = useRoute()
const rootRef = ref<HTMLElement | null>(null)
const mobileMenuOpen = ref(false)
const openDesktopGroupId = ref<string | null>(null)
const {
  expandedValues: expandedMobileGroups,
  isExpanded: isMobileGroupExpanded,
  replaceExpanded,
  toggleExpanded: toggleMobileGroup,
} = useExpandableSet<string>([])
const { scrolled } = useStickyThreshold(10)

const activeGroupId = computed(() =>
  props.groups.find((group) => group.links.some((link) => route.path === link.to))?.id || null)

const isDesktopDropdownOpen = computed(() => openDesktopGroupId.value !== null)

const isLinkActive = (to: string) => route.path === to
const isGroupActive = (group: AdminNavigationGroup) => group.links.some((link) => isLinkActive(link.to))

const toggleDesktopGroup = (groupId: string) => {
  openDesktopGroupId.value = openDesktopGroupId.value === groupId ? null : groupId
}

const closeMenus = () => {
  mobileMenuOpen.value = false
  openDesktopGroupId.value = null
}

useBodyScrollLock(mobileMenuOpen)
useClickOutside(rootRef, () => {
  openDesktopGroupId.value = null
}, {
  enabled: isDesktopDropdownOpen,
})

watch(() => route.path, () => {
  closeMenus()
})

watch(
  [activeGroupId, () => props.groups.map((group) => group.id).join('|')],
  ([groupId]) => {
    if (!props.groups.length) {
      replaceExpanded([])
      return
    }

    replaceExpanded(groupId ? [String(groupId)] : [props.groups[0].id])
  },
  { immediate: true },
)
</script>

<template>
  <header
    ref="rootRef"
    :class="cn(
      'sticky top-0 z-sticky border-b border-transparent',
      scrolled
        ? 'bg-[#f8f4ed]/92 backdrop-blur-lg supports-[backdrop-filter]:bg-[#f8f4ed]/70 border-line/20 shadow-sticky'
        : 'bg-[#f8f4ed]/84 backdrop-blur',
    )"
  >
    <nav class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
      <div class="flex min-w-0 items-center gap-3 md:gap-5">
        <NuxtLink
          :to="brandDestination"
          class="flex min-w-0 items-center gap-3 rounded-field px-2 py-2 transition-colors hover:bg-white/65"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-primary/15 bg-white/88 text-primary shadow-card">
            <BriefcaseBusiness class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <span class="app-kicker mb-0.5 block">{{ brandLabel }}</span>
            <strong class="block truncate text-sm text-foreground md:text-base">{{ brandName }}</strong>
          </div>
        </NuxtLink>

        <div class="hidden items-center gap-2 md:flex">
          <div
            v-for="group in groups"
            :key="group.id"
            class="relative"
          >
            <button
              type="button"
              :class="cn(
                'inline-flex min-h-touch items-center gap-2 rounded-pill border px-4 text-sm font-bold transition-colors',
                openDesktopGroupId === group.id || isGroupActive(group)
                  ? 'border-transparent bg-primary text-white'
                  : 'border-black/10 bg-white/80 text-foreground hover:border-line/30 hover:bg-surface-soft/70',
              )"
              @click.stop="toggleDesktopGroup(group.id)"
            >
              <component :is="group.icon" class="h-4 w-4" />
              <span>{{ group.label }}</span>
              <ChevronDown
                :class="cn(
                  'h-4 w-4 transition-transform duration-200',
                  openDesktopGroupId === group.id && 'rotate-180',
                )"
              />
            </button>

            <Transition name="header-dropdown">
              <div
                v-if="openDesktopGroupId === group.id"
                class="absolute left-0 top-full mt-3 w-[min(92vw,720px)] rounded-[24px] border border-line/15 bg-white/95 p-3 shadow-elevated backdrop-blur-sm"
              >
                <div class="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
                  <div class="grid gap-2">
                    <NuxtLink
                      v-for="link in group.links"
                      :key="link.to"
                      :to="link.to"
                      :class="cn(
                        'grid grid-cols-[48px_minmax(0,1fr)] items-start gap-3 rounded-[18px] border px-3 py-3 transition-colors',
                        isLinkActive(link.to)
                          ? 'border-primary/20 bg-primary/8'
                          : 'border-black/5 bg-white/84 hover:border-line/25 hover:bg-surface-soft/80',
                      )"
                    >
                      <div class="flex h-12 w-12 items-center justify-center rounded-[14px] border border-line/15 bg-white text-foreground shadow-card">
                        <component :is="link.icon" class="h-5 w-5" />
                      </div>
                      <div class="min-w-0">
                        <span class="block text-sm font-bold text-foreground">{{ link.label }}</span>
                        <span class="mt-1 block text-sm leading-5 text-muted/78">{{ link.description }}</span>
                      </div>
                    </NuxtLink>
                  </div>

                  <div class="grid gap-3 rounded-[20px] border border-line/15 bg-primary/[0.045] p-4">
                    <div>
                      <span class="app-kicker mb-1 block">{{ group.label }}</span>
                      <h3 class="text-base text-foreground">Atalhos operacionais</h3>
                    </div>
                    <div class="grid gap-2">
                      <NuxtLink
                        v-for="link in group.quickLinks"
                        :key="link.to"
                        :to="link.to"
                        class="flex items-center gap-2 rounded-[16px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/80"
                      >
                        <component :is="link.icon" class="h-4 w-4 text-primary" />
                        <span>{{ link.label }}</span>
                      </NuxtLink>
                    </div>
                    <p class="text-sm leading-6 text-muted/76">{{ group.summary }}</p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div class="hidden items-center gap-2 md:flex">
        <AppButton v-if="quickAction" :to="quickAction.to" variant="ghost">
          {{ quickAction.label }}
        </AppButton>
        <AppButton
          v-if="authenticated"
          :loading="loggingOut"
          variant="secondary"
          @click="emit('logout')"
        >
          <LogOut class="h-4 w-4" />
          {{ loggingOut ? logoutLoadingLabel : logoutLabel }}
        </AppButton>
      </div>

      <AppButton
        size="icon"
        variant="secondary"
        class="md:hidden"
        :aria-expanded="mobileMenuOpen"
        aria-controls="admin-mobile-menu"
        :aria-label="mobileMenuAriaLabel"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <MenuToggleIcon :open="mobileMenuOpen" class="h-5 w-5" :duration="300" />
      </AppButton>
    </nav>

    <Teleport to="body">
      <Transition name="header-mobile">
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-0 z-overlay bg-foreground/18 backdrop-blur-[2px] md:hidden"
          @click="mobileMenuOpen = false"
        >
          <div
            id="admin-mobile-menu"
            class="fixed inset-x-0 top-16 bottom-0 z-overlay overflow-y-auto border-t border-line/15 bg-[#f8f4ed]/96 px-4 py-4 backdrop-blur"
            @click.stop
          >
            <div class="mx-auto grid w-full max-w-6xl gap-3 safe-pb">
              <section
                v-for="group in groups"
                :key="group.id"
                class="rounded-[22px] border border-line/15 bg-white/88 shadow-card"
              >
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                  @click="toggleMobileGroup(group.id)"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-11 w-11 items-center justify-center rounded-[14px] border border-line/10 bg-surface-soft/76 text-foreground">
                      <component :is="group.icon" class="h-5 w-5" />
                    </div>
                    <div>
                      <span class="block text-sm font-bold text-foreground">{{ group.label }}</span>
                      <span class="block text-xs text-muted/72">{{ group.summary }}</span>
                    </div>
                  </div>
                  <ChevronDown
                    :class="cn(
                      'h-5 w-5 shrink-0 text-muted transition-transform duration-200',
                      isMobileGroupExpanded(group.id) && 'rotate-180',
                    )"
                  />
                </button>

                <div v-if="isMobileGroupExpanded(group.id)" class="grid gap-2 border-t border-line/10 px-3 py-3">
                  <NuxtLink
                    v-for="link in group.links"
                    :key="link.to"
                    :to="link.to"
                    :class="cn(
                      'grid grid-cols-[42px_minmax(0,1fr)] items-start gap-3 rounded-[16px] px-3 py-3 transition-colors',
                      isLinkActive(link.to)
                        ? 'bg-primary text-white'
                        : 'bg-surface-soft/72 text-foreground hover:bg-surface-soft',
                    )"
                    @click="closeMenus"
                  >
                    <div :class="cn(
                      'flex h-10 w-10 items-center justify-center rounded-[12px] border',
                      isLinkActive(link.to)
                        ? 'border-white/10 bg-white/10 text-white'
                        : 'border-line/10 bg-white text-foreground',
                    )">
                      <component :is="link.icon" class="h-4 w-4" />
                    </div>
                    <div class="min-w-0">
                      <span class="block text-sm font-bold">{{ link.label }}</span>
                      <span :class="cn('mt-1 block text-xs leading-5', isLinkActive(link.to) ? 'text-white/82' : 'text-muted/78')">
                        {{ link.description }}
                      </span>
                    </div>
                  </NuxtLink>
                </div>
              </section>

              <AppButton
                v-if="quickAction"
                block
                :to="quickAction.to"
                variant="ghost"
                @click="closeMenus"
              >
                {{ quickAction.label }}
              </AppButton>

              <AppButton
                v-if="authenticated"
                block
                :loading="loggingOut"
                variant="secondary"
                @click="emit('logout')"
              >
                <LogOut class="h-4 w-4" />
                {{ loggingOut ? logoutLoadingLabel : mobileLogoutLabel }}
              </AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.header-dropdown-enter-active,
.header-dropdown-leave-active,
.header-mobile-enter-active,
.header-mobile-leave-active {
  transition: opacity 0.18s ease, transform 0.22s ease;
}

.header-dropdown-enter-from,
.header-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.header-mobile-enter-from,
.header-mobile-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
