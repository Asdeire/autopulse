<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { useAuthStore } from '../stores/auth'
import { useGarageStore } from '../stores/garage'
import type { VehicleSpec } from '../types/garage'

const router = useRouter()
const auth = useAuthStore()
const garage = useGarageStore()

const userEmail = computed(() => auth.userEmail || 'Невідомий користувач')
const addError = ref<string | null>(null)
const isAddingVehicle = ref(false)

const selectedMakeId = ref('')
const selectedModelId = ref('')
const selectedYear = ref('')
const selectedSpecId = ref('')
const nickname = ref('')
const modelSpecs = ref<VehicleSpec[]>([])

const availableYears = computed(() => {
  const years = new Set<number>()
  for (const spec of modelSpecs.value) {
    for (let year = spec.yearFrom; year <= spec.yearTo; year += 1) {
      years.add(year)
    }
  }
  return [...years].sort((a, b) => b - a)
})

const filteredSpecs = computed(() => {
  if (!selectedYear.value) return modelSpecs.value
  const year = Number(selectedYear.value)
  return modelSpecs.value.filter((spec) => spec.yearFrom <= year && spec.yearTo >= year)
})

async function onLogout() {
  auth.logout()
  await router.push('/login')
}

async function onAddVehicle() {
  addError.value = null
  if (!selectedSpecId.value) {
    addError.value = 'Оберіть конкретну модифікацію авто'
    return
  }

  isAddingVehicle.value = true
  try {
    await garage.addMyVehicle({
      vehicleSpecId: Number(selectedSpecId.value),
      nickname: nickname.value.trim() || undefined,
      isPrimary: garage.vehicles.length === 0,
    })
    nickname.value = ''
    selectedSpecId.value = ''
  } catch {
    addError.value = garage.error || 'Не вдалося додати авто'
  } finally {
    isAddingVehicle.value = false
  }
}

async function onSetPrimary(id: number) {
  await garage.makePrimary(id)
}

async function onDeleteVehicle(id: number) {
  const confirmed = window.confirm('Ви дійсно хочете видалити це авто з гаража?')
  if (!confirmed) return
  await garage.removeMyVehicle(id)
}

watch(selectedMakeId, async (newValue) => {
  selectedModelId.value = ''
  selectedYear.value = ''
  selectedSpecId.value = ''
  modelSpecs.value = []
  garage.models = []
  garage.specs = []
  if (!newValue) return
  await garage.fetchModels(Number(newValue))
})

watch(selectedModelId, async (modelId) => {
  selectedYear.value = ''
  selectedSpecId.value = ''
  modelSpecs.value = []
  if (!modelId) return
  await garage.fetchSpecs({
    modelId: Number(modelId)
  })
  modelSpecs.value = garage.specs
})

watch(selectedYear, () => {
  selectedSpecId.value = ''
})

onMounted(async () => {
  await Promise.all([garage.fetchMakes(), garage.fetchMyVehicles()])
})
</script>

<template>
  <div class="grid gap-6">
    <div>
      <h2 class="text-2xl font-extrabold text-neutral-900">Профіль</h2>
      <p class="mt-1 text-neutral-500">Перегляд даних вашого акаунта.</p>
    </div>

    <BaseCard>
      <div class="grid gap-4">
        <div>
          <div class="text-sm text-neutral-500">Електронна пошта</div>
          <div class="text-lg font-semibold text-neutral-900">{{ userEmail }}</div>
        </div>
        <div class="text-sm text-neutral-500">
          Основне авто:
          <span class="font-semibold text-neutral-900">
            {{ garage.primaryVehicle?.vehicleSpec.normalizedName || 'не обрано' }}
          </span>
        </div>

        <div class="pt-3 border-t border-neutral-200">
          <BaseButton variant="danger" @click="onLogout">Вийти з акаунта</BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="grid gap-4">
        <h3 class="text-lg font-bold text-neutral-900">Мій гараж</h3>

        <div v-if="garage.error" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ garage.error }}
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="block">
            <span class="block text-sm font-semibold text-neutral-800 mb-1">Марка</span>
            <select v-model="selectedMakeId" class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900">
              <option value="">Оберіть марку</option>
              <option v-for="make in garage.makes" :key="make.id" :value="String(make.id)">{{ make.name }}</option>
            </select>
          </label>
          <label class="block">
            <span class="block text-sm font-semibold text-neutral-800 mb-1">Модель</span>
            <select v-model="selectedModelId" class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900" :disabled="!selectedMakeId">
              <option value="">Оберіть модель</option>
              <option v-for="model in garage.models" :key="model.id" :value="String(model.id)">{{ model.name }}</option>
            </select>
          </label>
          <label class="block">
            <span class="block text-sm font-semibold text-neutral-800 mb-1">Рік</span>
            <select v-model="selectedYear" class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900" :disabled="!selectedModelId">
              <option value="">Оберіть рік</option>
              <option v-for="year in availableYears" :key="year" :value="String(year)">{{ year }}</option>
            </select>
          </label>
          <label class="block">
            <span class="block text-sm font-semibold text-neutral-800 mb-1">Двигун/модифікація</span>
            <select v-model="selectedSpecId" class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900" :disabled="!selectedModelId">
              <option value="">Оберіть авто</option>
              <option v-for="spec in filteredSpecs" :key="spec.id" :value="String(spec.id)">
                {{ spec.normalizedName }}
              </option>
            </select>
          </label>
        </div>

        <BaseInput v-model="nickname" label="Нотатка (опційно)" placeholder="Напр. Сімейне авто" />

        <div v-if="addError" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ addError }}</div>

        <div>
          <BaseButton variant="primary" :loading="isAddingVehicle" @click="onAddVehicle">Додати авто</BaseButton>
        </div>

        <div class="pt-4 border-t border-neutral-200 grid gap-3">
          <div v-if="!garage.vehicles.length" class="text-sm text-neutral-500">У вас ще немає авто в гаражі.</div>
          <div v-for="vehicle in garage.vehicles" :key="vehicle.id" class="rounded-md border border-neutral-200 p-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="font-semibold text-neutral-900">
                  {{ vehicle.nickname || vehicle.vehicleSpec.normalizedName }}
                </div>
                <div class="text-sm text-neutral-500">{{ vehicle.vehicleSpec.normalizedName }}</div>
              </div>
              <div class="flex items-center gap-2">
                <BaseBadge v-if="vehicle.isPrimary" variant="neutral">Основне</BaseBadge>
                <BaseButton v-else variant="ghost" size="sm" @click="onSetPrimary(vehicle.id)">Зробити основним</BaseButton>
                <BaseButton variant="ghost" size="sm" @click="onDeleteVehicle(vehicle.id)">Видалити</BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
