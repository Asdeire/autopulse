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
const page = ref(1)
const pageSize = 12
type PaginationToken = number | 'ellipsis'

const normalizedQuery = computed<ProductsQuery>(() => {
  const q: ProductsQuery = {}
  if (search.value.trim()) q.search = search.value.trim()
  if (brand.value.trim()) q.brand = brand.value.trim()
  if (categoryId.value) q.categoryId = Number(categoryId.value)
  if (sortBy.value) q.sortBy = sortBy.value
  if (onlyCompatible.value) q.onlyCompatible = true
  q.page = page.value
  q.pageSize = pageSize
  q.usePrimaryVehicle = true
  return q
})

function hydrateFromRoute() {
  const q = route.query
  search.value = typeof q.search === 'string' ? q.search : ''
  brand.value = typeof q.brand === 'string' ? q.brand : ''
  categoryId.value = typeof q.categoryId === 'string' ? q.categoryId : ''
  onlyCompatible.value = q.onlyCompatible === 'true'
  const parsedPage = typeof q.page === 'string' ? Number(q.page) : Number.NaN
  page.value = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
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
      page: '1',
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
  page.value = 1
  router.replace({ query: {} })
}

async function goToPage(nextPage: number) {
  const safePage = Math.max(1, Math.min(nextPage, catalog.pagination.totalPages || 1))
  await router.replace({
    query: {
      ...route.query,
      page: String(safePage),
    },
  })
}

const visibleRange = computed(() => {
  if (!catalog.products.length) {
    return '0-0'
  }
  const start = (catalog.pagination.page - 1) * catalog.pagination.pageSize + 1
  const end = start + catalog.products.length - 1
  return `${start}-${end}`
})

const paginationItems = computed<PaginationToken[]>(() => {
  const total = catalog.pagination.totalPages
  const current = catalog.pagination.page

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (current <= 3) {
    return [1, 2, 3, 'ellipsis', total]
  }

  if (current >= total - 2) {
    return [1, 'ellipsis', total - 2, total - 1, total]
  }

  return [1, 'ellipsis', current, current + 1, 'ellipsis', total]
})

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
          <BaseInput v-model="search" label="Пошук" placeholder="Напр. олива, фільтр..." />
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
          <BaseBadge variant="neutral">Показано: {{ visibleRange }} з {{ catalog.pagination.total }}</BaseBadge>
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
      <RouterLink v-for="p in catalog.products" :key="p.id" :to="`/products/${p.id}`" class="block h-full">
        <BaseCard hoverable class="h-full cursor-pointer transition-transform duration-150 hover:-translate-y-0.5">
          <div class="grid gap-3">
            <div class="relative overflow-hidden rounded-lg border border-neutral-200">
              <img
                v-if="p.imageUrl"
                :src="p.imageUrl"
                :alt="p.title"
                class="h-60 w-full object-contain"
              />
              <div v-else class="grid h-40 place-items-center text-sm text-neutral-400">
                Немає фото
              </div>
              <BaseBadge
                v-if="p.isCompatible"
                variant="neutral"
                class="absolute left-2 top-2 border border-neutral-300 bg-white/90 px-2 py-0.5 text-[11px] leading-4 text-neutral-700 backdrop-blur"
              >
                Сумісно
              </BaseBadge>
            </div>

            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-bold text-neutral-900 truncate">{{ p.title }}</div>
                <div class="text-sm text-neutral-500 truncate">{{ p.brand }} • {{ p.category.name }}</div>
              </div>
              <BaseBadge variant="neutral">{{ p.price }} ₴</BaseBadge>
            </div>

          </div>
        </BaseCard>
      </RouterLink>
    </div>

    <BaseCard v-if="catalog.pagination.totalPages > 1">
      <div class="flex items-center justify-center gap-1 sm:gap-2 text-[#002B39]">
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400"
          :disabled="catalog.pagination.page <= 1 || catalog.loading"
          @click="goToPage(catalog.pagination.page - 1)"
          aria-label="Попередня сторінка"
        >
          <span class="text-2xl leading-none">‹</span>
        </button>

        <template v-for="(item, index) in paginationItems" :key="`${item}-${index}`">
          <button
            v-if="item !== 'ellipsis'"
            type="button"
            class="grid h-9 w-9 place-items-center rounded-full text-sm font-medium transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed"
            :class="item === catalog.pagination.page ? 'border-2 border-[#002B39] bg-white' : ''"
            :disabled="catalog.loading"
            @click="goToPage(item)"
          >
            {{ item }}
          </button>
          <span v-else class="px-1 text-sm font-semibold">...</span>
        </template>

        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400"
          :disabled="catalog.pagination.page >= catalog.pagination.totalPages || catalog.loading"
          @click="goToPage(catalog.pagination.page + 1)"
          aria-label="Наступна сторінка"
        >
          <span class="text-2xl leading-none">›</span>
        </button>
      </div>
    </BaseCard>
  </div>
</template>

