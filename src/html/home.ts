export default `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
    <script src="https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.prod.js"></script>
    <title>QR Code - Physique BA2</title>
</head>

<body>
<div id="app" class="container text-center my-5">
    <div class="row justify-content-center mb-3">
        <div class="col-md-6 col-lg-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 182.4 53" fill="#f00">
                <path d="M 0,21.6 H 11.43 V 9.8 H 38.34 V 0 H 0 Z"/>
                <path d="M 0,53 H 38.34 V 43.2 H 11.43 V 31.4 H 0 Z"/>
                <path d="m 11.43,21.6 h 24.610001 v 9.800001 H 11.43 Z"/>
                <path d="M86,4.87a16.12,16.12,0,0,0-5.68-3.53A23.76,23.76,0,0,0,71.82,0H48.14V53H59.57V31.4H71.82a23.76,23.76,0,0,0,8.46-1.34A16.12,16.12,0,0,0,86,26.53a13.43,13.43,0,0,0,3.19-5,17.38,17.38,0,0,0,0-11.62A13.52,13.52,0,0,0,86,4.87ZM78,18.73a5.7,5.7,0,0,1-2.26,1.8,11.33,11.33,0,0,1-3.27.85,32,32,0,0,1-3.86.22H59.57V9.8h9.05a32,32,0,0,1,3.86.22,11,11,0,0,1,3.27.86A5.59,5.59,0,0,1,78,12.67a5,5,0,0,1,.86,3A5,5,0,0,1,78,18.73Z"/>
                <path d="M 155.47,43.2 V 0 h -11.43 v 53 h 38.34 v -9.8 z"/>
                <path d="m 97.42,21.6 h 11.43 V 9.8 h 26.91 V 0 H 97.42 Z"/>
                <path d="M 97.419998,31.4 H 108.85 V 53 H 97.419998 Z"/>
                <path d="m 108.85,21.6 h 24.61 v 9.800001 h -24.61 z"/>
            </svg>
        </div>
    </div>

    <h1>QR Code - Physique BA2</h1>

    <h2 class="mb-4">Pour commencer, scannez un QR Code</h2>

    <hr class="mb-4">

    <h3>Ou recherchez une slide de cours</h3>

    <form method="GET" @submit.prevent class="mb-3">
        <div class="row g-3 mb-3">
            <div class="mb-3 col-md-3 offset-md-3">
                <label class="form-label" for="course">N° du cours</label>
                <input v-model="course" type="number" name="course" id="course" class="form-control" placeholder="4">
            </div>

            <div class="mb-3 col-md-3">
                <label class="form-label" for="slide">N° du slide</label>
                <input v-model="slide" type="number" name="slide" id="slide" class="form-control" placeholder="2">
            </div>
        </div>

        <div v-if="course && slide" class="mb-3">
            <div class="mb-3">
                <a :href="'/v/' + course + '/' + slide" class="btn btn-secondary btn-lg">
                    J'y vais !
                </a>
            </div>

            <img :src="'/qrcode/' + course + '/' + slide" height="150" width="150" alt="QR Code">
        </div>
    </form>
   
    <hr/>
    <a href="https://tube.switch.ch/channels/X4KJsG1os5" class="btn btn-info mb-5" tabindex="-1" role="button" aria-disabled="true">Switchtube</a>
    <hr/>
    
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
                course: '',
                slide: ''
            }
        },
    }).mount('#app')
</script>

</body>
</html>`
