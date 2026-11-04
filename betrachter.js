// Forma · Website: Sprich mit dem Modell (three.js, Draco-GLB aus tools/web_glb.mjs und tools/web_obj_glb.mjs).
// Ein Renderer, zwei Modelle als Reiter (Hochhaus am Wasser, Haus mit Garten; der Bauplatz bleibt versteckt nur für die Filmaufnahme, 3.11., Tassilo). Statt Knöpfen ein Satz: Vorschläge (Chips mit fester Aktion) oder freier Text. Freier Text wird zuerst
// hier mit Stichwörtern (de, en, es) gedeutet, sonst fragt die Seite Forma Cloud (/demo/modell), die ein Sprachmodell auf dieselben Aktionen abbildet.
// Aktionen: Modell, Zustand (1913 / 2026), Gruppen ein und aus, Schnitt (Geschoss: alles darüber fällt weg; längs, quer), Kamera (Perspektive,
// Axonometrie), Blick. Schnittflächen: Stencil-Kappen (Rückseiten zählen hoch, Vorderseiten herunter, wo etwas übrig bleibt, ist man im Körper):
// so sind Wände und Decken im Schnitt massiv (3.11., Tassilo: „die Wände haben keine Masse“). Lädt erst, wenn sichtbar.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { START as BAU_START, baue, bauLicht } from './bauplatz.js?v=43a2842860';

const wrap = document.querySelector('#modell'); if (!wrap) throw new Error('kein #modell');
const canvas = wrap.querySelector('canvas'), status = wrap.querySelector('.m-status'), fehler = wrap.querySelector('.m-fehler'), frage = wrap.querySelector('.m-frage');
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/';
const CLOUD = 'https://cloud.amphion3d.com/demo/modell';
const FOV = 38;

// Schwache Geräte (2.11., Tassilo: „es darf nicht crashen“): Handy, kleiner Bildschirm, wenig Speicher oder ?leicht=1 (nach verlorener 3D-Ansicht)
// laden die ferne Stadt nicht, im leichten Modus auch die Fotostadt nicht, und rechnen mit geringerer Pixeldichte
const LEICHT = new URLSearchParams(location.search).has('leicht');
const SCHWACH = LEICHT || matchMedia('(pointer: coarse)').matches || innerWidth < 760 || (navigator.deviceMemory > 0 && navigator.deviceMemory <= 4);
// Versionsstempel aus der Veröffentlichung (tools/veroeffentlichen.mjs): Modelle nie gemischt aus altem und neuem Stand
const mitVersion = pfad => window.AMPHION_DATEIEN?.[pfad] ? `${pfad}?v=${window.AMPHION_DATEIEN[pfad]}` : pfad;
// Koordinaten: X nach Osten, Y nach oben, Z nach Süden (Norden ist -Z). Schnittebene [nx, ny, nz, c]: sichtbar bleibt, was n·p + c >= 0 erfüllt.
// Eigene Modelle je Seite (3.11., Amphion Estate): window.AMPHION_MODELLE ersetzt die Liste unten, derselbe Betrachter
const MODELLE = window.AMPHION_MODELLE || {
  muenchen: {
    basis: 'modell/muenchen/', dateien: { haus: 'haus.glb', bestand: 'bestand.glb', vorschlag: 'vorschlag.glb', einrichtung: 'einrichtung.glb', umgebung: 'umgebung.glb', baeume: 'baeume.glb' },   // haus: Decken, Treppen, Gesimse, Erkerdach, Keller (beide Zustände)
    zustaende: { 1913: { bestand: true, vorschlag: false, einrichtung: false }, 2026: { bestand: false, vorschlag: true, einrichtung: true } }, zustand: '2026',
    nah: 0.1, fern: 600, nahst: 0.6, fernst: 150, start: 'strasse',
    blicke: { strasse: { pos: [21, 11, 24], ziel: [1, 3, 0] }, garten: { pos: [-16, 9, -23], ziel: [0, 3, 0] }, oben: { pos: [0.01, 42, 0], ziel: [0, 0, 0] } },
    schnitte: { ug: [0, -1, 0, -1.3], eg: [0, -1, 0, 1.3], og: [0, -1, 0, 4.5], dg: [0, -1, 0, 7.6], laengs: [1, 0, 0, 4.32], quer: [0, 0, -1, -0.51] },   // längs durch die Treppe (x = 1,6 m), quer durch die Mitte (y = 5,5 m)
  },
  vancouver: {
    basis: 'modell/vancouver/', dateien: { tragwerk: 'tragwerk.glb', gebaeude: 'gebaeude.glb', stadt: 'stadt.glb', kacheln: 'kacheln.glb', fern: 'fern.glb', pflanzen: 'pflanzen.glb' },   // fern: die ganze gebaute Stadt bis zu den Bergen (tools/film_stadt.mjs), schaltet mit stadt   // kacheln: Satellitenstadt (Fototexturen), folgt dem Schalter stadt
    baeume: { standorte: 'baeume.json', vorlagen: 'baeume_vorlagen.glb', gruppe: 'pflanzen' }, boden: { r: 1400, y: -75 },
    nah: 0.1, fern: 60000, nahst: 0.8, fernst: 16000, start: 'block', struktur: true, nebel: [0xffffff, 6000, 32000],   // 2.11. (Tassilo: frei bewegen bis auf die Straße, die ganze Stadt bis zu den Bergen)
    blicke: { block: { pos: [520, 380, 620], ziel: [0, 110, 0] }, turm: { pos: [260, 160, 300], ziel: [0, 150, 0] }, sockel: { pos: [150, 150, 180], ziel: [0, 25, 0] }, struktur: { pos: [150, 175, 165], ziel: [0, 48, 0] }, oben: { pos: [0.01, 900, 0], ziel: [0, 0, 0] } },   // Sockel von schräg oben, sonst steht die Kamera in einem Nachbarhaus
    schnitte: { eg: [0, -1, 0, 6], og: [0, -1, 0, 60], laengs: [-1, 0, 0, 0] },
  },
  // Bauplatz (2.11.): hier baut die KI wirklich, aus Bauteilen (bauplatz.js), über /demo/bauen der Cloud
  bauplatz: {
    versteckt: true,   // nur ?baufilm=1
    basis: '', dateien: {}, bau: true, boden: { r: 60, y: -0.02, farbe: 0xdfe6d6 },
    nah: 0.05, fern: 3000, nahst: 1, fernst: 400, start: 'vorn',
    blicke: { vorn: { pos: [19, 9.5, 27], ziel: [0, 4.5, 0] }, seite: { pos: [33, 8, 3], ziel: [0, 4.5, 0] }, hinten: { pos: [-19, 9.5, -27], ziel: [0, 4.5, 0] }, oben: { pos: [0.01, 60, 0], ziel: [0, 0, 0] } },
    schnitte: { eg: [0, -1, 0, 2.6], og: [0, -1, 0, 5.6] },
  },
};

if (SCHWACH && MODELLE.vancouver) { delete MODELLE.vancouver.dateien.fern; MODELLE.vancouver.fern = 9000; MODELLE.vancouver.fernst = 5000; }   // Estate-Seite: kein Hochhaus (Befund 3.11.: Absturz auf dem Handy)
if (LEICHT && MODELLE.vancouver) delete MODELLE.vancouver.dateien.kacheln;

