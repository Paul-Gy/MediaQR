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

        <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm"></span>
            Valider
        </button>
    </form>

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
                loading: false,
                pdfNumber: '',
            }
        },
        methods: {
            createPdf() {
                const input = document.getElementById('formFile')
                const reader = new FileReader()
                
                this.loading = true

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
                        
                        this.loading = false

                        download(pdfBytes, 'Cours ' + this.pdfNumber + ' QR.pdf', 'application/octet-stream')
                    }
                }
            },
        },
    }).mount('#app')
</script>
</body>
</html>`
