<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
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
    await auth.register({ email: email.value.trim(), password: password.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Помилка реєстрації'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid gap-5">
    <div>
      <h2 class="text-2xl font-extrabold text-neutral-900">Реєстрація</h2>
      <p class="mt-1 text-neutral-500">Створіть акаунт — і можна оформлювати замовлення.</p>
    </div>

    <BaseCard>
      <form class="grid gap-4" @submit.prevent="onSubmit">
        <BaseInput v-model="email" label="Email" type="email" autocomplete="email" placeholder="you@example.com" />
        <BaseInput
          v-model="password"
          label="Пароль"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
        />
        <div v-if="error" class="text-sm text-red-600">{{ error }}</div>
        <BaseButton type="submit" variant="primary" :disabled="!canSubmit">
          {{ loading ? 'Створюємо...' : 'Створити акаунт' }}
        </BaseButton>

        <div class="text-sm text-neutral-500">
          Вже є акаунт?
          <RouterLink to="/login" class="font-semibold text-neutral-900 hover:underline">Вхід</RouterLink>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

