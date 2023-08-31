<script setup lang="ts">
import axios from 'axios'
import { PDFDocument } from 'pdf-lib'
import { useRoute } from 'vue-router'
import { reactive, ref } from 'vue'
import ExternalIcon from '@/icons/ExternalIcon.vue'
import LinkIcon from '@/icons/LinkIcon.vue'

interface CourseData {
  url: string
  times: string[]
  urls: Record<number, string>
}

const route = useRoute()

const authenticated = ref(false)
const loading = ref(false)
const editToken = ref('')
const successMessage = ref<string>()
const errorMessage = ref<string>()
const data = reactive<CourseData[]>([])

function toggleUrl(urls: Record<string, string>, id: number) {
  if (id in urls) {
    delete urls[id]
  } else {
    urls[id] = ''
  }
}

async function save() {
  successMessage.value = ''
  errorMessage.value = ''
  loading.value = true

  try {
    await axios.post(`/api/${route.params.id}/edit`, data, {
      headers: {
        'X-Token': editToken.value,
      },
    })

    successMessage.value = 'Les cours ont bien été mis à jour.'
  } catch (e) {
    console.error(e)

    errorMessage.value = `Une erreur est survenue: ${e}`
  }

  loading.value = false
}

async function auth() {
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await axios.get(`/api/${route.params.id}/edit`, {
      headers: {
        'X-Token': editToken.value,
      },
    })

    if (response.status === 403) {
      errorMessage.value = 'Erreur: token invalide'
      return
    }

    if (!response.data) {
      loading.value = false
      return
    }

    const responseData: CourseData[] = response.data

    authenticated.value = true
    responseData.forEach((info) => {
      if (!info.urls) {
        info.urls = {}
      }
      data.push(info)
    })
  } catch (e) {
    console.error(e)

    errorMessage.value = `Une erreur est survenue: ${e}`
  }

  loading.value = false
}

function addCourse() {
  data.push({
    url: '',
    times: [],
    urls: {},
  })
}

function updateCourse(event: Event, course: CourseData) {
  if (!(event.target instanceof HTMLInputElement) || !event.target.files) {
    return
  }

  const reader = new FileReader()
  const file = event.target.files[0]

  if (!file) {
    return
  }

  reader.onload = async () => {
    const array = new Uint8Array(reader.result as ArrayBuffer)
    const pdf = await PDFDocument.load(array)
    course.times = []
    course.urls = {}

    pdf.getPages().forEach(() => course.times.push(''))
  }

  reader.readAsArrayBuffer(file)
}
</script>

<template>
  <form v-if="authenticated" @submit.prevent="save">
    <h2>Liste des cours</h2>

    <div v-for="(info, id) in data" :key="id" class="card mb-3 shadow-3">
      <div class="card-body">
        <h3 class="card-title">Cours N°{{ id + 1 }}</h3>

        <div class="row g-3">
          <div class="col-md-12 mb-3">
            <label class="form-label" :for="'url-' + id">URL de la vidéo</label>
            <div class="input-group">
              <input
                v-model="info.url"
                type="url"
                class="form-control"
                :id="'url-' + id"
                required
                placeholder="https://tube.switch.ch/videos/..."
              />
              <a
                class="btn btn-outline-secondary"
                target="_blank"
                :href="info.url"
              >
                Ouvrir <ExternalIcon />
              </a>
            </div>
          </div>

          <!-- <div class="col-md-6 mb-3">
            <label class="form-label" :for="'file-' + id">PDF du cours</label>
            <input
              type="file"
              class="form-control"
              :id="'file-' + id"
              @change="updateCourse($event, info)"
              accept=".pdf"
            />
          </div>-->
        </div>

        <h3 class="card-title">Slides</h3>

        <div class="row g-3">
          <div
            v-for="(time, idd) in info.times"
            :key="idd"
            class="mb-3 col-md-6"
          >
            <div class="input-group">
              <span class="input-group-text"> Slide N°{{ idd + 1 }} </span>
              <input
                v-model="info.times[idd]"
                type="text"
                pattern="[0-9]+(:[0-9]+)?(:[0-9]+)?|(-1)"
                class="form-control"
                placeholder="1:23"
              />
              <button
                type="button"
                class="btn btn-outline-primary"
                title="Utiliser un lien externe"
                @click="toggleUrl(info.urls, idd + 1)"
              >
                <LinkIcon />
              </button>
            </div>

            <div
              class="input-group mt-3"
              v-if="info.urls[idd + 1] !== undefined"
            >
              <a
                class="btn btn-outline-secondary"
                target="_blank"
                :href="info.urls[idd + 1]"
              >
                Ouvrir <ExternalIcon />
              </a>
              <input
                v-model="info.urls[idd + 1]"
                type="text"
                class="form-control"
                value=""
                placeholder="https://tube.switch.ch/videos"
              />
              <span class="form-text">
                Un lien externe peut être utilisé pour ce QR code, par exemple
                si une slide a été présentée dans une vidéo différente.
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-small m-2"
          @click="info.times.push('')"
        >
          Ajouter une slide au cours N°{{ id + 1 }}
        </button>
        <button
          type="button"
          class="btn btn-warning btn-small m-1"
          @click="info.times.pop()"
        >
          Retirer une slide du cours N°{{ id + 1 }}
        </button>
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="col-lg-3 col-md-6 d-grid mb-3">
        <button type="button" class="btn btn-primary mb-2" @click="addCourse">
          Ajouter un cours
        </button>

        <button type="button" class="btn btn-warning mb-2" @click="data.pop()">
          Retirer un cours
        </button>

        <button type="submit" class="btn btn-success" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm"></span>
          Enregistrer
        </button>
      </div>
    </div>
  </form>

  <form v-else class="row justify-content-center" @submit.prevent="auth">
    <div class="col-lg-3 col-md-6">
      <div class="mb-3">
        <label class="form-label" for="token">Token d'édition</label>
        <input
          v-model="editToken"
          type="text"
          id="token"
          class="form-control"
          required
        />
      </div>

      <div class="d-grid">
        <button type="submit" class="btn btn-success" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm"></span>
          Valider
        </button>
      </div>
    </div>
  </form>

  <hr />
  <a
    href="https://tube.switch.ch/channels/X4KJsG1os5"
    class="btn btn-info mx-2"
    target="_blank"
    rel="noopener"
  >
    Switchtube
  </a>
  <hr />

  <div class="row justify-content-center mb-3">
    <div class="col-md-6 mt-3">
      <div v-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>