// Antworten je Sprache: was die Seite nach einer Aktion sagt
const SAGT = {
  de: { "struktur": "Das Tragwerk ist hervorgehoben, die Hülle durchscheinend.", "leicht": "Die 3D-Ansicht braucht mehr Speicher, als dieses Gerät gerade hat. Hier tippen: leichtere Fassung laden.", "baut": "Amphion baut …", "gebaut": "Gebaut.", "rueck": "Rückgängig gemacht.", "nichtsRueck": "Nichts mehr rückgängig zu machen.", "neu": "Neu angefangen.", "keinNetz": "Keine Verbindung zur Amphion Cloud. Versuch es gleich noch einmal.",  naeher: 'Näher.', weiter: 'Weiter weg.', schnitt: { kein: 'Schnitt zu.', ug: 'Untergeschoss aufgeschnitten.', eg: 'Erdgeschoss aufgeschnitten.', og: 'Obergeschoss aufgeschnitten.', dg: 'Dachgeschoss aufgeschnitten.', laengs: 'Längsschnitt.', quer: 'Querschnitt.' }, zustand: { 1913: 'So war es 1913.', 2026: 'Der Umbau 2026.' }, kamera: { axo: 'Axonometrie.', persp: 'Perspektive.' }, blick: { strasse: 'Blick von der Straße.', garten: 'Blick aus dem Garten.', oben: 'Von oben.', block: 'Der ganze Block.', turm: 'Der Turm.', sockel: 'Der Sockel.' }, an: 'eingeblendet', aus: 'ausgeblendet', gruppen: { bestand: 'Bestand', vorschlag: 'Umbau', einrichtung: 'Einrichtung', umgebung: 'Nachbarn', baeume: 'Bäume', tragwerk: 'Tragwerk', gebaeude: 'Gebäude', stadt: 'Stadt', pflanzen: 'Bäume' }, modell: { muenchen: 'Haus mit Garten.', vancouver: 'Hochhaus am Wasser.' }, schnitt60: 'Bei 60 Metern geschnitten.', alles: 'Alles zurück.', unklar: 'Das habe ich nicht verstanden. Versuch zum Beispiel: „Schneide das Erdgeschoss auf“ oder „ohne Bäume“.', denkt: 'Moment …', hoert: 'Ich höre zu … sprich, dann kurz still.', mikroAus: 'Das Mikrofon ist gesperrt. Erlaube es in den Einstellungen des Browsers oder tippe den Satz.' },
  en: { "struktur": "The structure is highlighted, the envelope see-through.", "leicht": "The 3D view needs more memory than this device has right now. Tap here to load a lighter version.", "baut": "Amphion is building …", "gebaut": "Built.", "rueck": "Undone.", "nichtsRueck": "Nothing left to undo.", "neu": "Started over.", "keinNetz": "No connection to the Amphion Cloud. Please try again in a moment.",  naeher: 'Closer.', weiter: 'Further away.', schnitt: { kein: 'Cut closed.', ug: 'Basement cut open.', eg: 'Ground floor cut open.', og: 'First floor cut open.', dg: 'Attic cut open.', laengs: 'Lengthwise section.', quer: 'Cross section.' }, zustand: { 1913: 'As it was in 1913.', 2026: 'The 2026 proposal.' }, kamera: { axo: 'Axonometric.', persp: 'Perspective.' }, blick: { strasse: 'View from the street.', garten: 'View from the garden.', oben: 'From above.', block: 'The whole block.', turm: 'The tower.', sockel: 'The podium.' }, an: 'shown', aus: 'hidden', gruppen: { bestand: 'As built', vorschlag: 'Proposal', einrichtung: 'Furniture', umgebung: 'Neighbours', baeume: 'Trees', tragwerk: 'Structure', gebaeude: 'Building', stadt: 'City', pflanzen: 'Trees' }, modell: { muenchen: 'House with Garden.', vancouver: 'Tower by the Water.' }, schnitt60: 'Cut at 60 metres.', alles: 'Everything back.', unklar: 'I did not get that. Try “cut open the ground floor” or “without trees”.', denkt: 'One moment …', hoert: 'Listening … speak, then pause.', mikroAus: 'The microphone is blocked. Allow it in your browser settings or type the sentence.' },
  es: { "struktur": "La estructura queda resaltada y la envolvente, translúcida.", "leicht": "La vista 3D necesita más memoria de la que tiene ahora este dispositivo. Toca aquí para cargar una versión más ligera.", "doppelpunkt": ": ", "baut": "Amphion está construyendo …", "gebaut": "Construido.", "rueck": "Deshecho.", "nichtsRueck": "No queda nada por deshacer.", "neu": "Empezado de nuevo.", "keinNetz": "Sin conexión con la Amphion Cloud. Inténtalo de nuevo en un momento.",  naeher: 'Más cerca.', weiter: 'Más lejos.', schnitt: { kein: 'Corte cerrado.', ug: 'Sótano abierto.', eg: 'Planta baja abierta.', og: 'Primera planta abierta.', dg: 'Ático abierto.', laengs: 'Sección longitudinal.', quer: 'Sección transversal.' }, zustand: { 1913: 'Así era en 1913.', 2026: 'La propuesta de 2026.' }, kamera: { axo: 'Axonometría.', persp: 'Perspectiva.' }, blick: { strasse: 'Vista desde la calle.', garten: 'Vista desde el jardín.', oben: 'Desde arriba.', block: 'Toda la manzana.', turm: 'La torre.', sockel: 'El podio.' }, an: 'visible', aus: 'oculto', gruppen: { bestand: 'Estado original', vorschlag: 'Propuesta', einrichtung: 'Mobiliario', umgebung: 'Vecinos', baeume: 'Árboles', tragwerk: 'Estructura', gebaeude: 'Edificio', stadt: 'Ciudad', pflanzen: 'Árboles' }, modell: { muenchen: 'Casa con jardín.', vancouver: 'Torre junto al agua.' }, schnitt60: 'Cortado a 60 metros.', alles: 'Todo como al principio.', unklar: 'No lo he entendido. Prueba «abre la planta baja» o «sin árboles».', denkt: 'Un momento …', hoert: 'Te escucho … habla y luego calla un momento.', mikroAus: 'El micrófono está bloqueado. Permítelo en los ajustes del navegador o escribe la frase.' },
  fr: { "struktur": "La structure est mise en avant, l’enveloppe est translucide.", "leicht": "La vue 3D a besoin de plus de mémoire que cet appareil n’en a. Touche ici pour charger une version plus légère.", "doppelpunkt": " : ", "baut": "Amphion construit …", "gebaut": "Construit.", "rueck": "Annulé.", "nichtsRueck": "Plus rien à annuler.", "neu": "Recommencé.", "keinNetz": "Pas de connexion à l’Amphion Cloud. Réessaie dans un instant.", "naeher": "Plus près.", "weiter": "Plus loin.", "schnitt": {"kein": "Coupe refermée.", "ug": "Sous-sol ouvert.", "eg": "Rez-de-chaussée ouvert.", "og": "Premier étage ouvert.", "dg": "Combles ouverts.", "laengs": "Coupe longitudinale.", "quer": "Coupe transversale."}, "zustand": {"1913": "Comme en 1913.", "2026": "Le projet de 2026."}, "kamera": {"axo": "Axonométrie.", "persp": "Perspective."}, "blick": {"strasse": "Vue depuis la rue.", "garten": "Vue depuis le jardin.", "oben": "Vu d’en haut.", "block": "Tout l’îlot.", "turm": "La tour.", "sockel": "Le socle."}, "an": "affiché", "aus": "masqué", "gruppen": {"bestand": "Existant", "vorschlag": "Projet", "einrichtung": "Mobilier", "umgebung": "Voisins", "baeume": "Arbres", "tragwerk": "Structure", "gebaeude": "Bâtiment", "stadt": "Ville", "pflanzen": "Arbres"}, "modell": {"muenchen": "Maison avec jardin.", "vancouver": "Tour au bord de l’eau."}, "schnitt60": "Coupé à 60 mètres.", "alles": "Tout comme au début.", "unklar": "Je n’ai pas compris. Essaie par exemple « ouvre le rez-de-chaussée » ou « sans arbres ».", "denkt": "Un instant …", "hoert": "Je t’écoute … parle, puis fais une pause.", "mikroAus": "Le micro est bloqué. Autorise-le dans les réglages du navigateur ou écris la phrase."},
  it: { "struktur": "La struttura è evidenziata, l’involucro trasparente.", "leicht": "La vista 3D richiede più memoria di quella disponibile su questo dispositivo. Tocca qui per caricare una versione più leggera.", "doppelpunkt": ": ", "baut": "Amphion sta costruendo …", "gebaut": "Costruito.", "rueck": "Annullato.", "nichtsRueck": "Niente più da annullare.", "neu": "Ricominciato.", "keinNetz": "Nessuna connessione all’Amphion Cloud. Riprova tra un momento.", "naeher": "Più vicino.", "weiter": "Più lontano.", "schnitt": {"kein": "Sezione chiusa.", "ug": "Seminterrato aperto.", "eg": "Piano terra aperto.", "og": "Primo piano aperto.", "dg": "Sottotetto aperto.", "laengs": "Sezione longitudinale.", "quer": "Sezione trasversale."}, "zustand": {"1913": "Com’era nel 1913.", "2026": "Il progetto del 2026."}, "kamera": {"axo": "Assonometria.", "persp": "Prospettiva."}, "blick": {"strasse": "Vista dalla strada.", "garten": "Vista dal giardino.", "oben": "Dall’alto.", "block": "Tutto l’isolato.", "turm": "La torre.", "sockel": "Il basamento."}, "an": "visibile", "aus": "nascosto", "gruppen": {"bestand": "Stato di fatto", "vorschlag": "Progetto", "einrichtung": "Arredi", "umgebung": "Vicini", "baeume": "Alberi", "tragwerk": "Struttura", "gebaeude": "Edificio", "stadt": "Città", "pflanzen": "Alberi"}, "modell": {"muenchen": "Casa con giardino.", "vancouver": "Torre sull’acqua."}, "schnitt60": "Tagliato a 60 metri.", "alles": "Tutto come all’inizio.", "unklar": "Non ho capito. Prova per esempio «apri il piano terra» o «senza alberi».", "denkt": "Un momento …", "hoert": "Ti ascolto … parla, poi fai una pausa.", "mikroAus": "Il microfono è bloccato. Consentilo nelle impostazioni del browser o scrivi la frase."},
  pt: { "struktur": "A estrutura fica realçada e a envolvente translúcida.", "leicht": "A vista 3D precisa de mais memória do que este dispositivo tem agora. Toca aqui para carregar uma versão mais leve.", "doppelpunkt": ": ", "baut": "O Amphion está a construir …", "gebaut": "Construído.", "rueck": "Desfeito.", "nichtsRueck": "Nada mais para desfazer.", "neu": "Recomeçado.", "keinNetz": "Sem ligação à Amphion Cloud. Tenta de novo daqui a pouco.", "naeher": "Mais perto.", "weiter": "Mais longe.", "schnitt": {"kein": "Corte fechado.", "ug": "Cave aberta.", "eg": "Piso térreo aberto.", "og": "Primeiro andar aberto.", "dg": "Sótão aberto.", "laengs": "Corte longitudinal.", "quer": "Corte transversal."}, "zustand": {"1913": "Assim era em 1913.", "2026": "A proposta de 2026."}, "kamera": {"axo": "Axonometria.", "persp": "Perspetiva."}, "blick": {"strasse": "Vista da rua.", "garten": "Vista do jardim.", "oben": "Visto de cima.", "block": "O quarteirão inteiro.", "turm": "A torre.", "sockel": "O embasamento."}, "an": "visível", "aus": "oculto", "gruppen": {"bestand": "Existente", "vorschlag": "Proposta", "einrichtung": "Mobiliário", "umgebung": "Vizinhos", "baeume": "Árvores", "tragwerk": "Estrutura", "gebaeude": "Edifício", "stadt": "Cidade", "pflanzen": "Árvores"}, "modell": {"muenchen": "Casa com jardim.", "vancouver": "Torre à beira da água."}, "schnitt60": "Cortado a 60 metros.", "alles": "Tudo como no início.", "unklar": "Não percebi. Experimenta por exemplo «abre o piso térreo» ou «sem árvores».", "denkt": "Um momento …", "hoert": "Estou a ouvir … fala e depois faz uma pausa.", "mikroAus": "O microfone está bloqueado. Permite-o nas definições do navegador ou escreve a frase."},
};
const sprache = () => SAGT[document.documentElement.lang] ? document.documentElement.lang : 'en';

let renderer, scene, camera, controls, sichtbar = false, gestartet = false, aktiv = null, axo = false;
const loader = new GLTFLoader(), draco = new DRACOLoader(); draco.setDecoderPath(DRACO); loader.setDRACOLoader(draco);
const SCHNITT = new THREE.MeshBasicMaterial({ color: 0x1c1c1c, side: THREE.BackSide });
// Schnittkappen über den Stencil-Puffer (three.js-Beispiel webgl_clipping_stencil): je Körper zwei unsichtbare Durchgänge, die Rückseiten
// zählen hoch, die Vorderseiten herunter; eine große Ebene in der Schnittebene zeichnet dann nur dort, wo der Zähler nicht null ist.
// Nur für Gruppen aus geschlossenen Körpern (Wände, Decken, Dach), nicht für Möbel, Bäume und Umgebung
const KAPPEN_GRUPPEN = new Set(['haus', 'bestand', 'vorschlag']);
const KAPPE = new THREE.MeshBasicMaterial({ color: 0x3a3634, side: THREE.DoubleSide, stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp });
function kappenGruppe(geometry) {
  const g = new THREE.Group();
  for (const [side, op] of [[THREE.BackSide, THREE.IncrementWrapStencilOp], [THREE.FrontSide, THREE.DecrementWrapStencilOp]]) {
    const mat = new THREE.MeshBasicMaterial({ side, depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilFail: op, stencilZFail: op, stencilZPass: op });
    const mesh = new THREE.Mesh(geometry, mat); mesh.frustumCulled = false; mesh.renderOrder = 1; g.add(mesh);
  }
  return g;
}
const SCHNITT_TRAGWERK = new THREE.MeshBasicMaterial({ color: 0x9b2c1f, side: THREE.BackSide });   // Schnittflächen des Tragwerks in der Strukturansicht
const LICHT = {};   // Himmel, Sonne, Gegenlicht; m.hell je Modell (Estate 4.11., Tassilo: Wände weiß wie in Rhino, nicht grau)
let UMGEBUNG = null;   // Spiegelbild für Glas (2.11., Tassilo: Glas am Hochhaus sah schlecht aus), einmal aus RoomEnvironment
const leisten = () => wrap.querySelectorAll('[data-leiste]');

