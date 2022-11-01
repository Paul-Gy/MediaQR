<script setup lang="ts">
import type {
  PointOptionsObject,
  PointClickCallbackFunction,
  SeriesPieOptions,
} from 'highcharts'

import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Highcharts from 'highcharts/highstock'
import HighchartsDrilldown from 'highcharts/modules/drilldown'
import Highcharts3d from 'highcharts/highcharts-3d'
import BootstrapLoader from '@/components/BootstrapLoader.vue'

interface StatsResponse {
  data: number[]
  drilldown: SeriesPieOptions[]
  dates: Record<string, number>
  total: number
  basePdfUrl: string
}

HighchartsDrilldown(Highcharts)
Highcharts3d(Highcharts)

const route = useRoute()

const stats = ref<StatsResponse>()
const errorMessage = ref<string>()

onMounted(async () => {
  try {
    const response = await axios.get(`/api/${route.params.id}/stats`)

    stats.value = response.data

    setTimeout(() => createStatsCharts(), 50)
  } catch (e) {
    console.error(e)

    errorMessage.value = `Une erreur est survenue: ${e}`
  }
})

function createStatsCharts() {
  if (!stats.value || !stats.value?.total) {
    return
  }

  const series = stats.value.drilldown

  series.forEach((serie) => {
    const data = serie.data as PointOptionsObject[]
    const url = stats.value?.basePdfUrl.replace('{id}', serie?.id || '') || '#'

    const clickHandler: PointClickCallbackFunction = function () {
      window.open(url + '#page=' + this.options.id)
    }

    data.forEach((value) => (value.events = { click: clickHandler }))
  })

  new Highcharts.Chart({
    chart: {
      renderTo: 'coursesStats',
      type: 'pie',
      options3d: {
        enabled: true,
        alpha: 45,
      },
    },
    title: {
      text: 'Statistiques par cours',
    },
    series: [
      {
        type: 'pie',
        name: 'Nombre de vues',
        data: stats.value.data,
      },
    ],
    drilldown: { series },
    plotOptions: {
      pie: { depth: 25 },
    },
    accessibility: { enabled: false },
  })

  const dates = stats.value.dates

  const timeData = Object.keys(dates)
    .map((date) => [Date.parse(date + 'T12:00:00'), dates[date]])
    .sort((a, b) => b[0] - a[0])

  Highcharts.stockChart({
    chart: {
      type: 'area',
      renderTo: 'dateStats',
    },
    title: {
      text: 'Nombre de vues par jour',
    },
    series: [
      {
        type: 'area',
        name: 'Total',
        data: timeData,
      },
    ],
    accessibility: {
      enabled: false,
    },
  })
}
</script>

<template>
  <h2>Stats</h2>

  <div class="row mb-5" v-if="stats && stats.total > 0">
    <h3 class="mb-5">Total: {{ stats.total }}</h3>

    <div class="col-md-6">
      <div>
        <div id="coursesStats"></div>
      </div>
    </div>

    <div class="col-md-6">
      <div id="dateStats"></div>
    </div>
  </div>

  <div v-else-if="stats" class="alert alert-danger">
    Ce cours n'existe pas encore.
  </div>

  <BootstrapLoader v-else :error="errorMessage" />
</template>

<style>
#coursesStats .highcharts-point {
  cursor: pointer;
}
</style>
