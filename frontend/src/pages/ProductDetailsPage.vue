<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import EmptyState from '../components/common/EmptyState.vue'
import Loader from '../components/common/Loader.vue'
import { useCartStore } from '../stores/cart'
import { useCatalogStore } from '../stores/catalog'
import { getRecommendedProducts } from '../services/catalog.api'
import type { Product } from '../types/catalog'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const catalog = useCatalogStore()

const product = ref<Product | null>(null)
const recommended = ref<Product[]>([])

const id = computed(() => Number(route.params.id))

async function load() {
  recommended.value = []
  const [p, recs] = await Promise.all([
    catalog.fetchProductById(id.value),
    getRecommendedProducts(id.value).catch(() => [])
  ])
  product.value = p
  recommended.value = recs
}

function addToCart() {
  if (!product.value) return
  cart.addToCart(
    {
      productId: product.value.id,
      name: product.value.title,
      price: product.value.price,
      imageUrl: product.value.imageUrl,
    },
    1,
  )
  router.push('/cart')
}

watch(id, load)
onMounted(load)
</script>

<template>
  <div class="grid gap-6">
    <div v-if="catalog.loading">
      <Loader />
    </div>

    <EmptyState
      v-else-if="catalog.error || !product"
      title="Не вдалося завантажити товар"
      :description="catalog.error ?? 'Товар не знайдено.'"
    >
      <div class="flex items-center justify-center gap-2">
        <BaseButton variant="primary" @click="load">Спробувати ще раз</BaseButton>
        <BaseButton variant="ghost" @click="router.push('/catalog')">Назад у каталог</BaseButton>
      </div>
    </EmptyState>

    <BaseCard v-else :padded="false" class="overflow-hidden">
      <div class="grid lg:grid-cols-[1.15fr_0.85fr]">
        <section class="bg-white border-b xl:border-b-0 xl:border-r border-neutral-200 p-4 sm:p-6 xl:p-8">
          <div class="w-full max-w-[560px] mx-auto rounded-2xl overflow-hidden">
            <img
              v-if="product.imageUrl"
              :src="product.imageUrl"
              :alt="product.title"
              class="h-[240px] sm:h-[300px] xl:h-[360px] w-full object-contain"
            />
            <div v-else class="h-full w-full grid place-items-center text-neutral-400 text-sm">
              Немає фото товару
            </div>
          </div>

          <div class="mt-4 grid gap-2 text-sm text-neutral-500 sm:grid-cols-2">
            <div class="rounded-lg bg-neutral-100 px-3 py-2">Бренд: {{ product.brand }}</div>
            <div class="rounded-lg bg-neutral-100 px-3 py-2">Категорія: {{ product.category.name }}</div>
          </div>
        </section>

        <section class="bg-neutral-50 p-4 sm:p-6 xl:p-8">
          <div class="flex flex-col gap-5">
            <div>
              <div class="text-xs uppercase tracking-wider text-neutral-500">AutoPulse</div>
              <h1 class="mt-2 text-2xl sm:text-3xl font-extrabold text-neutral-900">
                {{ product.title }}
              </h1>
              <p class="mt-3 text-neutral-700 whitespace-pre-line leading-relaxed">
                {{ product.description }}
              </p>
            </div>

            <div class="flex flex-col gap-4">
              <div class="flex flex-wrap items-center gap-3">
                <div class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base font-semibold text-neutral-700">
                  {{ product.price }} ₴
                </div>
                <BaseButton variant="primary" class="justify-center" @click="addToCart">
                  Додати в кошик
                </BaseButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </BaseCard>

    <div v-if="recommended.length > 0" class="grid gap-4">
      <h2 class="text-xl font-bold text-neutral-900">Рекомендовані товари</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="p in recommended"
          :key="p.id"
          :to="`/products/${p.id}`"
          class="block h-full"
        >
          <BaseCard hoverable class="h-full cursor-pointer transition-transform duration-150 hover:-translate-y-0.5">
            <div class="grid gap-3">
              <div class="relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                <img
                  v-if="p.imageUrl"
                  :src="p.imageUrl"
                  :alt="p.title"
                  class="h-40 w-full object-cover"
                />
                <div v-else class="grid h-40 place-items-center text-sm text-neutral-400">
                  Немає фото
                </div>
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
    </div>
  </div>
</template>