function start() {
  if (gestartet) return; gestartet = true; window.formaZaehl?.('modell');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, stencil: true, powerPreference: 'high-performance' });   // stencil für die Schnittkappen
  renderer.setPixelRatio(Math.min(devicePixelRatio, SCHWACH ? 1.5 : 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  // 3D-Ansicht verloren (zu wenig Grafikspeicher): Hinweis und Knopf, der die Seite in der leichten Fassung neu lädt
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault(); window.formaZaehl?.('kontextverlust');
    const k = document.createElement('button'); k.type = 'button'; k.className = 'm-leicht'; k.textContent = SAGT[sprache()].leicht;
    k.onclick = () => { const u = new URL(location.href); u.searchParams.set('leicht', '1'); u.hash = 'modell'; location.href = u.toString(); };
    wrap.querySelector('.m-buehne').append(k);
  });
  scene = new THREE.Scene(); scene.background = new THREE.Color(0xffffff);
  { const pm = new THREE.PMREMGenerator(renderer); UMGEBUNG = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); }
  LICHT.himmel = new THREE.HemisphereLight(0xffffff, 0xb8b8b8, 1.15); scene.add(LICHT.himmel);
  LICHT.sonne = new THREE.DirectionalLight(0xffffff, 1.5); LICHT.sonne.position.set(300, 500, 200); scene.add(LICHT.sonne);
  LICHT.gegen = new THREE.DirectionalLight(0xffffff, 0.5); LICHT.gegen.position.set(-200, 300, -400); scene.add(LICHT.gegen);
  for (const [name, m] of Object.entries(MODELLE)) {
    m.name = name; m.wurzel = new THREE.Group(); m.wurzel.visible = false; m.gruppen = {}; m.sichtbar = Object.fromEntries(Object.keys(m.dateien).map(k => [k, true])); m.schnittflaechen = []; m.schnitt = null; scene.add(m.wurzel);
    if (m.boden) { const b = new THREE.Mesh(new THREE.CircleGeometry(m.boden.r, 96), new THREE.MeshBasicMaterial({ color: m.boden.farbe ?? 0xf2f2f2 })); b.rotation.x = -Math.PI / 2; b.position.y = m.boden.y; m.wurzel.add(b); }
  }
  addEventListener('resize', groesse);
  for (const ev of ['pointerdown', 'wheel']) canvas.addEventListener(ev, fahrtAbbrechen, { passive: true });
  const reiter = wrap.querySelector('.m-reiter button.on') || wrap.querySelector('.m-reiter button');
  aktiviere(reiter ? reiter.dataset.modell : Object.keys(MODELLE)[0]);
  groesse();   // Zeichenpuffer in voller Größe und Pixeldichte, sonst bleibt es bei 300 x 150 und wird unscharf
  schleife();
}
// Kamerafahrt (3.11.2026, Estate: Anflug aus der Stadt, geführter Rundgang): weich von der aktuellen Lage zu Standpunkt und Ziel, Steuerung
// währenddessen aus, jede Eingabe am Bild bricht Fahrt und Rundgang ab
let fahrt = null, rundgangLauf = null;
function fahren(pos, ziel, dauer = 3, danach = null) {
  const p0 = camera.position.clone(), t0 = controls.target.clone(), p1 = new THREE.Vector3(...pos), t1 = new THREE.Vector3(...ziel), start = performance.now();
  controls.enabled = false;
  fahrt = () => { const u = Math.min(1, (performance.now() - start) / (dauer * 1000)), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    camera.position.lerpVectors(p0, p1, e); controls.target.lerpVectors(t0, t1, e); camera.lookAt(controls.target);
    if (u >= 1) { fahrt = null; controls.enabled = true; controls.update(); danach?.(); } };
}
function fahrtAbbrechen() { if (fahrt || rundgangLauf) { fahrt = null; rundgangLauf = null; if (controls) { controls.enabled = true; controls.target.copy(controls.target); } } }
function rundgang(m) {
  const S = m.rundgang; if (!S?.length) return false;
  if (m.schnitt) schnitt('kein'); if (axo) projektion('persp');
  const T = sagtFuer(m); let i = 0; rundgangLauf = m;
  const weiter = () => { if (rundgangLauf !== m || i >= S.length) { if (rundgangLauf === m) { rundgangLauf = null; melde(T.rundgangEnde || ''); } return; } const st = S[i++]; melde(T.rundgangSchritt ? T.rundgangSchritt.replace('{n}', st.name) : st.name); fahren(st.pos, st.ziel, st.dauer || 4, () => setTimeout(weiter, (st.pause || 1.2) * 1000)); };
  fahren(S[0].pos, S[0].ziel, 2.5, () => { i = 1; melde(S[0].name); setTimeout(weiter, 1200); });
  return true;
}
function schleife() { requestAnimationFrame(schleife); if (!sichtbar || !aktiv) return; if (fahrt) fahrt(); else controls?.update(); hausWahl(); kachelnNeu(); renderer.render(scene, camera); }
// Estate (3.11., Tassilo: Dach bleibt, erst im Schnitt zeigen, was aufgeschnitten ist; unsere echten Fenster statt der Google-Fenster; weiter draußen
// unschärfer wie Google): weit weg (über m.haus.nah Meter) nur die Fotostadt mit dem Google-Haus (Knoten „eigenhaus“ der Kacheln, m.haus.ganz);
// nah, in der Wohnung (m.haus.innen: Kasten) oder im Schnitt: Haus ohne Wohnungsgeschoss (m.haus.schnitt) und unsere Wohnung mit Fenstern
function hausWahl() { const m = aktiv, h = m?.haus; if (!h) return; if (!h.geladen) { h.geladen = true; for (const k of h.wohnung) lade(k); }   // Wohnung schon beim Anflug laden, unsichtbar
  const b = h.innen, p = camera.position, kasten = p.x > b[0] && p.x < b[3] && p.y > b[1] && p.y < b[4] && p.z > b[2] && p.z < b[5]; const innen = !!m.schnitt || (!!h.nah && p.length() < h.nah) || kasten;
  if (innen === m.hausInnen && m.schnitt === m.hausSchnitt && kasten === m.hausKasten) return; m.hausInnen = innen; m.hausSchnitt = m.schnitt; m.hausKasten = kasten;
  for (const k of Object.keys(m.dateien)) zeige(k); for (const o of m.eigenhaus || []) o.visible = !innen;
  // von außen ohne Schnitt: Deckenplatte der Wohnung aus (h.dach = Höhe unter der Platte), darüber liegt das Google-Dach; von innen bleibt die Decke
  const dach = !m.schnitt && !kasten && h.dach ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), h.dach)] : null;
  if (!m.schnitt) for (const k of h.wohnung) m.gruppen[k]?.traverse(o => { if (o.isMesh && o.material) for (const mat of [].concat(o.material)) mat.clippingPlanes = dach; });
}
// Schnitt nur für die Gruppen außerhalb m.ungeschnitten (Estate: die Fotostadt bleibt ganz), darum Ebenen je Material statt am Renderer
function clipSetzen(m) { for (const [k, g] of Object.entries(m.gruppen)) { const frei = m.ungeschnitten?.includes(k) || m.ungeschnittenBei?.[m.schnitt]?.includes(k); /* Estate: bei „ohne Decke“ bleibt das Google-Haus ganz */ g.traverse(o => { if (o.isMesh && o.material) for (const mat of [].concat(o.material)) mat.clippingPlanes = frei || !m.ebenen?.length ? null : m.ebenen; }); } }
function groesse() {
  const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false);
  if (camera?.isOrthographicCamera) { const r = camera.userData.r, a = w / h; camera.left = -r * a; camera.right = r * a; camera.top = r; camera.bottom = -r; }
  else if (camera) camera.aspect = w / h;
  camera?.updateProjectionMatrix();
}
function melde(t) { if (status) status.textContent = t || ''; }

// Modell wechseln: Reiter, Chips, Wurzel, Kamera, Schnitt
function aktiviere(name) {
  const m = MODELLE[name]; if (!m || m === aktiv) return;
  if (aktiv) aktiv.wurzel.visible = false;
  aktiv = m; m.wurzel.visible = true;
  scene.fog = m.nebel ? new THREE.Fog(m.nebel[0], m.nebel[1], m.nebel[2]) : null;   // ferne Stadt und Berge verblassen
  const L = m.hell || {}; LICHT.himmel.intensity = L.himmel ?? 1.15; LICHT.himmel.groundColor.set(L.boden ?? 0xb8b8b8); LICHT.sonne.intensity = L.sonne ?? 1.5; LICHT.gegen.intensity = L.gegen ?? 0.5;
  for (const b of wrap.querySelectorAll('.m-reiter button')) b.classList.toggle('on', b.dataset.modell === name);
  for (const l of leisten()) l.hidden = l.dataset.leiste !== name;
  if (m.anflug && !m.angeflogen) {   // Anflug (Estate): erst der Blick aus der Stadt, nach dem Laden die Fahrt zum Startblick
    m.angeflogen = true; kamera(m.anflug.pos, m.anflug.ziel);
    setTimeout(() => { if (aktiv === m && !fahrt) { const b = m.blicke[m.start]; fahren(b.pos, b.ziel, m.anflug.dauer || 6, () => { if (m.schnittStart && !m.schnitt) schnitt(m.schnittStart); }); } }, m.anflug.wartezeit || 1500);
    schnitt('kein');
  } else { blick(m.start); schnitt(m.schnitt || m.schnittStart || 'kein'); }   // schnittStart: Modell beginnt geschnitten (Estate: wie der Plan)
  for (const k of Object.keys(m.dateien)) zeige(k);
  if (m.baeume) ladeBaeume(m);
  if (m.bau && !m.teile) { let g = null; try { g = JSON.parse(localStorage.getItem('amphion.bau') || 'null'); } catch { /* ohne Speicher */ } setzeBau(Array.isArray(g) && g.length ? g : BAU_START, false); }
}
// Sichtbar ist eine Gruppe, wenn ihr Schalter an ist; Gruppen des Zustands folgen dem Zustand
function sollSichtbar(k) { const m = aktiv; if (m.zustaende) { const z = m.zustaende[m.zustand]; if (k in z && !z[k]) return false; }
  const h = m.haus; if (h && (k === h.ganz || k === h.schnitt || k === h.offen)) { const w = !m.hausInnen ? h.ganz : h.offen && m.schnitt === 'planta' ? h.offen : h.schnitt; return m.sichtbar.stadt !== false && k === w; }   // folgt dem Schalter Stadt; h.offen: ohne Decke von oben
  if (h && h.wohnung.includes(k) && !m.hausInnen && m.sichtbar.stadt !== false && m.sichtbar[k] !== false) return false;
  if (h?.nachbarn?.includes(k)) return !!m.hausInnen && !!m.schnitt && m.sichtbar[k] !== false; /* Nachbarwohnungen als Körper nur im Schnitt (sonst steht dort das Google-Haus) */ return m.sichtbar[k === 'kacheln' || k === 'fern' ? 'stadt' : k] !== false; }
