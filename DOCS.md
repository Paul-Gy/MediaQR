# QR Codes

## 👋 Introduction

Ce système de QR Codes permet aux étudiants de pouvoir accéder rapidement et facilement au moment de la vidéo du cours correspondant à une slide du cours, par exemple pendant une série d'exercices ou durant les révisions.
Le QR Code peut soit être scanné (utile si le cours est imprimé), et il est également possible de cliquer dessus comme un lien classique (pratique si le cours est consulté sur ordinateur/tablette depuis [Moodle](https://moodle.epfl.ch/) ou l'application [EPFL Campus](https://campus.epfl.ch/dashboard)).

## ⚙️ Gestion

La mise en place des QR codes se fait en deux parties :
1. Avant la séance du cours, les QR codes sont ajoutés automatiquement sur le PDF du cours, qui typiquement donnés aux étudiants sur [Moodle](https://moodle.epfl.ch/).
2. Après la séance du cours, lorsque l'enregistrement de celui-ci est prêt, le _timecode_ correspondant à chaque slide est ajouté sur le site, et les QR codes deviennent automatiquement fonctionnels (sans avoir besoin de mettre à jour le PDF du cours).

Chaque cours possède son propre identifiant, qui sera noté `[id]` dans la suite de ce texte.

### ➕ Ajout des QR codes sur le PDF du cours

Les QR codes sont ajoutés automatiquement en allant sur [https://qr.pgerry.com/[id]/pdf](https://qr.pgerry.com/[id]/pdf) (en remplaçant `[id]`), et en téléchargeant le PDF du cours, en indiquant le numéro du cours auquel il correspond.
Après quelques secondes, le PDF est téléchargé, avec les QR codes ajoutés sur chaque slide.

### ⏰ Ajout des _timecodes_ sur le site

Une fois la vidéo du cours enregistrée, il faut ajouter les _timecodes_ correspondant à chaque slide sur le site, pour que les QR codes deviennent fonctionnels.

Cela se fait en allant sur [https://qr.pgerry.com/[id]/editor](https://qr.pgerry.com/[id]/editor) (en remplaçant `[id]`), puis en entrant le token d'édition du cours pour avoir accès à l'éditeur.

#### Ajout d'un cours

Un nouveau cours peut être ajouté par le bouton "Ajouter un cours", ce qui permet d'indiquer la vidéo correspondante. Le bouton "Ouvrir" permet simplement d'ouvrir rapidement ce lien dans un nouvel onglet.
Ensuite, le _timecode_ de chaque slide peut être ajouté en cliquant sur le bouton "Ajouter une slide", et en indiquant le moment de la vidéo correspondant à cette slide (au format `mm:ss` ou `HH:mm:ss`, par exemple `09:41` pour 9 min et 41 secondes).

La dernière slide peut être retirée à tout moment avec le bouton "Retirer".

💾 **Une fois les changements efféctués comme voulu, ne pas oublier de sauvegarder avec le bouton dédié.** ✅

#### Lien externe pour une slide

Si une slide n'est pas couverte dans la vidéo correspondant au cours, il est possible d'ajouter un lien externe à la place
du _timecode_. Cela peut notamment être utilisé si une slide est finalement couverte dans un autre cours par manque de temps.
Pour ce faire, il suffit de cliquer sur l'icône "🔗" et de rentrer l'URL correspondante (L'URL peut être retirée en cliquant à nouveau sur le bouton).

## 📈 Statistiques

Les statistiques d'utilisation des QR Codes peuvent être visualisés en temps réel (moins d'une minute de délai) sur [https://qr.pgerry.com/[id]/stats](https://qr.pgerry.com/[id]/stats) (en remplaçant `[id]`).
Les statistiques comprennent la répartition des utilisations par cours, puis par slide en cliquant sur un cours, ainsi que l'évolution de l'utilisation au cours du temps.