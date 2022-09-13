<script setup lang="ts">
import axios from 'axios'
import {
  rgb,
  PDFDocument,
  PDFName,
  PDFString,
  PDFArray,
  PDFPage,
} from 'pdf-lib'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const fileInput = ref<HTMLInputElement>()
const pdfNumber = ref<number>()
const loading = ref(false)

function registerPageLink(page: PDFPage, uri: string, box: number[]) {
  const newAnnotation = page.doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: box,
    Border: [0, 0, 0],
    C: [0, 0, 1],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of(uri),
    },
  })

  const annotations = page.node.lookup(PDFName.of('Annots'), PDFArray).asArray()
  annotations.push(page.doc.context.register(newAnnotation))

  page.node.set(PDFName.of('Annots'), page.doc.context.obj(annotations))
}

function downloadFile(data: ArrayBuffer, name: string, type: string): void {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  window.URL.revokeObjectURL(url)
}

async function createPdf(pdfBytes: ArrayBuffer) {
  const id = route.params.id
  const baseUrl = `${window.location.origin}/c/${id}/${pdfNumber.value}/`
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()
  let i = 1

  for (const page of pages) {
    const res = await axios.get(`/api/${id}/qr/${pdfNumber.value}/${i}`)
    const path = res.data.match(/<path (.*) d="(.*)"/)[2]

    page.moveTo(0, 0)
    page.drawSvgPath(path, {
      x: page.getWidth() - 66,
      y: page.getHeight(),
      color: rgb(0, 0, 0),
      scale: 0.2,
    })

    registerPageLink(page, baseUrl + i++, [
      page.getWidth() - 5,
      page.getHeight() - 5,
      page.getWidth() - 60,
      page.getHeight() - 60,
    ])
  }

  const savedPdf = await pdfDoc.save()

  downloadFile(savedPdf, `Cours ${pdfNumber.value} QR.pdf`, 'application/pdf')
}

async function submitPdf() {
  if (!fileInput.value?.files) {
    return
  }

  const file = fileInput.value.files[0]
  const reader = new FileReader()

  loading.value = true

  await axios.post(`/api/${route.params.id}/pdf/${pdfNumber.value}`, file, {
    headers: { 'Content-Type': file.type },
  })

  reader.readAsArrayBuffer(file)
  reader.onloadend = async (event) => {
    if (event.target?.readyState === FileReader.DONE) {
      await createPdf(event.target.result as ArrayBuffer)
    }

    loading.value = false
  }
}
</script>

<template>
  <h2>Création du PDF</h2>

  <form @submit.prevent="submitPdf" class="mb-4">
    <div class="row g-3">
      <div class="col-md-6 mb-3">
        <label for="coursePdf" class="form-label">N° du cours</label>
        <input
          v-model="pdfNumber"
          class="form-control"
          type="number"
          id="coursePdf"
          required
        />
      </div>

      <div class="col-md-6 mb-3">
        <label for="formFile" class="form-label">PDF</label>
        <input
          ref="fileInput"
          class="form-control"
          type="file"
          accept="application/pdf"
          required
        />
      </div>
    </div>

    <button type="submit" class="btn btn-primary" :disabled="loading">
      <span v-if="loading" class="spinner-border spinner-border-sm"></span>
      Valider
    </button>
  </form>
</template>