function zustand(z) { const m = aktiv; if (!m.zustaende?.[z]) return; m.zustand = z; for (const k of Object.keys(m.dateien)) zeige(k); }
function zeige(k) { const m = aktiv, soll = sollSichtbar(k); if (m.gruppen[k]) m.gruppen[k].visible = soll; else if (soll) lade(k); if (m.baumNetz && m.baeume?.gruppe === k) m.baumNetz.visible = soll; }

// 3D-Tiles (Estate 3.11., Tassilo: „wie Google, weiter draußen unschärfer“): eigenes tileset.json (tools/stadt_google_tiles.py, Z oben), je nach Abstand
// lädt der TilesRenderer die passende Stufe und gibt ferne frei; alle Kacheldateien tragen den Stempel des tileset.json
async function ladeTiles(m, k, g) {
  const { TilesRenderer } = await import('3d-tiles-renderer/three');
  const url = new URL(mitVersion(m.basis + m.dateien[k]), location.href), v = url.searchParams.get('v');
  const t = new TilesRenderer(url.href), gl = new GLTFLoader(t.manager); gl.setDRACOLoader(draco); t.manager.addHandler(/\.(gltf|glb)(\?.*)?$/, gl);
  t.errorTarget = m.kachelFehler ?? 12;
  if (v) t.preprocessURL = u => { const x = new URL(u, location.href); if (!x.searchParams.has('v')) x.searchParams.set('v', v); return x.href; };
  t.group.rotation.x = -Math.PI / 2; m.eigenhaus ||= new Set();
  t.addEventListener('load-model', ({ scene: s }) => s.traverse(o => {
    if (!o.isMesh) return; const alt = o.material; o.material = new THREE.MeshBasicMaterial({ map: alt.map, side: THREE.DoubleSide }); alt.dispose(); o.frustumCulled = false;   // Licht steckt im Foto
    if (o.name === 'eigenhaus' || o.parent?.name === 'eigenhaus') { m.eigenhaus.add(o); o.visible = !m.hausInnen; }
  }));
  t.addEventListener('dispose-model', ({ scene: s }) => s.traverse(o => m.eigenhaus.delete(o)));
  g.add(t.group); if (m.versatz?.[k]) g.position.set(...m.versatz[k]); m.tiles = t; melde('');
}
function kachelnNeu() { const t = aktiv?.tiles; if (!t || !t.group.parent?.visible) return; if (t.kamera !== camera) { if (t.kamera) t.deleteCamera(t.kamera); t.setCamera(camera); t.kamera = camera; } t.setResolutionFromRenderer(camera, renderer); camera.updateMatrixWorld(); t.update(); }

async function lade(k) {
  const m = aktiv; if (m.gruppen[k]) return;
  const g = m.gruppen[k] = new THREE.Group(); g.visible = true; m.wurzel.add(g);
  melde('…');
  if (/tileset\.json$/.test(m.dateien[k])) { try { await ladeTiles(m, k, g); } catch (e) { melde(fehler?.textContent || 'Fehler'); console.error(e); } return; }
  try {
    const d = await loader.loadAsync(mitVersion(m.basis + m.dateien[k]));
    const netze = []; d.scene.traverse(o => { if (o.isMesh) netze.push(o); });   // erst sammeln: die Schnittflächen kommen als Kinder dazu
    for (const o of netze) {
      if (o.material.map && !o.material.name.startsWith('tex:')) { o.material = new THREE.MeshBasicMaterial({ map: o.material.map, side: THREE.DoubleSide }); o.frustumCulled = false; continue; }   // Fotokacheln: das Licht steckt im Foto
      if (o.material.map) {   // texturierte Teile (Estate, Rhino-Materialien): beleuchtet, Bild wiederholt sich, geschlossene Körper bekommen Kappen
        const solid = !!o.material.userData?.solid; o.material.map.wrapS = o.material.map.wrapT = THREE.RepeatWrapping; o.material.map.colorSpace = THREE.SRGBColorSpace; o.material.map.anisotropy = 4;
        o.material = new THREE.MeshLambertMaterial({ map: o.material.map, vertexColors: true, flatShading: true, side: THREE.DoubleSide }); o.frustumCulled = false;   // flatShading: ohne Normalen im GLB sonst schwarz
        const kappenGruppe_ = m.kappen ? m.kappen.includes(k) : KAPPEN_GRUPPEN.has(k);
        if (solid && kappenGruppe_) { const s = kappenGruppe(o.geometry); s.visible = !!m.schnitt; o.add(s); m.schnittflaechen.push(s); }
        if (kappenGruppe_) { const s = new THREE.Mesh(o.geometry, SCHNITT); s.frustumCulled = false; s.visible = !!m.schnitt; o.add(s); m.schnittflaechen.push(s); (m.schnittMats ||= []).push(o.material); if (m.schnitt) { o.material.side = THREE.FrontSide; o.material.needsUpdate = true; } }
        continue;
      }
      const glas = o.material.name === 'glas', solid = o.material.name === 'solid';   // solid: geschlossene Körper (tools/web_3dm_glb.mjs), nur sie bekommen Kappen
      o.material = glas
        ? new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.15, roughness: 0.04, envMap: UMGEBUNG, envMapIntensity: m.glas?.spiegel ?? 1.35, transparent: true, opacity: m.glas?.deckung ?? 0.58, side: THREE.DoubleSide, depthWrite: false })   // spiegelt, leicht getönt; m.glas (Estate): klarer, damit man die Stadt sieht
        : new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
      o.frustumCulled = false;
      const kappenGruppe_ = m.kappen ? m.kappen.includes(k) : KAPPEN_GRUPPEN.has(k);
      if (solid && kappenGruppe_) { const s = kappenGruppe(o.geometry); s.visible = !!m.schnitt; o.add(s); m.schnittflaechen.push(s); }
      // offene Körper (Wände ohne Deckel, Böden als Fläche) in denselben Gruppen: im Schnitt nur Vorderseiten, Rückseiten dunkel, so wirkt
      // auch ein offener Wandkasten massiv; ohne Schnitt wieder beidseitig, damit nichts durchsichtig wird
      if (!glas && !kappenGruppe_ && !m.ohneSchnittflaechen?.includes(k)) { const s = new THREE.Mesh(o.geometry, SCHNITT); s.frustumCulled = false; s.visible = !!m.schnitt; o.add(s); m.schnittflaechen.push(s); }   // wie bisher (Hochhaus: rote Tragwerksflächen in der Strukturansicht)
      if (!glas && kappenGruppe_) { const s = new THREE.Mesh(o.geometry, SCHNITT); s.frustumCulled = false; s.visible = !!m.schnitt; o.add(s); m.schnittflaechen.push(s); (m.schnittMats ||= []).push(o.material); if (m.schnitt) { o.material.side = THREE.FrontSide; o.material.needsUpdate = true; } }
    }
    g.add(d.scene); g.visible = m === aktiv ? sollSichtbar(k) : true;
    if (m.versatz?.[k]) g.position.set(...m.versatz[k]);   // z. B. Stadt: Straßenniveau unter dem Wohnungsgeschoss
    if (m.ebenen?.length) clipSetzen(m);   // nachgeladene Gruppe in den laufenden Schnitt
    if (m.haus?.wohnung.includes(k)) m.hausSchnitt = undefined;   // Wohnungsteil nachgeladen: hausWahl setzt Sichtbarkeit und Deckenschnitt neu
    if (m === aktiv && m.schnitt) strukturAnsicht(true); if (status?.textContent === '…') melde('');   // nachgeladene Gruppe in die laufende Strukturansicht
  } catch (e) { melde(fehler?.textContent || 'Fehler'); console.error(e); }
}
// Bäume (Vancouver): die Bibliotheksbäume aus Forma als Vorlagen (Rinde, Kronen), an jedem Standort mit Maßstab und Drehung instanziert
async function ladeBaeume(m) {
  if (m.baumNetz) return; m.baumNetz = new THREE.Group(); m.wurzel.add(m.baumNetz);
  try {
    const [B, d] = await Promise.all([(await fetch(mitVersion(m.basis + m.baeume.standorte))).json(), loader.loadAsync(mitVersion(m.basis + m.baeume.vorlagen))]);
    const geo = {}; d.scene.traverse(o => { if (o.isMesh) geo[o.parent?.name || o.name] = o.geometry; });
    const je = {}; for (const b of B) (je[b[0]] ||= []).push(b);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), ax = new THREE.Vector3(0, 1, 0);
    for (const [i, L] of Object.entries(je)) {
      const g = geo['b' + i]; if (!g) continue;
      const I = new THREE.InstancedMesh(g, mat, L.length);
      L.forEach(([, x, y, z, sk, r], k) => { q.setFromAxisAngle(ax, r * Math.PI / 180); M.compose(p.set(x, y, z), q, s.set(sk, sk, sk)); I.setMatrixAt(k, M); });
      I.frustumCulled = false; m.baumNetz.add(I);
    }
    m.baumNetz.visible = m.sichtbar[m.baeume.gruppe] !== false;
  } catch (e) { console.error(e); }
}

