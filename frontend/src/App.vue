<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="container text-center my-5">
    <div class="row justify-content-center mb-3">
      <div class="col-md-6 col-lg-3">
        <img alt="Logo" class="img-fluid" src="@/assets/logo.svg" />
      </div>
    </div>

    <h1>QR Code</h1>

    <RouterView />

    <hr />

    <p class="text-muted">
      Réalisé par
      <a href="https://people.epfl.ch/paul.gerry">Paul Gerry</a> avec la
      participation de
      <a href="https://people.epfl.ch/samuel.wahba">Samuel Wahba</a>.
    </p>
  </div>
</template>
