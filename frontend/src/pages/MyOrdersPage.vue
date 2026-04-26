<script setup lang="ts">
import { onMounted } from 'vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import EmptyState from '../components/common/EmptyState.vue'
import Loader from '../components/common/Loader.vue'
import { useOrdersStore } from '../stores/orders'

const orders = useOrdersStore()

async function load() {
  await orders.fetchMyOrders()
}

onMounted(load)
</script>

<template>
  <div class="grid gap-6">
    <div>
      <h2 class="text-2xl font-extrabold text-neutral-900">Мої замовлення</h2>
      <p class="mt-1 text-neutral-500">Історія ваших замовлень.</p>
    </div>

    <div v-if="orders.loading">
      <Loader />
    </div>

    <EmptyState v-else-if="orders.error" title="Не вдалося завантажити замовлення" :description="orders.error">
      <BaseButton variant="primary" @click="load">Спробувати ще раз</BaseButton>
    </EmptyState>

    <EmptyState v-else-if="!orders.myOrders.length" title="Поки немає замовлень" description="Створіть перше замовлення з кошика.">
      <RouterLink to="/catalog">
        <BaseButton variant="primary">Перейти в каталог</BaseButton>
      </RouterLink>
    </EmptyState>

    <div v-else class="grid gap-3">
      <BaseCard v-for="o in orders.myOrders" :key="o.id">
        <div class="grid gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="font-extrabold text-neutral-900">Замовлення #{{ o.id }}</div>
            <div class="text-sm text-neutral-500">{{ new Date(o.createdAt).toLocaleString() }}</div>
          </div>
          <div class="text-sm text-neutral-700">Статус: {{ o.status }}</div>
          <div class="text-sm text-neutral-700">Сума: {{ o.totalPrice }} ₴</div>
          <div class="pt-2 border-t border-neutral-200">
            <div class="text-sm font-semibold text-neutral-800">Позиції:</div>
            <ul class="mt-2 grid gap-1 text-sm text-neutral-700">
              <li v-for="it in o.items" :key="`${o.id}-${it.productId}`">
                {{ it.product.title }} ({{ it.product.brand }}) — x{{ it.quantity }} • {{ it.unitPrice }} ₴
              </li>
            </ul>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