// Kamera: Perspektive oder Axonometrie (Parallelprojektion), beide frei drehbar; Lage und Ziel bleiben beim Wechsel erhalten
function kamera(pos, ziel) {
  const m = aktiv, w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
  if (w < h) { const f = (h / w) ** 0.7; pos = ziel.map((z, i) => z + (pos[i] - z) * f); }   // hochkant (Handy): weiter weg, sonst füllen Bäume das Bild
  controls?.dispose();
  if (axo) {
    const r = Math.hypot(pos[0] - ziel[0], pos[1] - ziel[1], pos[2] - ziel[2]) * Math.tan(FOV / 2 * Math.PI / 180);   // gleicher Bildausschnitt wie in der Perspektive
    camera = new THREE.OrthographicCamera(-r * w / h, r * w / h, r, -r, -m.fern, m.fern); camera.userData.r = r;
  } else camera = new THREE.PerspectiveCamera(FOV, w / h, m.nah, m.fern);
  camera.position.set(...pos);
  controls = new OrbitControls(camera, canvas); controls.target.set(...ziel);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2 - 0.02; controls.minDistance = m.nahst; controls.maxDistance = m.fernst; controls.minZoom = 0.2; controls.maxZoom = 20;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }; controls.zoomToCursor = true; controls.screenSpacePanning = true; controls.update();   // zoomt dorthin, wo der Zeiger steht
  camera.updateProjectionMatrix();
}
function blick(name) { const b = aktiv.blicke[name]; if (!b) return false; kamera(b.pos, b.ziel); return true; }
function projektion(art) { if ((art === 'axo') === axo) return; axo = art === 'axo'; kamera(camera.position.toArray(), controls.target.toArray()); }
// Schnitt: Geschoss (alles darüber fällt weg), längs, quer oder keiner
// Strukturansicht (2.11., Tassilo: beim Schnitt durch den Turm lieber sehen, wie das Tragwerk ist): solange geschnitten ist, bleibt das
// Tragwerk in seinen Farben mit roten Schnittflächen, alles andere wird zur hellen, durchscheinenden Hülle ohne Schnittflächen
function strukturAnsicht(an) {
  const m = aktiv; if (!m?.struktur) return;
  if (m.baumNetz) m.baumNetz.visible = an ? false : sollSichtbar(m.baeume.gruppe);   // Bäume verdecken das Tragwerk
  for (const [k, g] of Object.entries(m.gruppen)) {
    if (k === 'tragwerk') { g.traverse(o => { if (o.isMesh && (o.material === SCHNITT || o.material === SCHNITT_TRAGWERK)) o.material = an ? SCHNITT_TRAGWERK : SCHNITT; }); continue; }
    if (k !== 'gebaeude' && k !== 'pflanzen') continue;
    g.traverse(o => {
      if (!o.isMesh) return;
      if (o.material === SCHNITT) { o.userData.kappe = true; o.visible = !an && !!aktiv?.schnitt; return; }
      const mat = o.material, u = mat.userData; if (!u.orig) u.orig = { transparent: mat.transparent, opacity: mat.opacity, depthWrite: mat.depthWrite };
      if (an) Object.assign(mat, { transparent: true, opacity: Math.min(u.orig.opacity, 0.13), depthWrite: false }); else Object.assign(mat, u.orig);
      mat.needsUpdate = true;
    });
  }
}
let kappenAn = true;
window.formaKappen = an => { if (an === undefined) { const m = aktiv; return { stencil: !!renderer.getContext().getContextAttributes().stencil, n: m.schnittflaechen.length, sichtbar: m.schnittflaechen.filter(f => f.visible).length, kappe: m.kappe ? { sichtbar: m.kappe.visible, pos: m.kappe.position.toArray().map(v => +v.toFixed(2)) } : null }; } kappenAn = !!an; for (const mm of Object.values(MODELLE)) { if (mm.kappe) mm.kappe.visible = kappenAn && !!mm.schnitt; for (const f of mm.schnittflaechen || []) f.visible = kappenAn && !!mm.schnitt; for (const mat of mm.schnittMats || []) { mat.side = kappenAn && mm.schnitt ? THREE.FrontSide : THREE.DoubleSide; mat.needsUpdate = true; } } };   // Prüfregel: Kappen aus und an
function schnitt(name) {
  const m = aktiv, s = m.schnitte[name]; if (name !== 'kein' && !s) return false; m.schnitt = s ? name : null;
  const ebene = s ? new THREE.Plane(new THREE.Vector3(s[0], s[1], s[2]), s[3]) : null;
  m.ebenen = ebene ? [ebene] : []; renderer.clippingPlanes = []; renderer.localClippingEnabled = true; clipSetzen(m);
  for (const mm of Object.values(MODELLE)) for (const f of mm.schnittflaechen || []) f.visible = !!s;
  for (const mat of m.schnittMats || []) { mat.side = s ? THREE.FrontSide : THREE.DoubleSide; mat.needsUpdate = true; }
  // Kappenebene: groß genug für das ganze Modell, liegt genau in der Schnittebene, schaut zur sichtbaren Seite; löscht danach den Stencil
  if (!m.kappe) { m.kappe = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), KAPPE); m.kappe.renderOrder = 2; m.kappe.frustumCulled = false; m.kappe.onAfterRender = rd => rd.clearStencil(); m.wurzel.add(m.kappe); }
  m.kappe.visible = !!ebene && kappenAn;
  if (ebene) { m.kappe.position.copy(ebene.normal).multiplyScalar(-ebene.constant); m.kappe.lookAt(m.kappe.position.clone().add(ebene.normal)); }
  strukturAnsicht(!!s);
  return true;
}

