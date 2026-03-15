<script setup lang="ts">
import Header3 from '@/components/ui/Header3.vue'
import {
  adminHeaderConfig,
  adminNavigationGroups,
  adminNavigationLinks,
} from '@/lib/adminNavigation'

const route = useRoute()
const { logout, session } = useAdminSession()
const isLoggingOut = ref(false)

const handleLogout = async () => {
  try {
    isLoggingOut.value = true
    await logout()
    await navigateTo('/gestao/login')
  }
  finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.12),transparent_28%),linear-gradient(180deg,#f8f4ed_0%,#fcfaf6_38%,#f3eadb_100%)] pb-20 md:pb-0">
    <Header3
      :groups="adminNavigationGroups"
      :authenticated="session.authenticated"
      :logging-out="isLoggingOut"
      :brand-label="adminHeaderConfig.brandLabel"
      :brand-name="adminHeaderConfig.brandName"
      :brand-destination="adminHeaderConfig.brandDestination"
      :quick-action="adminHeaderConfig.quickAction"
      :logout-label="adminHeaderConfig.logoutLabel"
      :logout-loading-label="adminHeaderConfig.logoutLoadingLabel"
      :mobile-menu-aria-label="adminHeaderConfig.mobileMenuAriaLabel"
      :mobile-logout-label="adminHeaderConfig.mobileLogoutLabel"
      @logout="handleLogout"
    />

    <main>
      <slot />
    </main>

    <AdminMobileBottomNav :links="adminNavigationLinks" :active-path="route.path" />
  </div>
</template>
