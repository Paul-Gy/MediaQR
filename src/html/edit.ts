export default `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
    <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.4.0/dist/pdf-lib.min.js" defer></script>
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
                                @change="updateCourse($event, info)" accept=".pdf">
                    </div>
                </div>

                <h3 class="card-title">Slides</h3>

                <div class="row g-3">
                    <div v-for="(time, idd) in info.times" :key="idd" class="mb-3 col-md-6">
                        <div class="input-group">
                            <span class="input-group-text">Slide N°{{ idd + 1 }}</span>
                            <input v-model="info.times[idd]" type="text" pattern="[0-9]+(:[0-9]+)?(:[0-9]+)?|(-1)" class="form-control"
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
    
    <hr>
        <a href="https://tube.switch.ch/channels/X4KJsG1os5" class="btn btn-info mx-2" tabindex="-1" role="button" aria-disabled="true">Switchtube</a>
    <hr>

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

    <p class="text-muted">
        Réalisé par
        <a href="https://people.epfl.ch/paul.gerry">Paul Gerry</a> avec la participation
        de <a href="https://people.epfl.ch/samuel.wahba">Samuel Wahba</a>.
    </p>
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
                pdfNumber: '',
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
            updateCourse(event, info) {
                const reader = new FileReader()
                const file = event.target.files[0];
                
                if (!file) {
                    return
                }

                reader.onload = async function () {
                    const array = new Uint8Array(this.result)                    
                    const pdfDoc = await PDFLib.PDFDocument.load(array)
                    info.times = []

                    for (let page of pdfDoc.getPages()) {
                        info.times.push('')
                    }
                }

                reader.readAsArrayBuffer(file)
            },
            save() {
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
        },
    }).mount('#app')
</script>
</body>
</html>`
