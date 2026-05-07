<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import EmptyState from '../components/common/EmptyState.vue'
import Loader from '../components/common/Loader.vue'
import { useCartStore } from '../stores/cart'
import { useOrdersStore } from '../stores/orders'

const router = useRouter()
const cart = useCartStore()
const orders = useOrdersStore()

const submitting = ref(false)
const submitError = ref<string | null>(null)

const items = computed(() => cart.items)
const total = computed(() => cart.totalAmount)

async function submit() {
  submitError.value = null
  submitting.value = true
  try {
    const order = await orders.createOrder({
      items: items.value.map((x) => ({ productId: x.productId, quantity: x.quantity })),
    })
    cart.clearCart()
    await router.push({ path: '/orders', query: { created: String(order.id) } })
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : 'Не вдалося створити замовлення'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <div>
      <h2 class="text-2xl font-extrabold text-neutral-900">Оформлення</h2>
      <p class="mt-1 text-neutral-500">Підтвердіть замовлення з поточного кошика.</p>
    </div>

    <EmptyState
      v-if="!items.length"
      title="Немає товарів для оформлення"
      description="Додайте товари в кошик, щоб створити замовлення."
    >
      <RouterLink to="/catalog">
        <BaseButton variant="primary">Перейти в каталог</BaseButton>
      </RouterLink>
    </EmptyState>

    <BaseCard v-else>
      <div class="grid gap-4">
          <div class="grid gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <div class="text-sm font-semibold text-neutral-800">Склад замовлення:</div>
          <ul class="grid gap-1 text-sm text-neutral-700">
            <li v-for="item in items" :key="item.productId">
              {{ item.name }} — x{{ item.quantity }} • {{ item.price * item.quantity }} ₴
            </li>
          </ul>
        </div>
        <div class="text-lg font-extrabold text-neutral-900">Разом: {{ total }} ₴</div>

        <div v-if="orders.loading || submitting">
          <Loader />
        </div>

        <div v-if="submitError" class="text-sm text-red-600">{{ submitError }}</div>
        <div v-else-if="orders.error" class="text-sm text-red-600">{{ orders.error }}</div>

        <div class="flex flex-wrap gap-2">
          <BaseButton variant="primary" :disabled="submitting || orders.loading" @click="submit">
            {{ submitting || orders.loading ? 'Створюємо...' : 'Підтвердити замовлення' }}
          </BaseButton>
          <BaseButton variant="ghost" :disabled="submitting || orders.loading" @click="router.push('/cart')">
            Назад у кошик
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

