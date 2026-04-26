<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import EmptyState from '../components/common/EmptyState.vue'
import Loader from '../components/common/Loader.vue'
import { useCatalogStore } from '../stores/catalog'
import { useGarageStore } from '../stores/garage'
import type { ProductsQuery } from '../types/catalog'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const garage = useGarageStore()

const search = ref('')
const brand = ref('')
const categoryId = ref<string>('')
const sortBy = ref<ProductsQuery['sortBy']>('price_asc')
const onlyCompatible = ref(false)

const normalizedQuery = computed<ProductsQuery>(() => {
  const q: ProductsQuery = {}
  if (search.value.trim()) q.search = search.value.trim()
  if (brand.value.trim()) q.brand = brand.value.trim()
  if (categoryId.value) q.categoryId = Number(categoryId.value)
  if (sortBy.value) q.sortBy = sortBy.value
  if (onlyCompatible.value) q.onlyCompatible = true
  q.usePrimaryVehicle = true
  return q
})

function hydrateFromRoute() {
  const q = route.query
  search.value = typeof q.search === 'string' ? q.search : ''
  brand.value = typeof q.brand === 'string' ? q.brand : ''
  categoryId.value = typeof q.categoryId === 'string' ? q.categoryId : ''
  onlyCompatible.value = q.onlyCompatible === 'true'
  sortBy.value =
    q.sortBy === 'price_desc' || q.sortBy === 'price_asc' ? (q.sortBy as ProductsQuery['sortBy']) : 'price_asc'
}

async function refetch() {
  catalog.setFilters(normalizedQuery.value)
  await catalog.fetchProducts(normalizedQuery.value)
}

async function applyFilters() {
  await router.replace({
    query: {
      ...normalizedQuery.value,
      usePrimaryVehicle: normalizedQuery.value.usePrimaryVehicle ? 'true' : undefined,
      onlyCompatible: normalizedQuery.value.onlyCompatible ? 'true' : undefined,
    },
  })
}

function resetFilters() {
  search.value = ''
  brand.value = ''
  categoryId.value = ''
  sortBy.value = 'price_asc'
  onlyCompatible.value = false
  router.replace({ query: {} })
}

watch(
  () => route.query,
  async () => {
    hydrateFromRoute()
    await refetch()
  },
)

onMounted(async () => {
  hydrateFromRoute()
  await Promise.all([catalog.fetchCategories(), garage.fetchMyVehicles(), refetch()])
})
</script>

<template>
  <div class="grid gap-6">
    <BaseCard>
      <div class="grid gap-4">
        <div class="grid gap-3 md:grid-cols-4">
          <BaseInput v-model="search" label="Пошук" placeholder="Напр. oil, filter..." />
          <BaseInput v-model="brand" label="Бренд" placeholder="Напр. Bosch" />

          <label class="block">
            <span class="block text-sm font-semibold text-neutral-800 mb-1">Категорія</span>
            <select
              v-model="categoryId"
              class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-all duration-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            >
              <option value="">Всі</option>
              <option v-for="c in catalog.categories" :key="c.id" :value="String(c.id)">
                {{ c.name }}
              </option>
            </select>
          </label>

          <label class="block">
            <span class="block text-sm font-semibold text-neutral-800 mb-1">Сортування</span>
            <select
              v-model="sortBy"
              class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-all duration-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            >
              <option value="price_asc">Ціна: зростання</option>
              <option value="price_desc">Ціна: спадання</option>
            </select>
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <label class="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input v-model="onlyCompatible" type="checkbox" class="h-4 w-4 rounded border-neutral-300" />
            Лише сумісні з моїм основним авто
          </label>
          <BaseBadge v-if="garage.primaryVehicle" variant="neutral">
            Активне авто: {{ garage.primaryVehicle.vehicleSpec.normalizedName }}
          </BaseBadge>
          <BaseBadge v-else variant="neutral">Додайте основне авто в профілі для точного підбору</BaseBadge>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <BaseButton variant="primary" @click="applyFilters">Застосувати</BaseButton>
          <BaseButton variant="ghost" @click="resetFilters">Скинути</BaseButton>
          <BaseBadge variant="neutral">Товарів: {{ catalog.products.length }}</BaseBadge>
        </div>
      </div>
    </BaseCard>

    <div v-if="catalog.loading">
      <Loader />
    </div>

    <EmptyState
      v-else-if="catalog.error"
      title="Не вдалося завантажити каталог"
      :description="catalog.error"
    >
      <BaseButton variant="primary" @click="refetch">Спробувати ще раз</BaseButton>
    </EmptyState>

    <EmptyState v-else-if="!catalog.products.length" title="Нічого не знайдено" description="Спробуйте змінити фільтри.">
      <BaseButton variant="primary" @click="resetFilters">Скинути фільтри</BaseButton>
    </EmptyState>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <BaseCard v-for="p in catalog.products" :key="p.id" class="h-full">
        <div class="grid gap-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="font-bold text-neutral-900 truncate">{{ p.title }}</div>
              <div class="text-sm text-neutral-500 truncate">{{ p.brand }} • {{ p.category.name }}</div>
            </div>
            <BaseBadge variant="neutral">{{ p.price }} ₴</BaseBadge>
          </div>
          <div v-if="p.isCompatible !== null" class="text-sm font-medium" :class="p.isCompatible ? 'text-emerald-700' : 'text-neutral-500'">
            {{ p.isCompatible ? 'Сумісно з вашим авто' : 'Немає підтвердженої сумісності' }}
          </div>

          <RouterLink :to="`/products/${p.id}`" class="text-sm font-semibold text-neutral-900 hover:underline">
            Детальніше →
          </RouterLink>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