// Bauplatz: Teile anzeigen (alte Körper weg), Verlauf für „Rückgängig“, im Browser merken
function setzeBau(teile, merken = true) {
  const m = MODELLE.bauplatz;
  if (merken && m.teile) { m.verlauf ||= []; m.verlauf.push(m.teile); if (m.verlauf.length > 30) m.verlauf.shift(); }
  m.teile = teile; if (m.bauGruppe) { m.wurzel.remove(m.bauGruppe); m.bauGruppe.traverse(o => { o.geometry?.dispose(); o.material?.dispose?.(); }); }
  m.bauGruppe = baue(teile, UMGEBUNG); m.wurzel.add(m.bauGruppe);
  if (!m.licht) { m.licht = bauLicht(); m.wurzel.add(m.licht); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  if (renderer?.clippingPlanes.length) for (const o of m.bauGruppe.children) o.material.clippingPlanes = null;
  try { localStorage.setItem('amphion.bau', JSON.stringify(teile)); } catch { /* ohne Speicher */ }
}
async function bauWunsch(text) {
  const T = SAGT[sprache()], m = MODELLE.bauplatz; melde(T.baut);
  try {
    const ab = new AbortController(), uhr = setTimeout(() => ab.abort(), 90000);
    const r = await fetch(CLOUD.replace('/demo/modell', '/demo/bauen'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ab.signal, body: JSON.stringify({ text, teile: m.teile, lang: sprache() }) });
    clearTimeout(uhr); const j = await r.json();
    if (r.ok && Array.isArray(j.teile) && j.teile.length) { setzeBau(j.teile); rahmen(m.bauGruppe); melde(j.antwort || T.gebaut); }
    else melde(j.antwort || j.error?.message || T.unklar);
  } catch (e) { console.warn('Bauen', e); melde(T.keinNetz); }
}
// Kamera so weit zurück, dass das ganze Gebäude im Bild ist; die Blickrichtung bleibt
function rahmen(gruppe) {
  const box = new THREE.Box3().setFromObject(gruppe); if (box.isEmpty()) return;
  const kugel = box.getBoundingSphere(new THREE.Sphere()), ziel = kugel.center.clone(); ziel.y = Math.max(ziel.y * 0.9, 2);
  const richtung = camera.position.clone().sub(controls.target).normalize(), fov = (camera.fov || 40) * Math.PI / 180;
  const abstand = Math.min(controls.maxDistance, Math.max(controls.minDistance, kugel.radius / Math.sin(fov / 2) * 1.12));
  if (camera.isOrthographicCamera) { camera.zoom = Math.max(controls.minZoom, Math.min(controls.maxZoom, camera.userData.r / (kugel.radius * 1.15))); camera.updateProjectionMatrix(); }
  else camera.position.copy(ziel).addScaledVector(richtung, abstand);
  controls.target.copy(ziel); controls.update();
}
window.formaBau = () => MODELLE.bauplatz.teile;   // für die Prüfregel tools/pruefe_bauplatz.mjs

// Eine Aktion ausführen und sagen, was passiert ist
// Texte: Grundtexte der Sprache, je Modell ergänzt (m.sagt[lang], etwa eigene Schnitte und Blicke einer Wohnung)
const sagtFuer = m => { const B = SAGT[sprache()], E = m?.sagt?.[sprache()] || m?.sagt?.en || {}; const out = { ...B, ...E }; for (const k of ['schnitt', 'blick', 'zustand', 'modell', 'kamera']) out[k] = { ...(B[k] || {}), ...(E[k] || {}) }; return out; };
function tun(a) {
  const T = sagtFuer(aktiv), gesagt = [];
  if (a.modell && MODELLE[a.modell] && !MODELLE[a.modell].versteckt && MODELLE[a.modell] !== aktiv) { aktiviere(a.modell); gesagt.push(T.modell[a.modell]); }
  const m = aktiv;
  if (a.rueck && m.bau) { const v = m.verlauf?.pop(); if (v) { setzeBau(v, false); return T.rueck; } return T.nichtsRueck; }
  if (a.neu && m.bau) { setzeBau(BAU_START); blick(m.start); return T.neu; }
  if (a.rundgang) return rundgang(m) ? (T.rundgangStart || '') : T.unklar;
  if (a.alles) { fahrtAbbrechen(); m.zustand = '2026'; for (const k of Object.keys(m.dateien)) m.sichtbar[k] = true; axo = false; blick(m.start); schnitt(m.schnittStart || 'kein'); for (const k of Object.keys(m.dateien)) zeige(k); return T.alles; }
  if (a.zustand && m.zustaende?.[String(a.zustand)]) { zustand(String(a.zustand)); gesagt.push(T.zustand[a.zustand]); }
  if (a.gruppen) { const an = [], aus = []; for (const [k, v] of Object.entries(a.gruppen)) { if (!(k in m.dateien) || k === 'kacheln' || k === 'fern') continue; m.sichtbar[k] = !!v; zeige(k); if (k === 'stadt') for (const kk of Object.keys(m.dateien)) zeige(kk); (v ? an : aus).push(T.gruppen[k] || k); }
    // Deutsch und Englisch: „Bäume ausgeblendet.“; sonst „Masqué : arbres.“, das stimmt in Einzahl und Mehrzahl
    const liste = (w, L) => T.doppelpunkt ? w[0].toUpperCase() + w.slice(1) + T.doppelpunkt + L.join(', ').toLowerCase() + '.' : L.join(', ') + ' ' + w + '.';
    if (an.length) gesagt.push(liste(T.an, an)); if (aus.length) gesagt.push(liste(T.aus, aus)); }
  if (a.kamera && (a.kamera === 'axo' || a.kamera === 'persp')) { projektion(a.kamera); gesagt.push(T.kamera[a.kamera]); }
  if (a.blick && blick(a.blick)) gesagt.push(T.blick[a.blick]);
  if (a.zoom && +a.zoom > 0) {   // näher (< 1) oder weiter weg (> 1), bezogen auf den Abstand zum Blickziel; die Grenzen der Steuerung gelten weiter
    const f = Math.min(4, Math.max(0.05, +a.zoom));
    if (camera.isOrthographicCamera) { camera.zoom = Math.min(controls.maxZoom, Math.max(controls.minZoom, camera.zoom / f)); camera.updateProjectionMatrix(); }
    else camera.position.copy(controls.target).add(camera.position.clone().sub(controls.target).multiplyScalar(f));
    controls.update(); gesagt.push(f < 1 ? T.naeher : T.weiter);
  }
  if (a.schnitt && schnitt(a.schnitt)) { gesagt.push(m.name === 'vancouver' && a.schnitt === 'og' ? T.schnitt60 : T.schnitt[a.schnitt]); if (m.struktur && a.schnitt !== 'kein') gesagt.push(T.struktur); }
  return gesagt.join(' ');
}

// Zustand lesen für die Prüfregel tools/pruefe_saetze.mjs (nur lesen, plus Zurücksetzen)
window.formaZustand = () => { const m = aktiv; if (!m || !camera) return null; const sichtbar = {}; for (const k of Object.keys(m.dateien)) if (k !== 'kacheln' && k !== 'fern') sichtbar[k] = sollSichtbar(k);
  return { modell: m.name, sichtbar, zustand: m.zustand || null, schnitt: m.schnitt || 'kein', struktur: (() => { let d = null; m.gruppen.gebaeude?.traverse(o => { if (d === null && o.isMesh && o.material !== SCHNITT && !o.material.userData.glas) d = o.material.opacity; }); return d !== null && d < 0.2; })(), abstand: camera.position.distanceTo(controls.target), hoehe: camera.position.y, status: status?.textContent || '', zuruecksetzen: undefined }; };
window.formaZustand.zuruecksetzen = () => { tun({ alles: true }); melde(''); };
window.formaZustand.kamera = (pos, ziel) => kamera(pos, ziel);
window.formaZustand.faehrt = () => !!(fahrt || rundgangLauf);   // Prüfregel: Anflug und Rundgang laufen   // für Prüfungen und Vergleichsbilder: Kamera exakt setzen
// Freien Text deuten: Stichwörter in drei Sprachen. Liefert eine Aktion oder null.
const W = {
  neg: /\b(ohne|weg|aus\b|raus\b|lösch|losch|entfern|versteck|ausblend|nicht|kein|delete|without|hide|remove|no\b|sin\b|quita|oculta|fuera)/i,
  nur: /\b(nur|only|just|solo|sólo|solamente)\b/i,
  gruppen: { umgebung: /nachbar|neighbo|vecin|umgebung|surround|entorno/i, baeume: /b[äa]um|tree|[áa]rbol|vegeta/i, einrichtung: /einricht|m[öo]bel|furnit|mueble|mobiliar|k[üu]che|kitchen|cocina/i, bestand: /bestand|as built|original|1913/i, vorschlag: /umbau|vorschlag|proposal|propuesta|anbau|extension|2026/i, tragwerk: /tragwerk|struktur|structure|estructura|stahl|steel|acero/i, gebaeude: /geb[äa]ude|building|edificio|fassade|fa[çc]ade|fachada/i, stadt: /stadt|city|ciudad|kontext|context|contexto/i, pflanzen: /b[äa]um|tree|[áa]rbol|pflanz|plant/i },
  schnitt: [['ug', /keller|untergeschoss|basement|s[óo]tano|\bug\b/i], ['eg', /erdgeschoss|ground|planta baja|\beg\b|parterre/i], ['og', /obergeschoss|first floor|1st|primera|\bog\b|60 ?m/i], ['dg', /dach|attic|[áa]tico|\bdg\b|roof/i], ['laengs', /l[äa]ngs|length|longitudinal/i], ['quer', /quer|cross|transversal/i]],
  schnittWort: /schnitt|schneid|cut|section|secci[óo]n|corte|corta|abre|open|auf\b/i,
  schnittZu: /\b(zu|kein|schlie[ßs]|close|none|whole|ganz|cerrar|cierra|ninguno|entero|wieder ganz)\b/i,
  kamera: [['axo', /axo|isometr|parallel/i], ['persp', /perspektiv|perspectiv/i]],
  blick: [['oben', /oben|above|top|arriba|vogel|bird|luft|aerial/i], ['garten', /garten|garden|jard[íi]n/i], ['strasse', /stra[ßs]e|street|calle|eingang|entrance|entrada/i], ['turm', /turm|tower|torre|n[äa]her|closer|cerca/i], ['sockel', /sockel|podium|podio/i], ['block', /block|manzana|ganz|whole|everything|todo|weit|far|lejos/i]],
  modell: [['vancouver', /vancouver|five|turm|tower|torre|hochhaus/i], ['muenchen', /m[üu]nchen|munich|m[úu]nich|villa|walhalla|haus\b|house|casa/i]],
  zustand: [['1913', /1913|bestand|alt\b|früher|damals|as built|original|antes|before|antiguo/i], ['2026', /2026|umbau|vorschlag|proposal|neu|new|propuesta|nuevo|jetzt|now|ahora/i]],
  alles: /\b(alles zur[üu]ck|zur[üu]cksetzen|reset|von vorn|everything back|start over|todo como|reiniciar)\b/i,
};
// Weitere Sprachen (2.11., Tassilo: Sprache automatisch, mehr Sprachen): Stichwörter für fr, it, pt werden an die Muster oben angehängt.
// Jedes Wort zählt als Wortanfang, kurze Wörter (bis 3 Zeichen) nur als ganzes Wort, damit „que“, „rue“ oder „via“ nicht in anderen Wörtern treffen.
const WOERTER = {"fr": {"neg": ["sans", "enlève", "enleve", "retire", "cache", "masque", "supprime", "pas de", "aucun"], "nur": ["seulement", "uniquement", "juste", "que"], "umgebung": ["voisin", "environ", "alentour"], "baeume": ["arbre", "végét", "veget", "plante"], "einrichtung": ["meubl", "mobilier", "cuisine", "aménag"], "bestand": ["existant", "état actuel", "original", "ancien", "1913"], "vorschlag": ["projet", "propos", "extension", "transformation", "nouveau", "2026"], "tragwerk": ["structure", "ossature", "acier", "porteur"], "gebaeude": ["bâtiment", "batiment", "édifice", "immeuble", "façade", "facade"], "stadt": ["ville", "contexte", "quartier"], "schnittWort": ["coupe", "coupé", "couper", "section", "ouvre", "ouvrir", "tranche"], "schnittZu": ["ferme", "fermer", "referme", "entier", "aucune", "sans coupe"], "ug": ["sous-sol", "cave", "souterrain"], "eg": ["rez-de-chaussée", "rez de chaussée", "rdc", "rez"], "og": ["premier étage", "1er étage", "étage"], "dg": ["comble", "toit", "grenier", "attique"], "laengs": ["longitudinal", "en long"], "quer": ["transversal", "en travers"], "axo": ["axono", "isométr", "isometr", "parallèle"], "persp": ["perspectiv"], "oben": ["en haut", "dessus", "vue aérienne", "aérien", "aerien", "oiseau", "ciel"], "garten": ["jardin"], "strasse": ["rue", "entrée", "entree"], "turm": ["tour", "gratte-ciel", "plus près", "rapproch"], "sockel": ["socle", "podium", "basement"], "block": ["îlot", "ilot", "tout", "ensemble", "loin"], "alles": ["tout comme au début", "réinitialis", "reinitialis", "recommence", "tout remettre", "remets tout"]}, "it": {"neg": ["senza", "togli", "rimuovi", "nascondi", "elimina", "leva", "niente", "nessun", "non"], "nur": ["solo", "soltanto", "solamente"], "umgebung": ["vicin", "intorno", "contesto circostante"], "baeume": ["alber", "vegetaz", "piant", "verde"], "einrichtung": ["arred", "mobil", "cucina"], "bestand": ["stato di fatto", "esistente", "originale", "antico", "1913"], "vorschlag": ["progetto", "propost", "ampliament", "ristruttur", "nuovo", "2026"], "tragwerk": ["struttur", "acciaio", "portant", "telaio"], "gebaeude": ["edifici", "fabbricat", "facciat", "prospett"], "stadt": ["città", "citta", "contesto", "quartiere"], "schnittWort": ["sezion", "taglia", "taglio", "apri", "aperto"], "schnittZu": ["chiudi", "chiusa", "intero", "nessuna", "senza sezione"], "ug": ["seminterrato", "interrato", "cantina", "sotterran"], "eg": ["piano terra", "pianterreno", "piano terreno"], "og": ["primo piano", "1° piano", "piano superiore"], "dg": ["sottotetto", "tetto", "soffitta", "mansard", "attico"], "laengs": ["longitudinal"], "quer": ["trasversal"], "axo": ["assonometr", "isometr", "parallel"], "persp": ["prospettiv"], "oben": ["dall’alto", "dall'alto", "sopra", "volo d", "aere"], "garten": ["giardin"], "strasse": ["strada", "via", "ingresso"], "turm": ["torre", "grattacielo", "più vicino", "avvicina"], "sockel": ["basamento", "podio", "zoccolo"], "block": ["isolato", "tutto", "insieme", "lontano"], "alles": ["tutto come all", "ripristina", "reimposta", "ricomincia", "resetta"]}, "pt": {"neg": ["sem", "tira", "retira", "esconde", "oculta", "remove", "apaga", "nenhum", "não"], "nur": ["só", "apenas", "somente"], "umgebung": ["vizinh", "entorno", "envolvente", "arredor"], "baeume": ["árvore", "arvore", "vegeta", "planta"], "einrichtung": ["mobil", "móve", "move", "cozinha"], "bestand": ["existente", "original", "antigo", "antes", "1913"], "vorschlag": ["proposta", "projeto", "ampliaç", "ampliac", "reabilita", "novo", "2026"], "tragwerk": ["estrutura", "aço", "aco", "pilar"], "gebaeude": ["edifício", "edificio", "prédio", "predio", "fachada"], "stadt": ["cidade", "contexto", "bairro"], "schnittWort": ["corte", "corta", "secção", "seção", "secao", "abre", "aberto"], "schnittZu": ["fecha", "fechado", "inteiro", "nenhum corte", "sem corte"], "ug": ["cave", "subsolo", "porão", "porao", "garagem"], "eg": ["piso térreo", "térreo", "terreo", "rés-do-chão", "res-do-chao"], "og": ["primeiro andar", "1º andar", "primeiro piso", "andar de cima"], "dg": ["sótão", "sotao", "cobertura", "telhado", "águas-furtadas"], "laengs": ["longitudinal"], "quer": ["transversal"], "axo": ["axonometr", "isometr", "paralel"], "persp": ["perspetiv", "perspectiv"], "oben": ["de cima", "cima", "aére", "aere", "pássaro", "passaro"], "garten": ["jardim"], "strasse": ["rua", "entrada"], "turm": ["torre", "arranha-céu", "mais perto", "aproxima"], "sockel": ["embasamento", "pódio", "podio", "base"], "block": ["quarteirão", "quarteirao", "tudo", "conjunto", "longe"], "alles": ["tudo como no início", "tudo como no inicio", "repor", "reiniciar", "recomeçar", "recomecar", "repõe tudo"]}};
{
  const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), muster = ws => ws.map(w => w.length <= 3 ? `(?<!\\p{L})${esc(w)}(?!\\p{L})` : `(?<!\\p{L})${esc(w)}`).join('|');   // Wortgrenze, die auch á, é, ç kennt
  const dazu = (re, ws) => ws?.length ? new RegExp(`${re.source}|${muster(ws)}`, 'iu') : re;
  for (const L of Object.values(WOERTER)) {
    W.neg = dazu(W.neg, L.neg); W.nur = dazu(W.nur, L.nur); W.schnittWort = dazu(W.schnittWort, L.schnittWort); W.schnittZu = dazu(W.schnittZu, L.schnittZu); W.alles = dazu(W.alles, L.alles);
    for (const k of ['umgebung', 'baeume', 'einrichtung', 'bestand', 'vorschlag', 'tragwerk', 'gebaeude', 'stadt']) W.gruppen[k] = dazu(W.gruppen[k], L[k]);
    W.gruppen.pflanzen = dazu(W.gruppen.pflanzen, L.baeume);
    for (const e of W.schnitt) e[1] = dazu(e[1], L[e[0]]); for (const e of W.kamera) e[1] = dazu(e[1], L[e[0]]); for (const e of W.blick) e[1] = dazu(e[1], L[e[0]]);
  }
}
function deuten(text) {
  const t = text.toLowerCase(); const a = {}; let traf = false;
  if (W.alles.test(t)) return { alles: true };
  for (const [k, re] of W.modell) if (!MODELLE[k]?.versteckt && re.test(t) && !(k === 'vancouver' && /turm|tower|torre/.test(t) && aktiv.name === 'vancouver')) { if (MODELLE[k] !== aktiv && /vancouver|five|m[üu]nchen|munich|m[úu]nich|villa|walhalla/i.test(t)) { a.modell = k; traf = true; } break; }
  const m = a.modell ? MODELLE[a.modell] : aktiv;
  for (const [k, re] of W.zustand) if (re.test(t) && m.zustaende) { a.zustand = k; traf = true; break; }
  const neg = W.neg.test(t), nur = W.nur.test(t), g = {};
  for (const [k, re] of Object.entries(W.gruppen)) if (k in m.dateien && re.test(t) && !(a.zustand && (k === 'bestand' || k === 'vorschlag'))) g[k] = !neg;
  if (Object.keys(g).length) { if (nur) for (const k of Object.keys(m.dateien)) if (!(k in g) && !(m.zustaende && (k === 'bestand' || k === 'vorschlag'))) g[k] = false; a.gruppen = g; traf = true; }
  if (W.schnittWort.test(t)) {   // nur mit Schnittwort: „mach aus dem Dach eine Terrasse“ ist kein Schnitt
    if (W.schnittZu.test(t) && !/auf\b|open|abre/i.test(t)) { a.schnitt = 'kein'; traf = true; }
    else for (const [k, re] of W.schnitt) if (re.test(t) && m.schnitte[k]) { a.schnitt = k; traf = true; break; }
  }
  for (const [k, re] of W.kamera) if (re.test(t)) { a.kamera = k; traf = true; break; }
  for (const [k, re] of W.blick) if (re.test(t) && m.blicke[k]) { a.blick = k; traf = true; break; }
  return traf ? a : null;
}
// Freier Text: erst hier deuten, sonst Forma Cloud fragen
async function sagen(text) {
  text = (text || '').trim(); if (!text) return;
  window.formaZaehl?.('satz');
  if (aktiv?.bau && !/^(von |aus |zeig |blick|view|vista|von oben|from above|desde arriba)/i.test(text)) return bauWunsch(text);   // auf dem Bauplatz baut jeder Satz, nur reine Blickwünsche nicht   // Statistik: nur dass ein Satz kam, nie der Text
  // 2.11. (Tassilo: „meistens versteht es nicht“, Prüfregel tools/pruefe_saetze.mjs): freier Text geht zuerst an das Sprachmodell der Cloud,
  // die Stichwörter (deuten) sind nur der Rückfall, wenn die Cloud nicht antwortet
  const T = SAGT[sprache()]; let a = null;
  melde(T.denkt);
  try {
    const ab = new AbortController(), uhr = setTimeout(() => ab.abort(), 9000);
    const r = await fetch(CLOUD, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ab.signal, body: JSON.stringify({ text, modell: aktiv.name, lang: sprache() }) });
    clearTimeout(uhr);
    if (r.ok) { const j = await r.json(); if (j.aktionen && Object.keys(j.aktionen).length) { a = j.aktionen; a.antwort = j.antwort; } else if (j.antwort) { melde(j.antwort); return; } }
  } catch (e) { console.warn('Cloud nicht erreichbar, deute selbst', e); }
  if (!a) a = deuten(text);
  if (!a) { melde(T.unklar); return; }
  const gesagt = tun(a); melde(a.antwort || gesagt || T.unklar);
}

