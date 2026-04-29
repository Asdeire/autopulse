<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-neutral-900 text-white border-t border-neutral-800">
    <div class="ap-container py-8 sm:py-10">
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div class="grid gap-3">
          <div class="text-lg font-extrabold tracking-wide">AutoPulse</div>
          <p class="text-sm text-neutral-300 max-w-sm">
            Онлайн-магазин автотоварів: швидкий пошук, зручне замовлення та контроль покупок в одному місці.
          </p>
        </div>

        <div class="grid gap-3 text-sm">
          <div class="font-semibold text-white">Навігація</div>
          <nav class="grid gap-2 text-neutral-300">
            <RouterLink to="/catalog" class="hover:text-yellow-400 transition-colors">Каталог</RouterLink>
            <RouterLink to="/cart" class="hover:text-yellow-400 transition-colors">Кошик</RouterLink>
            <RouterLink to="/orders" class="hover:text-yellow-400 transition-colors">Мої замовлення</RouterLink>
          </nav>
        </div>

        <div class="grid gap-3 text-sm">
          <div class="font-semibold text-white">Контакти</div>
          <div class="text-neutral-300">support@autopulse.ua</div>
          <div class="text-neutral-300">+380 (67) 000-00-00</div>
          <div class="text-neutral-400 text-xs">Пн-Нд: 09:00 - 20:00</div>
        </div>
      </div>

      <div class="mt-8 pt-4 border-t border-neutral-800 text-xs text-neutral-400 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div>© {{ year }} AutoPulse. Всі права захищено.</div>
        <div>Інтернет-магазин автотоварів</div>
      </div>
    </div>
  </footer>
</template>

