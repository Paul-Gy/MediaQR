<script setup lang="ts">
const rainbow = Math.random() > 0.9
</script>

<template>
  <h2>Cette slide n'est pas couverte dans ce cours !</h2>
  <h3 class="mb-4">Essayez une autre slide ou un autre cours</h3>

  <img
    v-if="rainbow"
    alt="Error"
    class="img-fluid"
    src="@/assets/error-rainbow.svg"
    width="400"
  />

  <img v-else alt="No" class="img-fluid" src="@/assets/error.svg" width="400" />
</template>
