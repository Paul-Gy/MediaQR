export default `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
    <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.4.0/dist/pdf-lib.min.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/downloadjs@1.4.7/download.min.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.prod.js"></script>
    <title>Edition - Time QR</title>
</head>

<body>
<div id="app" class="container text-center my-5">
    <h1>Time QR Code - Physique STI</h1>

    <form v-if="login" @submit.prevent="save">
        <h2>Liste des cours</h2>

        <div v-for="(info, id) in data" class="card mb-3 shadow-3">
            <div class="card-body">
                <h3 class="card-title">Cours N°{{ id + 1 }}</h3>

                <div class="row g-3">
                    <div class="col-md-6 mb-3">
                        <label class="form-label" :for="'url-' + id">URL de la vidéo</label>
                        <input v-model="info.url" type="url" class="form-control" :id="'url-' + id"
                               required placeholder="https://tube.switch.ch/videos/...">
                    </div>
                    
                    <div class="col-md-6 mb-3">
                        <label class="form-label" :for="'file-' + id">PDF du cours</label>
                        <input type="file" class="form-control" :id="'file-' + id"
                                @change="updateCourse($event, info.times)" accept=".pdf">
                    </div>
                </div>

                <h3 class="card-title">Slides</h3>

                <div class="row g-3">
                    <div v-for="(time, idd) in info.times" :key="idd" class="mb-3 col-md-6">
                        <div class="input-group">
                            <span class="input-group-text">Slide N°{{ idd + 1 }}</span>
                            <input v-model="info.times[idd]" type="text" pattern="[0-9]+(:[0-9]+)?(:[0-9]+)?" class="form-control"
                                   placeholder="1:23">
                        </div>
                    </div>
                </div>

                <button type="button" class="btn btn-primary btn-small m-2" @click="info.times.push('')">
                    Ajouter une slide au cours N°{{ id + 1 }}
                </button>
                <button type="button" class="btn btn-warning btn-small m-1" @click="info.times.pop()">
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

                <button type="submit" class="btn btn-success">
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
                <input v-model="token" type="text" id="token" class="form-control" required>
            </div>

            <div class="d-grid">
                <button type="submit" class="btn btn-success" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm"></span>
                    Valider
                </button>
            </div>
        </div>
    </form>

    <div class="row justify-content-center mb-3">
        <div class="col-md-6 mt-3">
            <div v-if="error" class="alert alert-danger">
                {{ error }}
            </div>

            <div v-if="success" class="alert alert-success">
                {{ success }}
            </div>
        </div>
    </div>

    <hr class="my-3">

    <h2>Auto PDF</h2>

    <form method="GET" @submit.prevent="createPdf" class="mb-4">
        <div class="row g-3">
            <div class="col-md-6 mb-3">
                <label for="coursePdf" class="form-label">N° du cours</label>
                <input v-model="pdfNumber" class="form-control" type="number" id="coursePdf" required>
            </div>

            <div class="col-md-6 mb-3">
                <label for="formFile" class="form-label">PDF</label>
                <input class="form-control" type="file" id="formFile" accept="application/pdf" required>
            </div>
        </div>

        <button type="submit" class="btn btn-primary">
            Go !
        </button>
    </form>

    <p class="text-muted">Réalisé par Paul Gerry avec la participation de Samuel Wahba</p>
</div>

<script>
    Vue.createApp({
        data() {
            return {
                success: null,
                error: null,
                token: '',
                login: false,
                data: null,
                loading: false,
                pdfNumber: 1,
            }
        },
        methods: {
            auth() {
                this.loading = true
                this.success = null
                this.error = null

                fetch('/editor/load', {
                    headers: {
                        'X-Token': this.token,
                    },
                })
                .then((response) => {
                    if (response.ok) {
                        response.json().then((json) => {
                            this.data = json
                            this.login = true
                        })
                    } else if (response.status === 403) {
                        this.error = 'Le token n\\'est pas correct'
                    } else {
                        this.error = \`Une erreur est survenue (code \${response.status})\`
                    }

                    this.loading = false
                }).catch((err) => {
                    this.error = err
                    this.loading = false
                })
            },
            addCourse() {
                this.data.push({
                    url: '',
                    times: []
                })
            },
            updateCourse(event, times) {
                const reader = new FileReader()

                reader.onload = function () {
                    const array = new Uint8Array(this.result)
                    
                    PDFLib.PDFDocument.load(array).then((doc) => {
                        for (let page of doc.getPages()) {
                            times.push('')
                        }
                    })
                }

                reader.readAsArrayBuffer(event.target.files[0])
            },
            save() {
                console.log(this.data)

                this.loading = true
                this.success = null
                this.error = null

                fetch('/editor/save', {
                    method: 'POST',
                    body: JSON.stringify(this.data),
                    headers: {
                        'X-Token': this.token,
                    },
                })
                .then((response) => {
                    this.loading = false

                    if (response.ok) {
                        this.success = 'Les cours ont bien été mis à jour.'
                    } else {
                        this.error = \`Une erreur est survenue (code \${response.status})\`
                    }
                }).catch((err) => {
                    this.error = err
                    this.loading = false
                })
            },
            createPdf() {
                const input = document.getElementById('formFile')
                const reader = new FileReader()

                reader.readAsArrayBuffer(input.files[0])
                reader.onloadend = async (evt) => {
                    if (evt.target.readyState === FileReader.DONE) {
                        const arrayBuffer = evt.target.result
                        const array = new Uint8Array(arrayBuffer)

                        const pdfDoc = await PDFLib.PDFDocument.load(array)
                        const pages = pdfDoc.getPages()
                        let i = 1

                        for (let page of pages) {
                            const body = await fetch('/qrcode/' + this.pdfNumber + '/' + i++)
                            const path = (await body.text()).match(/<path (.*) d="(.*)"/)[2]

                            page.moveTo(0, 0)
                            page.drawSvgPath(path, {
                                x: page.getWidth() - 66,
                                y: page.getHeight(),
                                color: PDFLib.rgb(0, 0, 0),
                                scale: 0.2,
                            })
                        }

                        const pdfBytes = await pdfDoc.save()

                        download(pdfBytes, 'Cours.pdf', 'application/pdf')
                    }
                }
            },
        },
    }).mount('#app')
</script>
</body>
</html>`
