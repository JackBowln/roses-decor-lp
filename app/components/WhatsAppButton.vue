<script setup lang="ts">
import { siteConfig, whatsappUrl } from '@/lib/site'
</script>

<template>
  <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="whatsapp-float"
    :aria-label="siteConfig.cta.whatsapp">
    <svg viewBox="0 0 32 32" class="whatsapp-icon">
      <path
        d="M16 0c-8.837 0-16 7.163-16 16 0 2.825.733 5.485 2.022 7.791l-2.022 7.209 7.379-1.937c2.191 1.18 4.698 1.841 7.371 1.841 8.837 0 16-7.163 16-16s-7.163-16-16-16zM16 29.333c-2.454 0-4.745-.633-6.735-1.745l-.482-.269-4.383 1.149 1.171-4.175-.295-.469c-1.241-1.977-1.956-4.321-1.956-6.824 0-7.363 5.989-13.352 13.352-13.352 7.363 0 13.352 5.989 13.352 13.352s-5.989 13.352-13.352 13.352zM23.016 19.539c-.384-.192-2.272-1.12-2.624-1.248-.352-.128-.608-.192-.864.192s-.992 1.248-1.216 1.504-.448.288-.832.096c-.384-.192-1.62-.597-3.085-1.904-1.14-.992-1.908-2.216-2.132-2.6-.224-.384-.024-.592.168-.784.176-.176.384-.448.576-.672.192-.224.256-.384.384-.64.128-.256.064-.48-.032-.672s-.864-2.08-1.184-2.848c-.312-.76-.632-.656-.864-.656-.224 0-.48-.032-.736-.032s-.672.096-1.024.48c-.352.384-1.344 1.312-1.344 3.192s1.376 3.696 1.568 3.968c.192.272 2.704 4.128 6.544 5.792.912.392 1.624.624 2.176.8 1.024.328 1.952.28 2.688.168.824-.12 2.272-.928 2.592-1.824.32-.896.32-1.664.224-1.824s-.352-.288-.736-.48z"
        fill="currentColor" />
    </svg>
  </a>
</template>

<style scoped>
.whatsapp-float {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background-color: #25d366;
  color: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;
}

.whatsapp-float:hover {
  transform: scale(1.1);
  background-color: #128c7e;
}

.whatsapp-icon {
  width: 35px;
  height: 35px;
}

@media (max-width: 768px) {
  .whatsapp-float {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
  }

  .whatsapp-icon {
    width: 28px;
    height: 28px;
  }
}
</style>
