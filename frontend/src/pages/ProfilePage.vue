<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const userEmail = computed(() => auth.userEmail || 'Невідомий користувач')

async function onLogout() {
  auth.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="grid gap-6">
    <div>
      <h2 class="text-2xl font-extrabold text-neutral-900">Профіль</h2>
      <p class="mt-1 text-neutral-500">Перегляд даних вашого акаунта.</p>
    </div>

    <BaseCard>
      <div class="grid gap-4">
        <div>
          <div class="text-sm text-neutral-500">Email</div>
          <div class="text-lg font-semibold text-neutral-900">{{ userEmail }}</div>
        </div>

        <div class="pt-3 border-t border-neutral-200">
          <BaseButton variant="danger" @click="onLogout">Вийти з акаунта</BaseButton>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
