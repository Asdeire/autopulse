<script setup lang="ts">
import BaseButton from '../components/ui/BaseButton.vue'
import EmptyState from '../components/common/EmptyState.vue'
</script>

<template>
  <EmptyState title="Сторінку не знайдено" description="Схоже, ви перейшли за неправильним посиланням.">
    <RouterLink to="/">
      <BaseButton variant="primary">На головну</BaseButton>
    </RouterLink>
  </EmptyState>
</template>

