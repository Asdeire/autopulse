<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { getApiErrorInfo } from '../services/api-errors'
import * as adminProductsApi from '../services/admin-products.api'
import { getCategories } from '../services/catalog.api'
import { getVehicleSpecs } from '../services/garage.api'
import type { Category } from '../types/catalog'
import type { VehicleSpec } from '../types/garage'

const route = useRoute()
const router = useRouter()

const productId = computed(() => {
  const parsed = Number(route.params.id)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})
const isEditMode = computed(() => productId.value !== null)

const title = ref('')
const description = ref('')
const brand = ref('')
const price = ref('')
const categoryId = ref('')
const imageUrl = ref('')
const selectedVehicleSpecIds = ref<number[]>([])
const vehicleSearch = ref('')

const categories = ref<Category[]>([])
const vehicleSpecs = ref<VehicleSpec[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const filteredVehicleSpecs = computed(() => {
  const search = vehicleSearch.value.trim().toLowerCase()
  if (!search) return vehicleSpecs.value
  return vehicleSpecs.value.filter((spec) => spec.normalizedName.toLowerCase().includes(search))
})

function toSortedUniqueIds(ids: number[]) {
  return Array.from(new Set(ids)).sort((a, b) => a - b)
}

function toggleVehicleSpec(specId: number) {
  const selected = new Set(selectedVehicleSpecIds.value)
  if (selected.has(specId)) {
    selected.delete(specId)
  } else {
    selected.add(specId)
  }
  selectedVehicleSpecIds.value = Array.from(selected)
}

async function fetchDependencies() {
  const [categoriesData, vehicleSpecsData] = await Promise.all([getCategories(), getVehicleSpecs({})])
  categories.value = categoriesData
  vehicleSpecs.value = vehicleSpecsData
}

async function fetchProduct() {
  if (!isEditMode.value || !productId.value) return
  const product = await adminProductsApi.getAdminProductById(productId.value)
  title.value = product.title
  description.value = product.description
  brand.value = product.brand
  price.value = String(product.price)
  categoryId.value = String(product.categoryId)
  imageUrl.value = product.imageUrl
  selectedVehicleSpecIds.value = toSortedUniqueIds(product.vehicleSpecIds)
}

async function initialize() {
  loading.value = true
  error.value = null
  try {
    await fetchDependencies()
    await fetchProduct()
  } catch (e) {
    error.value = getApiErrorInfo(e).message
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  const parsedCategoryId = Number(categoryId.value)
  const parsedPrice = Number(price.value)

  if (!title.value.trim() || !description.value.trim() || !brand.value.trim()) {
    error.value = 'Заповніть назву, опис та бренд.'
    return
  }
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    error.value = 'Ціна повинна бути більшою за 0.'
    return
  }
  if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
    error.value = 'Оберіть категорію.'
    return
  }

  saving.value = true
  error.value = null
  try {
    const payload = {
      title: title.value.trim(),
      description: description.value.trim(),
      brand: brand.value.trim(),
      price: parsedPrice,
      categoryId: parsedCategoryId,
      imageUrl: imageUrl.value.trim() ? imageUrl.value.trim() : null,
      vehicleSpecIds: toSortedUniqueIds(selectedVehicleSpecIds.value),
    }

    if (isEditMode.value && productId.value) {
      await adminProductsApi.updateAdminProduct(productId.value, payload)
    } else {
      await adminProductsApi.createAdminProduct(payload)
    }

    await router.push('/admin/products')
  } catch (e) {
    error.value = getApiErrorInfo(e).message
  } finally {
    saving.value = false
  }
}

onMounted(initialize)
</script>

<template>
  <div class="grid gap-6">
    <BaseCard>
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-xl font-bold text-neutral-900">
          {{ isEditMode ? 'Редагування товару' : 'Новий товар' }}
        </h1>
        <BaseButton variant="ghost" @click="router.push('/admin/products')">Назад</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-if="loading">
      <div class="text-sm text-neutral-600">Завантаження...</div>
    </BaseCard>

    <BaseCard v-else>
      <form class="grid gap-4" @submit.prevent="submitForm">
        <BaseInput v-model="title" label="Назва" placeholder="Назва товару" />
        <BaseInput v-model="brand" label="Бренд" placeholder="Наприклад: Bosch" />

        <label class="block">
          <span class="block text-sm font-semibold text-neutral-800 mb-1">Опис</span>
          <textarea
            v-model="description"
            rows="4"
            class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-all duration-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            placeholder="Короткий опис товару..."
          />
        </label>

        <div class="grid gap-4 md:grid-cols-2">
          <BaseInput v-model="price" label="Ціна" type="number" placeholder="0.00" />
          <label class="block">
            <span class="block text-sm font-semibold text-neutral-800 mb-1">Категорія</span>
            <select
              v-model="categoryId"
              class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-all duration-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            >
              <option value="">Оберіть категорію</option>
              <option v-for="category in categories" :key="category.id" :value="String(category.id)">
                {{ category.name }}
              </option>
            </select>
          </label>
        </div>

        <BaseInput
          v-model="imageUrl"
          label="URL фото (необов'язково)"
          placeholder="Залиште порожнім для дефолтного зображення"
        />

        <div class="grid gap-2">
          <div class="text-sm font-semibold text-neutral-800">Сумісність (Vehicle Specs)</div>
          <BaseInput v-model="vehicleSearch" placeholder="Фільтр по назві авто..." />
          <div class="max-h-64 overflow-y-auto rounded-md border border-neutral-200 p-3">
            <label
              v-for="spec in filteredVehicleSpecs"
              :key="spec.id"
              class="flex items-start gap-2 py-1 text-sm text-neutral-800"
            >
              <input
                type="checkbox"
                class="mt-1"
                :checked="selectedVehicleSpecIds.includes(spec.id)"
                @change="toggleVehicleSpec(spec.id)"
              />
              <span>{{ spec.normalizedName }}</span>
            </label>
            <div v-if="!filteredVehicleSpecs.length" class="text-sm text-neutral-500">
              Нічого не знайдено.
            </div>
          </div>
        </div>

        <div v-if="error" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ error }}
        </div>

        <div class="flex items-center gap-2">
          <BaseButton type="submit" variant="primary" :loading="saving">
            {{ isEditMode ? 'Оновити' : 'Створити' }}
          </BaseButton>
          <BaseButton type="button" variant="ghost" @click="router.push('/admin/products')">Скасувати</BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>
