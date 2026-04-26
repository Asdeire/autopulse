<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '../ui/BaseButton.vue'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'

const route = useRoute()
const router = useRouter()

const auth = useAuthStore()
const cart = useCartStore()

const isAuthed = computed(() => auth.isAuthenticated)
const cartCount = computed(() => cart.itemsCount)
const userLabel = computed(() => auth.userEmail || 'Користувач')

const isMobileMenuOpen = ref(false)
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

function onLogout() {
  auth.logout()
  isUserMenuOpen.value = false
  closeMobileMenu()
  if (route.meta.requiresAuth) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeUserMenu() {
  isUserMenuOpen.value = false
}

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function onProfileOpen() {
  closeUserMenu()
  closeMobileMenu()
  router.push('/profile')
}

function handleOutsideClick(event: MouseEvent) {
  if (!isUserMenuOpen.value || !userMenuRef.value) return
  const target = event.target
  if (target instanceof Node && !userMenuRef.value.contains(target)) {
    closeUserMenu()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu()
    closeUserMenu()
  },
)

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <header class="bg-neutral-900 text-white">
    <div class="ap-container h-16 flex items-center justify-between gap-4">
      <RouterLink to="/" class="font-extrabold tracking-wide">
        AutoPulse
      </RouterLink>

      <nav class="hidden sm:flex items-center gap-4 text-sm">
        <RouterLink to="/catalog" class="hover:text-yellow-400 transition-colors">Каталог</RouterLink>
        <RouterLink to="/cart" class="hover:text-yellow-400 transition-colors">
          Кошик<span v-if="cartCount" class="ml-1 text-yellow-400 font-semibold">({{ cartCount }})</span>
        </RouterLink>
        <RouterLink v-if="isAuthed" to="/orders" class="hover:text-yellow-400 transition-colors"
          >Замовлення</RouterLink
        >
      </nav>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-neutral-200 hover:bg-neutral-800 transition-colors"
          :aria-label="isMobileMenuOpen ? 'Закрити меню' : 'Відкрити меню'"
          :aria-expanded="isMobileMenuOpen"
          @click="toggleMobileMenu"
        >
          <span class="sr-only">{{ isMobileMenuOpen ? 'Закрити меню' : 'Відкрити меню' }}</span>
          <svg
            v-if="!isMobileMenuOpen"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <RouterLink v-if="!isAuthed" to="/login">
          <BaseButton variant="primary" size="sm">Увійти</BaseButton>
        </RouterLink>
        <div v-else ref="userMenuRef" class="relative hidden sm:block">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
            :aria-expanded="isUserMenuOpen"
            aria-haspopup="menu"
            @click="toggleUserMenu"
          >
            <span class="max-w-40 truncate">{{ userLabel }}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              class="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <div
            v-if="isUserMenuOpen"
            class="absolute right-0 z-20 mt-2 w-52 rounded-md border border-neutral-200 bg-white p-1 text-neutral-900 shadow-lg"
            role="menu"
          >
            <button
              type="button"
              class="w-full rounded px-3 py-2 text-left text-sm hover:bg-neutral-100"
              role="menuitem"
              @click="onProfileOpen"
            >
              Переглянути профіль
            </button>
            <button
              type="button"
              class="w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              role="menuitem"
              @click="onLogout"
            >
              Вийти
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isMobileMenuOpen" class="sm:hidden border-t border-neutral-800">
      <div class="ap-container py-3">
        <nav class="flex flex-col gap-3 text-sm">
          <RouterLink
            to="/catalog"
            class="hover:text-yellow-400 transition-colors"
            @click="closeMobileMenu"
          >
            Каталог
          </RouterLink>

          <RouterLink
            to="/cart"
            class="hover:text-yellow-400 transition-colors flex items-center gap-2"
            @click="closeMobileMenu"
          >
            <span>Кошик</span>
            <span v-if="cartCount" class="text-yellow-400 font-semibold">({{ cartCount }})</span>
          </RouterLink>

          <RouterLink
            v-if="isAuthed"
            to="/orders"
            class="hover:text-yellow-400 transition-colors"
            @click="closeMobileMenu"
          >
            Замовлення
          </RouterLink>

          <div class="pt-2 border-t border-neutral-800">
            <RouterLink
              v-if="!isAuthed"
              to="/login"
              class="block"
              @click="closeMobileMenu"
            >
              <BaseButton variant="primary" size="sm" class="w-full justify-center">Увійти</BaseButton>
            </RouterLink>

            <div v-else class="grid gap-2">
              <div class="rounded-md bg-neutral-800 px-3 py-2 text-sm text-neutral-200">
                {{ userLabel }}
              </div>
              <RouterLink to="/profile" class="block" @click="closeMobileMenu">
                <BaseButton variant="ghost" size="sm" class="w-full justify-center">Профіль</BaseButton>
              </RouterLink>
              <BaseButton variant="ghost" size="sm" class="w-full justify-center" @click="onLogout">
                Вийти
              </BaseButton>
            </div>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>

