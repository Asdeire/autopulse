<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import EmptyState from '../components/common/EmptyState.vue'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const cart = useCartStore()

const items = computed(() => cart.items)
const total = computed(() => cart.totalAmount)

function onCheckout() {
  router.push('/checkout')
}
</script>

<template>
  <div class="grid gap-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-neutral-900">Кошик</h2>
        <p class="mt-1 text-neutral-500">Перевірте позиції та переходьте до оформлення.</p>
      </div>
      <BaseButton variant="primary" :disabled="!items.length" @click="onCheckout">Оформити</BaseButton>
    </div>

    <EmptyState v-if="!items.length" title="Кошик порожній" description="Додайте товари з каталогу, щоб оформити замовлення.">
      <RouterLink to="/catalog">
        <BaseButton variant="primary">Перейти в каталог</BaseButton>
      </RouterLink>
    </EmptyState>

    <div v-else class="grid gap-4 lg:grid-cols-3">
      <div class="grid gap-3 lg:col-span-2">
        <BaseCard v-for="item in items" :key="item.productId" class="min-w-0">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="font-bold text-neutral-900 truncate">{{ item.name }}</div>
              <div class="mt-1 text-sm text-neutral-500">
                {{ item.price }} ₴ • x {{ item.quantity }} = {{ item.price * item.quantity }} ₴
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
              <BaseButton variant="ghost" size="sm" @click="cart.changeQty(item.productId, item.quantity - 1)"
                >−</BaseButton
              >
              <BaseBadge variant="neutral">{{ item.quantity }}</BaseBadge>
              <BaseButton variant="ghost" size="sm" @click="cart.changeQty(item.productId, item.quantity + 1)"
                >+</BaseButton
              >
              <BaseButton variant="ghost" size="sm" @click="cart.removeFromCart(item.productId)">Видалити</BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <BaseCard class="h-fit">
        <div class="grid gap-4">
          <div class="flex items-center justify-between">
            <div class="text-sm text-neutral-500">Разом</div>
            <div class="text-lg font-extrabold text-neutral-900">{{ total }} ₴</div>
          </div>
          <div class="grid gap-2">
            <BaseButton variant="primary" @click="onCheckout">Перейти до оформлення</BaseButton>
            <BaseButton variant="ghost" @click="cart.clearCart">Очистити кошик</BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

