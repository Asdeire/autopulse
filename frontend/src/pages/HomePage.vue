<script setup lang="ts">
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
</script>

<template>
  <div class="grid gap-6">
    <BaseCard hoverable class="overflow-hidden">
      <div class="grid gap-4 sm:grid-cols-2 items-center">
        <div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-neutral-900">
            AutoPulse — автотовари без зайвого шуму
          </h1>
          <p class="mt-2 text-neutral-500">
            Перейдіть в каталог, щоб знайти деталі, мастила, аксесуари та інше.
          </p>
          <div class="mt-5 flex items-center gap-3">
            <RouterLink to="/catalog">
              <BaseButton variant="primary">Відкрити каталог</BaseButton>
            </RouterLink>
            <RouterLink to="/cart">
              <BaseButton variant="ghost">Перейти в кошик</BaseButton>
            </RouterLink>
          </div>
        </div>
        <div class="hidden sm:block">
          <img src="../assets/hero.png" alt="Головний банер AutoPulse" class="w-full rounded-lg shadow-sm" />
        </div>
      </div>
    </BaseCard>
  </div>
</template>

