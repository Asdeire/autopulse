<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import EmptyState from '../components/common/EmptyState.vue'
import Loader from '../components/common/Loader.vue'
import { useCartStore } from '../stores/cart'
import { useCatalogStore } from '../stores/catalog'
import type { Product } from '../types/catalog'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const catalog = useCatalogStore()

const product = ref<Product | null>(null)
const qty = ref('1')

const id = computed(() => Number(route.params.id))

const quantity = computed(() => {
  const n = Math.floor(Number(qty.value))
  return Number.isFinite(n) && n > 0 ? n : 1
})

async function load() {
  product.value = await catalog.fetchProductById(id.value)
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
    quantity.value,
  )
  router.push('/cart')
}

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
      <div class="grid xl:grid-cols-[1.15fr_0.85fr]">
        <section class="bg-white border-b xl:border-b-0 xl:border-r border-neutral-200 p-4 sm:p-6 xl:p-8">
          <div class="aspect-square w-full rounded-2xl border border-neutral-200 bg-neutral-100 overflow-hidden">
            <img
              v-if="product.imageUrl"
              :src="product.imageUrl"
              :alt="product.title"
              class="h-full w-full object-contain p-6 sm:p-8"
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
          <div class="flex h-full flex-col gap-5">
            <div>
              <div class="text-xs uppercase tracking-wider text-neutral-500">AutoPulse</div>
              <h1 class="mt-2 text-2xl sm:text-3xl font-extrabold text-neutral-900">
                {{ product.title }}
              </h1>
              <p class="mt-3 text-neutral-700 whitespace-pre-line leading-relaxed">
                {{ product.description }}
              </p>
            </div>

            <div class="mt-auto grid gap-4">
              <div class="inline-flex w-fit items-center rounded-full bg-yellow-400 px-4 py-2 text-lg font-extrabold text-neutral-900">
                {{ product.price }} ₴
              </div>

              <div class="w-32">
                <BaseInput v-model="qty" label="Кількість" type="number" name="qty" />
              </div>

              <div class="grid gap-2 sm:grid-cols-2">
                <BaseButton variant="primary" class="justify-center" @click="addToCart">
                  Додати в кошик
                </BaseButton>
                <BaseButton variant="ghost" class="justify-center" @click="router.push('/catalog')">
                  Назад у каталог
                </BaseButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </BaseCard>
  </div>
</template>