wrap.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !gestartet) return;
  if (b.dataset.modell) { aktiviere(b.dataset.modell); melde(''); }
  else if (b.dataset.bau != null) sagen(b.textContent);
  else if (b.dataset.aktion) { try { melde(tun(JSON.parse(b.dataset.aktion))); } catch (err) { console.error(err); } }
});
const eingabe = frage?.querySelector('[name=text]');
// Das Feld wächst mit dem Text nach unten (bis 45 % der Fensterhöhe, dann blättert es); Enter sendet, Umschalt+Enter macht eine neue Zeile
const wachse = () => { if (!eingabe) return; eingabe.style.height = 'auto'; eingabe.style.height = eingabe.scrollHeight + 4 + 'px'; eingabe.style.overflowY = eingabe.scrollHeight > innerHeight * 0.45 ? 'auto' : 'hidden'; };
eingabe?.addEventListener('input', wachse);
eingabe?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); frage.requestSubmit(); } });
frage?.addEventListener('submit', e => { e.preventDefault(); if (!gestartet) start(); const t = eingabe.value; eingabe.value = ''; wachse(); sagen(t); });

// Diktat (2.11., Tassilo: „es soll schreiben, was du sagst, so lange du willst“): Spracherkennung des Browsers (Chrome, Safari, Edge; Firefox kann es
// nicht, dort bleibt der Knopf verborgen). Ein Tipp startet, der Text läuft ins Feld und hängt sich an, was schon dort steht. Endet der Browser die
// Erkennung von selbst (Pause, Safari nach einer Minute), startet sie neu, bis du den Knopf noch einmal tippst. Gesendet wird erst mit Senden oder Enter.
// Prüfregel tools/pruefe_satzfeld.mjs: alte Erkennungen werden abgekoppelt (Safari liefert spät noch Ergebnisse), der Text eines Abschnitts wird bei
// jedem Ergebnis neu zusammengesetzt statt angehängt, Tippen oder Absenden beendet das Diktat.
const SR = window.SpeechRecognition || window.webkitSpeechRecognition, mikro = frage?.querySelector('.mikro');
if (SR && mikro && eingabe) {
  mikro.hidden = false; let rec = null, will = false, basis = '', neustarts = 0, stille = 0;
  const LAND = { de: 'de-DE', en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', pt: 'pt-PT' };
  const abkoppeln = () => { const r = rec; rec = null; if (!r) return; r.onresult = r.onend = r.onerror = null; try { r.abort(); } catch { /* schon beendet */ } };
  const stopp = () => { will = false; clearTimeout(stille); abkoppeln(); mikro.classList.remove('an'); if (status?.textContent === SAGT[sprache()].hoert) melde(''); };
  const lauf = () => {
    abkoppeln(); if (!will) return;
    basis = eingabe.value.replace(/\s+$/, '');
    const r = rec = new SR(); r.lang = LAND[sprache()] || 'en-US'; r.interimResults = true; r.continuous = true; r.maxAlternatives = 1;
    r.onresult = e => {
      if (rec !== r) return;
      let t = ''; for (const x of e.results) t += x[0].transcript;
      t = t.replace(/\s+/g, ' ').trim(); eingabe.value = basis && t ? basis + ' ' + t : basis || t; wachse(); eingabe.scrollTop = eingabe.scrollHeight;
      neustarts = 0; clearTimeout(stille); stille = setTimeout(stopp, 120000);   // zwei Minuten ohne Wort: aus
    };
    r.onerror = e => {
      if (rec !== r) return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') { stopp(); melde(SAGT[sprache()].mikroAus); }
      else if (e.error !== 'aborted' && e.error !== 'no-speech') console.warn('Diktat', e.error);
    };
    r.onend = () => { if (rec !== r) return; rec = null; if (will && ++neustarts < 8) setTimeout(lauf, 150); else stopp(); };   // weiter hören, bis du stoppst
    try { r.start(); } catch (err) { rec = null; stopp(); console.warn('Diktat', err); }
  };
  mikro.addEventListener('click', () => {
    if (will) { stopp(); eingabe.focus(); return; }
    if (!gestartet) start();
    will = true; neustarts = 0; mikro.classList.add('an'); melde(SAGT[sprache()].hoert); window.formaZaehl?.('diktat');
    clearTimeout(stille); stille = setTimeout(stopp, 120000); lauf();
  });
  eingabe.addEventListener('input', e => { if (will && e.isTrusted !== false) stopp(); });   // wer tippt, übernimmt das Feld
  frage.addEventListener('submit', () => { if (will) stopp(); }, true);                     // vor dem Absenden (Erfassungsphase)
}

// Erst laden, wenn der Abschnitt ins Bild kommt; nur rendern, solange er sichtbar ist
new IntersectionObserver(es => { for (const e of es) { sichtbar = e.isIntersecting; if (sichtbar) start(); } }, { rootMargin: '200px' }).observe(wrap);

// Film (?film=1, nur für die Aufnahme mit out/film_tmp.mjs). Endlosschleife (2.11., Tassilo: „fängt an, wo es aufhört“, die ganze Stadt soll
// auftreten, keine gepunktete Linie): Die Kamera fährt in F.dauer Sekunden genau einmal um den Turm. Am Anfang und am Ende steht der Turm allein
// auf weißer Scheibe wie im Fenster der App. Dazwischen wächst die Stadt von innen nach außen, erst die Fotokacheln, dann die ganze gebaute
// Stadt bis zu den Bergen (site/film/stadt.glb aus tools/film_stadt.mjs, in Ringen), und sinkt wieder zurück. Alle Größen hängen nur von
// cos(2π t/T) ab, darum ist das letzte Bild wieder das erste. window.formaFilm.setze(t) zeichnet das Bild zur Zeit t in Sekunden.
if (new URLSearchParams(location.search).get('film')) {
  const F = { dauer: 24, bereit: false, kacheln: [], ringe: [], scheibe: null, hoch: 1, weite: 30, zurueck: 0.12, tiefer: 90, turm: [78, -15] };   // turm: Mitte des Turms im Grundriss (x, z), gemessen an den Punkten über 100 m   // weite: waagrechte Bildweite im Hochformat (Grad)
  window.formaFilm = F; F.innen = () => ({ m: aktiv, scene, THREE, renderer });   // nur für Prüfungen der Aufnahme
  F.start = async () => {
    const px = +(new URLSearchParams(location.search).get('px')) || 1024;   // Kantenlänge der Aufnahme (2.11., Tassilo: mehr Pixel)
    const py = +(new URLSearchParams(location.search).get('py')) || px;     // Höhe (2.11., Reel im Hochformat 1080 × 1920); ohne py quadratisch wie bisher
    F.hoch = py / px; canvas.style.width = px + 'px'; canvas.style.height = py + 'px'; wrap.querySelector('.m-buehne').style.width = px + 'px';
    start(); renderer.setPixelRatio(1); aktiviere('vancouver'); groesse();
    const himmel = new THREE.Color(0xa9b9c2); scene.background = himmel; scene.fog = new THREE.Fog(himmel, 1e6, 2e6);
    const m = aktiv; m.wurzel.children.find(o => o.geometry?.type === 'CircleGeometry').visible = false;
    F.scheibe = new THREE.Mesh(new THREE.CircleGeometry(270, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })); F.scheibe.rotation.x = -Math.PI / 2; F.scheibe.position.y = -0.4; m.wurzel.add(F.scheibe);
    const K = ['tragwerk', 'gebaeude', 'pflanzen', 'stadt', 'kacheln', 'fern']; for (const k of K) if (!m.gruppen[k]) lade(k);
    while (K.some(k => !m.gruppen[k]?.children.length) || !m.baumNetz?.children.length) await new Promise(r => setTimeout(r, 200));   // alles geladen
    m.sichtbar.stadt = false; for (const k of Object.keys(m.dateien)) zeige(k); m.gruppen.fern.visible = true;   // die Ringe blendet setze() einzeln
    // Bäume rundherum (Gehwege, Nachbarschaft, Straßenbäume am Boden) weg, die Stadt bringt ihre eigenen; nur Turm und Dachgärten behalten ihre Bäume
    const M = new THREE.Matrix4(), P = new THREE.Vector3();
    for (const I of m.baumNetz.children) { for (let i = 0; i < I.count; i++) { I.getMatrixAt(i, M); P.setFromMatrixPosition(M); if (Math.abs(P.x) > 118 || Math.abs(P.z) > 75 || P.y < 5) { M.makeScale(0.0001, 0.0001, 0.0001); I.setMatrixAt(i, M); } } I.instanceMatrix.needsUpdate = true; }
    m.gruppen.kacheln.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox, c = new THREE.Vector3(); b.getCenter(c); F.kacheln.push({ o, y0: b.min.y, d: Math.hypot(c.x, c.z) }); } });
    const dmax = Math.max(...F.kacheln.map(k => k.d)); for (const k of F.kacheln) k.d /= dmax;
    const ringe = []; m.gruppen.fern.traverse(o => { if (o.isMesh && /^r\d+$/.test(o.name)) ringe.push(o); });   // die ganze Stadt in Ringen (fern.glb)
    ringe.sort((a, b) => +a.name.slice(1) - +b.name.slice(1));
    F.ringe = ringe.map((o, i) => { o.geometry.computeBoundingBox(); return { o, y0: o.geometry.boundingBox.min.y, e: i / Math.max(1, ringe.length - 1) }; });
    camera.far = 80000; camera.updateProjectionMatrix();
    F.bereit = true;
  };
  F.setze = t => {
    const m = aktiv, T = F.dauer, u = ((t % T) + T) % T / T, glatt = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
    const welle = (1 - Math.cos(2 * Math.PI * u)) / 2, weit = glatt(welle * 1.22);   // 0 am Anfang und Ende, oben ein Plateau
    const G = weit * 2.35;                                                               // Wachstum: 0 bis 0,9 Fotokacheln, 0,9 bis 2,1 ganze Stadt bis zu den Bergen
    // Kamera: eine volle Runde, steigt und zieht zurück, bis Stadt, Hafen und Nordufer im Bild sind
    // 2.11. (Tassilo: näher an den Gebäuden, tiefer, die Berge sehen): flacher Blick, Abstand höchstens rund 2,1 km
    const a = (28 + 360 * u) * Math.PI / 180, w2 = weit ** 1.4, r = 560 + 1550 * w2, hoehe = 360 + 230 * w2, ziel = 125 - 45 * weit;
    // Hochformat: Bildweite senkrecht größer, damit die Breite ungefähr bleibt; etwas weiter weg und tiefer gezielt, so steht der Turm oben und die Stadt füllt unten
    const hk = Math.max(1, F.hoch || 1), fov = hk > 1 ? 2 * Math.atan(Math.tan(F.weite / 2 * Math.PI / 180) * hk) * 180 / Math.PI : FOV;
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    const rr = r * (1 + F.zurueck * (hk - 1)), zz = ziel - F.tiefer * (hk - 1) * (1 - 0.6 * weit);
    const mx = hk > 1 ? F.turm[0] * (1 - 0.5 * weit) : 0, mz = hk > 1 ? F.turm[1] * (1 - 0.5 * weit) : 0;   // Hochformat: Kreis um den Turm statt um die Blockmitte, sonst steht er am Rand
    camera.position.set(mx + Math.sin(a) * rr, hoehe, mz + Math.cos(a) * rr); controls.target.set(mx, zz, mz); controls.update();
    scene.fog.near = 7000; scene.fog.far = 42000;   // Berge bleiben sichtbar, der Rand der Daten verblasst
    let irgend = false;
    for (const k of F.kacheln) { const s = glatt((G - 0.9 * k.d) / 0.18); k.o.scale.y = Math.max(s, 0.0001); k.o.position.y = k.y0 * (1 - k.o.scale.y); k.o.visible = s > 0.0005; irgend ||= s > 0.0005; }
    m.gruppen.kacheln.visible = irgend; m.gruppen.stadt.visible = G > 0.25;
    for (const R of F.ringe) { const s = glatt((G - 0.9 - 1.0 * R.e) / 0.22); R.o.scale.y = Math.max(s, 0.0001); R.o.position.y = R.y0 * (1 - R.o.scale.y); R.o.visible = s > 0.0005; }
    const sch = 1 - glatt(G / 0.35); F.scheibe.scale.set(Math.max(sch, 0.001), Math.max(sch, 0.001), 1); F.scheibe.visible = sch > 0.002;
    renderer.render(scene, camera);
  };
}

