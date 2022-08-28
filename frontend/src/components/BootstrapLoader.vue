<script setup lang="ts">
defineProps<{ error?: string }>()
</script>

<template>
  <div v-if="error" class="alert alert-danger text-center">
    Une erreur est survenue: {{ error }}
  </div>

  <div v-else class="text-center pt-3">
    <div class="spinner-border mb-3" role="status" />

    <h1>Chargement...</h1>
  </div>
</template>
