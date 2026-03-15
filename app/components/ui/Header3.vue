<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import {
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  Hammer,
  LogOut,
  Palette,
  Scissors,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import MenuToggleIcon from '@/components/ui/MenuToggleIcon.vue'

type HeaderLink = {
  label: string
  to: string
  description: string
  icon: Component
}

type HeaderGroup = {
  id: string
  label: string
  icon: Component
  links: HeaderLink[]
}

const props = withDefaults(defineProps<{
  groups: HeaderGroup[]
  authenticated?: boolean
  loggingOut?: boolean
}>(), {
  authenticated: false,
  loggingOut: false,
})

const emit = defineEmits<{
  (event: 'logout'): void
}>()

const route = useRoute()
const mobileMenuOpen = ref(false)
const openDesktopGroupId = ref<string | null>(null)
const expandedMobileGroups = ref<string[]>([])
const scrolled = ref(false)

const activeGroupId = computed(() =>
  props.groups.find((group) => group.links.some((link) => route.path === link.to))?.id || null)

const toggleDesktopGroup = (groupId: string) => {
  openDesktopGroupId.value = openDesktopGroupId.value === groupId ? null : groupId
}

const toggleMobileGroup = (groupId: string) => {
  expandedMobileGroups.value = expandedMobileGroups.value.includes(groupId)
    ? expandedMobileGroups.value.filter((entry) => entry !== groupId)
    : [...expandedMobileGroups.value, groupId]
}

const isMobileGroupExpanded = (groupId: string) => expandedMobileGroups.value.includes(groupId)
const isLinkActive = (to: string) => route.path === to
const isGroupActive = (group: HeaderGroup) => group.links.some((link) => isLinkActive(link.to))

const handleScroll = () => {
  if (!import.meta.client) {
    return
  }

  scrolled.value = window.scrollY > 10
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target

  if (!(target instanceof HTMLElement) || target.closest('[data-admin-header-root]')) {
    return
  }

  openDesktopGroupId.value = null
}

watch(() => route.path, () => {
  mobileMenuOpen.value = false
  openDesktopGroupId.value = null
})

watch(mobileMenuOpen, (isOpen) => {
  if (!import.meta.client) {
    return
  }

  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onMounted(() => {
  expandedMobileGroups.value = activeGroupId.value ? [activeGroupId.value] : [props.groups[0]?.id].filter(Boolean) as string[]
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    window.removeEventListener('scroll', handleScroll)
    document.removeEventListener('click', handleDocumentClick)
  }
})

const commercialQuickLinks: HeaderLink[] = [
  {
    label: 'Clientes',
    to: '/gestao/clientes',
    description: 'Histórico e relacionamento por cliente.',
    icon: Users,
  },
  {
    label: 'Vendas',
    to: '/gestao/vendas',
    description: 'Fechamento, recebimento e dashboards.',
    icon: TrendingUp,
  },
]

const operationalQuickLinks: HeaderLink[] = [
  {
    label: 'Costureiras',
    to: '/gestao/costureiras',
    description: 'Cadastro e execução de costura.',
    icon: Scissors,
  },
  {
    label: 'Estoque',
    to: '/gestao/estoque',
    description: 'Saldo, entradas, saídas e consumo.',
    icon: Warehouse,
  },
]
</script>

<template>
  <header
    data-admin-header-root
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
          to="/gestao/pre-orcamentos"
          class="flex min-w-0 items-center gap-3 rounded-field px-2 py-2 transition-colors hover:bg-white/65"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-primary/15 bg-white/88 text-primary shadow-card">
            <BriefcaseBusiness class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <span class="app-kicker mb-0.5 block">Área interna</span>
            <strong class="block truncate text-sm text-foreground md:text-base">Roses Decor</strong>
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
                class="absolute left-0 top-full mt-3 w-[min(92vw,720px)] rounded-[24px] border border-line/15 bg-white/95 backdrop-blur-sm p-3 shadow-elevated"
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
                        v-for="link in group.id === 'comercial' ? commercialQuickLinks : operationalQuickLinks"
                        :key="link.to"
                        :to="link.to"
                        class="flex items-center gap-2 rounded-[16px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/80"
                      >
                        <component :is="link.icon" class="h-4 w-4 text-primary" />
                        <span>{{ link.label }}</span>
                      </NuxtLink>
                    </div>
                    <p class="text-sm leading-6 text-muted/76">
                      {{ group.id === 'comercial'
                        ? 'Pré-orçamentos, orçamentos e vendas ficam no mesmo fluxo comercial.'
                        : 'Costureiras, instaladores, tecidos e estoque ficam agrupados na operação.' }}
                    </p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div class="hidden items-center gap-2 md:flex">
        <AppButton to="/gestao/vendas" variant="ghost">
          Ver vendas
        </AppButton>
        <AppButton
          v-if="authenticated"
          :loading="loggingOut"
          variant="secondary"
          @click="emit('logout')"
        >
          <LogOut class="h-4 w-4" />
          {{ loggingOut ? 'Saindo...' : 'Sair' }}
        </AppButton>
      </div>

      <AppButton
        size="icon"
        variant="secondary"
        class="md:hidden"
        :aria-expanded="mobileMenuOpen"
        aria-controls="admin-mobile-menu"
        aria-label="Abrir menu da gestão"
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
            <div class="mx-auto grid w-full max-w-6xl gap-3 safe-pb bg-white/95 backdrop-blur-sm">
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
                      <span class="block text-xs text-muted/72">
                        {{ group.id === 'comercial' ? 'Relacionamento e fechamento' : 'Produção e controle interno' }}
                      </span>
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
                    @click="mobileMenuOpen = false"
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
                v-if="authenticated"
                block
                :loading="loggingOut"
                variant="secondary"
                @click="emit('logout')"
              >
                <LogOut class="h-4 w-4" />
                {{ loggingOut ? 'Saindo...' : 'Sair da gestão' }}
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
