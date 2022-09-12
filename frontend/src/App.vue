<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="container text-center my-5">
    <div class="row justify-content-center mb-3">
      <div class="col-md-6 col-lg-3">
        <img alt="Logo" class="img-fluid mb-3" src="@/assets/logo.svg" />
      </div>
    </div>

    <h1>QR Code</h1>

    <RouterView />

    <hr class="mt-4" />

    <p class="text-muted">
      Réalisé pour le
      <a href="https://people.epfl.ch/nicolas.grandjean" target="_blank">
        Prof. Nicolas Grandjean
      </a>
      par
      <a href="https://people.epfl.ch/paul.gerry" target="_blank">Paul Gerry</a>
      avec la participation de
      <a href="https://people.epfl.ch/samuel.wahba" target="_blank">
        Samuel Wahba
      </a>
      .
    </p>
  </div>
</template>
