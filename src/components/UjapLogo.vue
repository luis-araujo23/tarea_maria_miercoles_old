<script setup lang="ts">
defineProps<{ size?: number }>();
</script>

<template>
  <img
    src="/ujap-logo.png"
    alt="Escudo Universidad José Antonio Páez"
    class="ujap-logo"
    :style="{ height: `${size ?? 48}px` }"
  />
</template>

<style scoped>
.ujap-logo {
  width: auto;
  object-fit: contain;
  display: block;
}
</style>
