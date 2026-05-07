<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '../components/common/EmptyState.vue'
import Loader from '../components/common/Loader.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { getApiErrorInfo } from '../services/api-errors'
import * as adminProductsApi from '../services/admin-products.api'
import type { AdminProduct } from '../types/admin-products'

const router = useRouter()

const products = ref<AdminProduct[]>([])
const search = ref('')
const loading = ref(false)
const deletingId = ref<number | null>(null)
const error = ref<string | null>(null)

function formatPrice(price: number) {
  return `${price.toFixed(2)} ₴`
}

async function fetchProducts() {
  loading.value = true
  error.value = null
  try {
    products.value = await adminProductsApi.getAdminProducts(search.value)
  } catch (e) {
    error.value = getApiErrorInfo(e).message
  } finally {
    loading.value = false
  }
}

async function deleteProduct(product: AdminProduct) {
  if (!window.confirm(`Видалити "${product.title}"?`)) return

  deletingId.value = product.id
  error.value = null
  try {
    await adminProductsApi.deleteAdminProduct(product.id)
    await fetchProducts()
  } catch (e) {
    error.value = getApiErrorInfo(e).message
  } finally {
    deletingId.value = null
  }
}

onMounted(fetchProducts)
</script>

<template>
  <div class="grid gap-6">
    <BaseCard>
      <div class="flex flex-wrap items-end gap-3 justify-between">
        <BaseInput v-model="search" label="Пошук товарів" placeholder="Назва або опис..." />
        <div class="flex items-center gap-2">
          <BaseButton variant="secondary" @click="fetchProducts">Знайти</BaseButton>
          <BaseButton variant="primary" @click="router.push('/admin/products/new')">Додати товар</BaseButton>
        </div>
      </div>
    </BaseCard>

    <Loader v-if="loading" />

    <EmptyState
      v-else-if="error"
      title="Не вдалося завантажити товари"
      :description="error"
    >
      <BaseButton variant="primary" @click="fetchProducts">Спробувати ще раз</BaseButton>
    </EmptyState>

    <EmptyState v-else-if="!products.length" title="Товари не знайдено">
      <BaseButton variant="primary" @click="router.push('/admin/products/new')">Створити товар</BaseButton>
    </EmptyState>

    <BaseCard v-else padded>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-sm">
          <thead>
            <tr class="text-left border-b border-neutral-200">
              <th class="px-2 py-2">Фото</th>
              <th class="px-2 py-2">Назва</th>
              <th class="px-2 py-2">Категорія</th>
              <th class="px-2 py-2">Бренд</th>
              <th class="px-2 py-2">Ціна</th>
              <th class="px-2 py-2">Сумісність</th>
              <th class="px-2 py-2 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id" class="border-b border-neutral-100">
              <td class="px-2 py-2">
                <img :src="product.imageUrl" :alt="product.title" class="h-12 w-16 rounded object-cover border border-neutral-200" />
              </td>
              <td class="px-2 py-2 font-medium text-neutral-900">{{ product.title }}</td>
              <td class="px-2 py-2">{{ product.category.name }}</td>
              <td class="px-2 py-2">{{ product.brand }}</td>
              <td class="px-2 py-2">{{ formatPrice(product.price) }}</td>
              <td class="px-2 py-2">{{ product.vehicleSpecIds.length }}</td>
              <td class="px-2 py-2">
                <div class="flex justify-end gap-2">
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    @click="router.push(`/admin/products/${product.id}/edit`)"
                  >
                    Редагувати
                  </BaseButton>
                  <BaseButton
                    variant="danger"
                    size="sm"
                    :loading="deletingId === product.id"
                    @click="deleteProduct(product)"
                  >
                    Видалити
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
  </div>
</template>
