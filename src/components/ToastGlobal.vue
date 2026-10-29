<script setup lang="ts">
import { usarToast } from '../composables/useToast'
import ToastNotificacion from './ToastNotificacion.vue'

const { visible, mensaje, tipo } = usarToast()
</script>

<template>
  <ToastNotificacion
    v-if="visible"
    :visible="visible"
    :mensaje="mensaje"
    :tipo="tipo"
  />
</template>