// Baufilm (?baufilm=1, nur für die Aufnahme mit tools/bauplatz_aufnahme.mjs; 2.11., Reel): der Bauplatz in mehreren Zuständen nacheinander, wie
// die Cloud sie geliefert hat (Listen aus /demo/bauen). Die Kamera kreist langsam um das Haus, alle F.takt Sekunden kommt der nächste Zustand.
// Neue und in der Form geänderte Teile wachsen in F.wachs Sekunden von ihrer Unterkante (Maßstab y), die alte Form sinkt zugleich weg;
// ändert sich nur die Farbe, blendet sie über. window.formaBauFilm.setze(t) zeichnet das Bild zur Zeit t in Sekunden.
if (new URLSearchParams(location.search).get('baufilm')) {
  const F = { takt: 4, wachs: 0.6, dauer: 0, bereit: false, gruppen: [], weite: 30 };   // weite: waagrechte Bildweite (Grad)
  window.formaBauFilm = F;
  const ohneFarbe = t => JSON.stringify({ ...t, farbe: undefined });
  F.start = listen => {
    const q = new URLSearchParams(location.search), px = +q.get('px') || 1080, py = +q.get('py') || px;
    F.hoch = py / px; canvas.style.width = px + 'px'; canvas.style.height = py + 'px'; wrap.querySelector('.m-buehne').style.width = px + 'px';
    start(); renderer.setPixelRatio(1); aktiviere('bauplatz'); groesse();
    const m = aktiv; m.bauGruppe.visible = false;
    // Boden bis zum Horizont, der Rand verschwindet im weißen Dunst
    m.wurzel.children.find(o => o.geometry?.type === 'CircleGeometry')?.scale.setScalar(8);
    scene.background = new THREE.Color(0xffffff); scene.fog = new THREE.Fog(0xffffff, 90, 320);
    F.gruppen = []; listen.forEach((teile, i) => {
      const g = baue(teile, UMGEBUNG), vor = new Map((listen[i - 1] || []).map(t => [t.id, t])), jetzt = new Set(teile.map(t => t.id));
      g.visible = false; m.wurzel.add(g);
      g.children.forEach((o, k) => {
        const t = teile.find(x => x.id === o.userData.teil) || teile[k], a = vor.get(t.id);
        o.userData.neu = o.material.color.clone();
        if (!i || (a && JSON.stringify(a) === JSON.stringify(t))) o.userData.art = 'gleich';
        else if (a && ohneFarbe(a) === ohneFarbe(t)) { o.userData.art = 'farbe'; o.userData.alt = new THREE.Color(/^#[0-9a-f]{6}$/i.test(a.farbe || '') ? a.farbe : '#d8d4cc'); }
        else o.userData.art = 'neu';
      });
      // Teile des vorigen Zustands, die verschwinden oder ihre Form ändern, sinken beim Wechsel weg
      if (i) for (const o of F.gruppen[i - 1].children) { const t = teile.find(x => x.id === o.userData.teil); o.userData.geht = !jetzt.has(o.userData.teil) || (t && ohneFarbe(t) !== ohneFarbe(vor.get(t.id))); }
      F.gruppen.push(g);
    });
    F.dauer = listen.length * F.takt; F.bereit = true;
  };
  F.setze = t => {
    const n = F.gruppen.length, i = Math.max(0, Math.min(n - 1, Math.floor(t / F.takt))), s = t - i * F.takt;
    const glatt = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x), k = glatt(s / F.wachs);
    F.gruppen.forEach((g, j) => { g.visible = j === i || (j === i - 1 && k < 1); });
    // Neue Teile wachsen von unten nach oben: wer höher ansetzt, beginnt später (Turmdach erst, wenn der Schaft steht)
    const neue = F.gruppen[i].children.filter(o => o.userData.art === 'neu'), oben = Math.max(1, ...neue.map(o => o.position.y));
    for (const o of F.gruppen[i].children) {
      const art = o.userData.art; o.visible = true;
      const ko = art === 'neu' ? glatt((s - 0.9 * Math.max(0, o.position.y) / oben) / F.wachs) : k;
      o.scale.y = art === 'neu' ? Math.max(ko, 0.0001) : 1; if (art === 'neu') o.visible = ko > 0.001;
      if (art === 'farbe') o.material.color.copy(o.userData.alt).lerp(o.userData.neu, k);
    }
    if (i > 0) for (const o of F.gruppen[i - 1].children) { o.visible = !!o.userData.geht; o.scale.y = Math.max(1 - k, 0.0001); }
    // Kamera: langsamer Bogen um das Haus, leicht steigend; im Hochformat größere Bildweite senkrecht, damit die Breite bleibt
    const hk = Math.max(1, F.hoch || 1), fov = 2 * Math.atan(Math.tan(F.weite / 2 * Math.PI / 180) * hk) * 180 / Math.PI;
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    // Bogen von Südwest nach Süden: Haustür und Turm (Südostecke) bleiben im Bild, Abstand wächst leicht mit dem Gebäude
    const u = t / Math.max(F.dauer, 1), a = (-25 + 55 * u) * Math.PI / 180, r = 40 + 4 * u, hoehe = 10 + 4 * u;
    camera.position.set(Math.sin(a) * r, hoehe, Math.cos(a) * r); controls.target.set(0, 7, 0); controls.update();
    renderer.render(scene, camera);
  };
}
