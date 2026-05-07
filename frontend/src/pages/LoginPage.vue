<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const canSubmit = computed(() => Boolean(email.value.trim()) && Boolean(password.value) && !loading.value)

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Помилка входу'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid gap-5">
    <div>
      <h2 class="text-2xl font-extrabold text-neutral-900">Вхід</h2>
      <p class="mt-1 text-neutral-500">Увійдіть, щоб оформити замовлення та переглядати історію.</p>
    </div>

    <BaseCard>
      <form class="grid gap-4" @submit.prevent="onSubmit">
        <BaseInput
          v-model="email"
          label="Електронна пошта"
          type="email"
          autocomplete="email"
          placeholder="name@example.com"
        />
        <BaseInput
          v-model="password"
          label="Пароль"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
        />
        <div v-if="error" class="text-sm text-red-600">{{ error }}</div>
        <BaseButton type="submit" variant="primary" :disabled="!canSubmit">
          {{ loading ? 'Вхід...' : 'Увійти' }}
        </BaseButton>

        <div class="text-sm text-neutral-500">
          Немає акаунта?
          <RouterLink to="/register" class="font-semibold text-neutral-900 hover:underline">Реєстрація</RouterLink>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

