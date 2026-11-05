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
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
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
  // Safari (4.11., Tassilo: „mit zwei Fingern kann man nicht zoomen“): Mac-Trackpad und iPhone melden das Auseinanderziehen als gesturechange; ohne
  // preventDefault zoomt die Seite statt des Modells. Mit Fingern auf dem Bild (iPhone) zoomt OrbitControls selbst, sonst (Trackpad) hier.
  let gs = 1; const finger = new Set();
  canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') finger.add(e.pointerId); });
  for (const ev of ['pointerup', 'pointercancel']) canvas.addEventListener(ev, e => finger.delete(e.pointerId));
  canvas.addEventListener('gesturestart', e => { e.preventDefault(); gs = e.scale || 1; fahrtAbbrechen(); });
  canvas.addEventListener('gesturechange', e => { e.preventDefault(); const s = e.scale || 1, f = gs / s; gs = s; if (!finger.size) zoomen(f); });
  canvas.addEventListener('gestureend', e => e.preventDefault());
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
function zoomen(f) {   // f < 1 näher, f > 1 weiter weg; Grenzen der Steuerung gelten
  if (!camera || !controls || !isFinite(f) || f <= 0) return;
  if (tour) { tour.fov = Math.min(80, Math.max(30, tour.fov * f)); camera.fov = tour.fov; camera.updateProjectionMatrix(); return; }   // im Rundgang: Bildwinkel statt Abstand
  if (camera.isOrthographicCamera) { camera.zoom = Math.min(controls.maxZoom, Math.max(controls.minZoom, camera.zoom / f)); camera.updateProjectionMatrix(); return; }
  const v = camera.position.clone().sub(controls.target), d = Math.min(controls.maxDistance, Math.max(controls.minDistance, v.length() * f));
  camera.position.copy(controls.target).addScaledVector(v.normalize(), d);
}
function strahl(pos, ziel) {   // freier Blick von pos Richtung ziel bis zur ersten undurchsichtigen Fläche der Wohnung, Meter
  const m = aktiv, o = new THREE.Vector3(...pos), r = new THREE.Raycaster(o, new THREE.Vector3(...ziel).sub(o).normalize(), 0.05, 60), ziele = [];
  for (const k of m.haus?.wohnung || Object.keys(m.gruppen)) m.gruppen[k]?.traverse(x => { if (x.isMesh && x.visible && x.material !== SCHNITT && !x.material.transparent) ziele.push(x); });
  return r.intersectObjects(ziele, false)[0]?.distance ?? Infinity;
}
// Rundgang (4.11.): liegt eine Wand zwischen zwei Halten, kurz abblenden und springen statt durch die Wand zu fahren
function blenden(pos, ziel, danach) {
  canvas.style.transition = 'opacity .3s'; canvas.style.opacity = '0';
  setTimeout(() => { if (!rundgangLauf) { canvas.style.opacity = '1'; return; } camera.position.set(...pos); controls.target.set(...ziel); camera.lookAt(controls.target); controls.update(); canvas.style.opacity = '1'; setTimeout(() => danach?.(), 350); }, 320);
}
function fahrtAbbrechen() { if (tour) return; if (fahrt || rundgangLauf) { fahrt = null; rundgangLauf = null; if (controls) { controls.enabled = true; controls.target.copy(controls.target); } } }   // im Rundgang zum Selbersteuern bricht Ziehen nichts ab
// Spiegel (4.11., Tassilo: „Spiegel mit Spiegeltextur“): je Spiegelkörper (Gruppe „spiegel“, web_wohnung_glb spiegelNamen=) eine spiegelnde Fläche auf
// der Raumseite (die Seite, auf der bis 40 cm keine Wand ist); am Rechner echte Spiegelung (Reflector), am Handy glänzend mit Umgebungsbild
async function spiegelBauen(m, netze) {
  for (let i = 0; i < 100 && !m.gruppen.architektur?.children.length; i++) await new Promise(r => setTimeout(r, 200));
  for (const o of netze) {
    o.updateWorldMatrix(true, false); const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, P = g.attributes.position, n = P.count / 3, wurzel = [...Array(n).keys()], w = i => wurzel[i] === i ? i : (wurzel[i] = w(wurzel[i])), ecke = {};
    for (let t = 0; t < n; t++) for (let j = 0; j < 3; j++) { const v = new THREE.Vector3().fromBufferAttribute(P, t * 3 + j).applyMatrix4(o.matrixWorld), key = v.toArray().map(x => Math.round(x * 200)).join(); if (ecke[key] != null) wurzel[w(t)] = w(ecke[key]); else ecke[key] = t; }
    const teile = {}; for (let t = 0; t < n; t++) (teile[w(t)] ||= []).push(t);
    for (const T of Object.values(teile)) {
      const b = new THREE.Box3(); for (const t of T) for (let j = 0; j < 3; j++) b.expandByPoint(new THREE.Vector3().fromBufferAttribute(P, t * 3 + j).applyMatrix4(o.matrixWorld));
      const gr = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()), ax = gr.x < gr.z ? 'x' : 'z', breite = ax === 'x' ? gr.z : gr.x; if (breite < 0.15 || gr.y < 0.15) continue;
      const frei = sg => { const d = new THREE.Vector3(); d[ax] = sg; const h = new THREE.Raycaster(c.clone().addScaledVector(d, gr[ax] / 2 + 0.01), d, 0, 0.4).intersectObject(m.gruppen.architektur, true)[0]; return h ? h.distance : 1; };
      const sg = frei(1) >= frei(-1) ? 1 : -1, nrm = new THREE.Vector3(); nrm[ax] = sg;
      const geo = new THREE.PlaneGeometry(breite, gr.y), f = SCHWACH ? new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xdfe3e3, metalness: 1, roughness: 0.04, envMap: UMGEBUNG, envMapIntensity: 1 }))
        : new Reflector(geo, { textureWidth: 1024, textureHeight: Math.round(1024 * gr.y / breite), color: 0xc9cdcd, clipBias: 0.003 });
      f.position.copy(c).addScaledVector(nrm, gr[ax] / 2 + 0.002); f.lookAt(f.position.clone().add(nrm)); f.userData.ohneAO = true; m.gruppen.spiegel.add(f);   // Gruppe ohne Versatz: Welt = Gruppe; folgt ihrer Sichtbarkeit
    }
  }
}
// Tipp auf eine Tür oder Schranktür öffnet oder schließt sie, wenn keine Wand davor liegt (auch im Rundgang)
// Türpunkte (5.11., Tassilo: „bei jeder Tür einen kleinen weißen Punkt mit einem Kreis rundherum; wenn man ihn berührt, ein bisschen Effekt, dann geht
// sie auf oder zu“): je Türflügel auf beiden Seiten des Blatts in Griffhöhe, nah am freien Ende; sie gehen mit dem Blatt mit. Tipp: Ring weitet sich und verblasst
const PUNKT_BILD = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 8;
  g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 44, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 17, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const RING_BILD = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.stroke(); return new THREE.CanvasTexture(c); })();
const pulse = [];
function tuerPunkte(o) {
  o.updateMatrixWorld(true); const inv = o.matrixWorld.clone().invert(), b = new THREE.Box3();
  o.traverse(c => { if (c.isMesh && c.geometry) { c.geometry.computeBoundingBox(); b.union(c.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld))); } });
  if (b.isEmpty()) return; const s = b.getSize(new THREE.Vector3()), lang = s.x >= s.z ? 'x' : 'z', duenn = lang === 'x' ? 'z' : 'x';
  const frei = Math.abs(b.max[lang]) > Math.abs(b.min[lang]) ? b.max[lang] : b.min[lang], y = Math.min(b.max.y - 0.2, Math.max(b.min.y + 0.3, 1.05)), m = (b.min[duenn] + b.max[duenn]) / 2;
  for (const sg of [-1, 1]) { const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: PUNKT_BILD, transparent: true, depthWrite: false, toneMapped: false })); p.scale.setScalar(0.15); p.renderOrder = 8;
    const S = o.userData.schub, dl = S ? S.d[lang] : 0, vorn = dl > 0 ? b.min[lang] + 0.04 : b.max[lang] - 0.04;   // Schiebetür (5.11.): Punkt an der Vorderkante, sie bleibt offen sichtbar
    p.position[lang] = S ? vorn : frei * 0.72; p.position.y = y; p.position[duenn] = m + sg * (s[duenn] / 2 + 0.03); p.userData.tuerPunkt = true; p.userData.ohneAO = true; p.userData.seite = new THREE.Vector3(0, 0, 0).setComponent(duenn === 'x' ? 0 : 2, sg); o.add(p); }
}
function pulsieren(o) {   // Ring am Türpunkt, der zur Kamera zeigt
  let best = null, bd = Infinity; const w = new THREE.Vector3(); o.traverse(c => { if (!c.userData.tuerPunkt) return; c.getWorldPosition(w); const d = w.distanceTo(camera.position); if (d < bd) { bd = d; best = w.clone(); } }); if (!best) return;
  const r = new THREE.Sprite(new THREE.SpriteMaterial({ map: RING_BILD, transparent: true, depthWrite: false, depthTest: false, toneMapped: false })); r.position.copy(best); r.renderOrder = 12; r.userData.ohneAO = true; scene.add(r); pulse.push({ r, t0: performance.now() });
}
const PUNKT_W = new THREE.Vector3(), PUNKT_N = new THREE.Vector3();
function punkteSeite() { aktiv?.gruppen.tueren?.traverse(c => { if (!c.userData.tuerPunkt) return; c.getWorldPosition(PUNKT_W); PUNKT_N.copy(c.userData.seite).transformDirection(c.parent.matrixWorld); c.visible = PUNKT_N.dot(camera.position.clone().sub(PUNKT_W)) > 0; }); }   // nur der Punkt auf der Seite der Kamera (durch Glas sonst doppelt)
function pulseBewegen() { const jetzt = performance.now(); for (let i = pulse.length - 1; i >= 0; i--) { const { r, t0 } = pulse[i], u = (jetzt - t0) / 650; if (u >= 1) { scene.remove(r); r.material.dispose(); pulse.splice(i, 1); continue; } r.scale.setScalar(0.15 + 0.35 * u); r.material.opacity = 1 - u; } }
function tuerTipp(ray, nurPruefen) {
  const m = aktiv, G = ['tueren', 'schraenke', 'fenster'].map(k => m?.gruppen[k]).filter(g => g?.visible); if (!G.length) return false;
  const h = ray.intersectObjects(G, true)[0]; if (!h || h.distance > 8) return false;
  const w = ray.intersectObjects(['architektur', 'einbauten'].map(k => m.gruppen[k]).filter(g => g?.visible), true)[0]; if (w && w.distance < h.distance - 0.03) return false;
  let o = h.object; while (o && !o.userData.angel && !o.userData.schub && !o.userData.falt) o = o.parent; if (!o) return false; if (nurPruefen) return true;
  if (o.userData.falt) { const L = o.parent.children.filter(c => c.userData.falt), z = o.userData.ziel > 0.5 ? 0 : 1; pulsieren(L.find(c => c.userData.falt.k === 0) || o); for (const c of L) c.userData.ziel = z; return true; }   // Faltläden: alle zusammen
  pulsieren(o);
  if (o.userData.schub) { if (!o.userData.schub.t) o.userData.schub.t = 0; o.userData.ziel = o.userData.ziel > 0.5 ? 0 : 1; return true; }
  const A = o.userData.angel; o.userData.ziel = Math.abs((o.userData.ziel ?? A.zu) - A.offen) < 0.01 ? A.zu : A.offen; return true;
}
// Rundgang wie Street View (4.11., Tassilo: „Pfeile am Boden wie bei Google Maps, viel smoother, rechts und links drehen; unten keine Leiste, nur das
// Zimmer; Türen immer offen“): die Laufwege (tools/stadt_rundgang_wege.py) sind ein Netz zwischen den Halten. Am Halt liegen weiße Pfeile am Boden, je
// Richtung einer (durch dieselbe Tür nur der nächste Halt); Tipp auf einen Pfeil oder auf den Boden in seiner Richtung geht den Weg in einer
// fließenden Bewegung (gerundete Bahn, sanft an- und abfahren, Blick in Gehrichtung und leicht nach unten). Ziehen dreht den Blick, Mausrad und zwei
// Finger ändern den Bildwinkel, Tasten ↑ ↓ gehen, ← → drehen. Oben links nur der Raumname.
let tour = null;
const SAGT_TOUR = { es: { hinweis: 'Arrastra para mirar. Toca una flecha o el suelo para avanzar.' }, en: { hinweis: 'Drag to look around. Tap an arrow or the floor to walk.' }, de: { hinweis: 'Ziehen zum Umsehen. Pfeil oder Boden antippen zum Gehen.' } };
function tourName(st) { return typeof st.name === 'object' ? st.name[sprache()] || st.name.es : st.name; }
const tourRichtung = st => new THREE.Vector3(...st.ziel).sub(new THREE.Vector3(...st.pos)).normalize();
function bodenHoehe(x, z, sonst) {   // Oberkante Boden unter x, z (Gruppe Architektur: Böden, Stufen, Terrassen 30 cm höher)
  const g = tour?.m.gruppen.architektur; if (!g) return sonst; const h = new THREE.Raycaster(new THREE.Vector3(x, 2.0, z), new THREE.Vector3(0, -1, 0), 0, 3).intersectObject(g, true)[0]; return h ? h.point.y : sonst;
}
function tourStarten(m, sanft) {
  const S = m.rundgang; if (!S?.length) return false; if (tour) tourEnde();   // erneut gestartet: von vorn, ohne doppeltes Schild
  if (m.schnitt && !sanft) schnitt('kein'); if (axo) projektion('persp');   // beim sanften Einflug erst unter der Decke
  fahrt = null; rundgangLauf = null;   // ein laufender Anflug nähme die Kamera sonst wieder mit
  tour = { m, i: 0, marken: new THREE.Group(), fov: m.haus?.fovInnen || 62 }; m.wurzel.add(tour.marken);
  const l = document.createElement('div'); l.className = 'm-raum'; l.innerHTML = '<b></b><span></span>'; l.querySelector('span').textContent = (SAGT_TOUR[sprache()] || SAGT_TOUR.es).hinweis;
  wrap.querySelector('.m-buehne').append(l); tour.schild = l; setTimeout(() => l.classList.add('still'), 7000);
  const st = S[0]; tourSchild(st); tour.laeuft = true;
  if (sanft && camera.isPerspectiveCamera) { einfliegen(st); return true; }
  ueberblenden(st.pos, st.ziel, () => { if (!tour) return; tour.laeuft = false; camera.fov = tour.fov; camera.updateProjectionMatrix(); tourBlick(st.pos, tourRichtung(st)); tourPfeile(); });
  return true;
}
function einfliegen(st) {   // von der Übersicht ohne Decke sanft hinein: Bogen über den Halt und senkrecht hinab, Blickrichtung bleibt gleich, nur der Blick senkt sich
  const t = tour, p0 = camera.position.clone(), T = new THREE.Vector3(...st.pos), C = new THREE.Vector3(T.x, Math.max(T.y + 3, p0.y * 0.85), T.z), d0 = camera.getWorldDirection(new THREE.Vector3());
  const h = new THREE.Vector3(d0.x, 0, d0.z).normalize(), n0 = Math.asin(Math.max(-1, Math.min(1, d0.y))), n1 = -0.14, f0 = camera.fov, t0 = performance.now(), dauer = 3200, m = t.m;
  controls.enabled = false;
  fahrt = () => {
    const u = Math.min(1, (performance.now() - t0) / dauer), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, a = 1 - e;
    camera.position.set(a * a * p0.x + 2 * a * e * C.x + e * e * T.x, a * a * p0.y + 2 * a * e * C.y + e * e * T.y, a * a * p0.z + 2 * a * e * C.z + e * e * T.z);
    const nk = n0 + (n1 - n0) * e, d = h.clone().multiplyScalar(Math.cos(nk)).setY(Math.sin(nk)); controls.target.copy(camera.position).addScaledVector(d, 0.01); camera.lookAt(controls.target);
    camera.fov = f0 + (t.fov - f0) * e; camera.updateProjectionMatrix();
    if (m.schnitt && camera.position.y < T.y + 0.9) schnitt('kein');   // unter der Decke: Decke wieder zu
    if (u >= 1) { fahrt = null; t.laeuft = false; tourBlick(st.pos, d); tourPfeile(); }
  };
}
function tourSchild(st, wohin) { const b = tour?.schild?.querySelector('b'); if (b) b.textContent = wohin ? '→ ' + tourName(wohin) : tourName(st); melde(''); }
function ueberblenden(pos, ziel, danach) {   // ohne Laufweg (von außen hinein): kurz abblenden und springen statt durch Wände zu fahren
  canvas.style.transition = 'opacity .35s'; canvas.style.opacity = '0';
  setTimeout(() => { camera.position.set(...pos); controls.target.set(...ziel); camera.lookAt(controls.target); controls.update(); danach?.(); canvas.style.opacity = '1'; }, 380);
}
function tourPfad(i, j) {   // Laufweg zwischen zwei Halten (Grundriss x, z), in Laufrichtung
  const W = tour?.m.rundgangWege?.wege; if (i == null || !W) return null; const a = W[Math.min(i, j) + '-' + Math.max(i, j)]; return a ? (i < j ? a : [...a].reverse()) : null;
}
function tourBlick(pos, dir) {   // Umsehen am Standpunkt: Drehpunkt 1 cm vor dem Auge, Ziehen dreht den Blick, kein Verschieben, kein Zoom; Blick mindestens 14° nach unten, dort liegen die Pfeile
  const d = dir.clone().normalize(); if (d.y > -0.14) { const hz = Math.hypot(d.x, d.z) || 1; d.set(d.x / hz * 0.99, -0.14, d.z / hz * 0.99).normalize(); }
  camera.position.set(...pos); controls.target.copy(camera.position).addScaledVector(d, 0.01);
  controls.enabled = true; controls.enablePan = false; controls.enableZoom = false; controls.rotateSpeed = -0.35; controls.minDistance = 0; controls.maxPolarAngle = Math.PI - 0.05; controls.update();
}
// Türen auf dem Laufweg (5.11., Tassilo: „wenn man durch eine Tür geht, sollte die Tür sich öffnen und dann wieder schließen“): Mitte des
// geschlossenen Blatts näher als 0,5 m an der Bahn; e = Bahnanteil an der Tür
function tuerMitte(o) { return tuerKasten(o).getCenter(new THREE.Vector3()); }
function tuerKasten(o) { if (o.userData.kastenZu) return o.userData.kastenZu; const r = o.rotation.y, p = o.position.clone(); if (o.userData.angel) o.rotation.y = o.userData.angel.zu; if (o.userData.schub) o.position.copy(o.userData.schub.basis);
  o.updateMatrixWorld(true); const b = new THREE.Box3(); o.traverse(c => { if (c.isMesh && !c.userData.tuerPunkt) b.expandByObject(c); }); o.rotation.y = r; o.position.copy(p); o.updateMatrixWorld(true); return (o.userData.kastenZu = b); }
function tuerenAufWeg(kurve, L) { const R = [], n = Math.max(8, Math.ceil(L / 0.1)), P = []; for (let k = 0; k <= n; k++) P.push(kurve.getPointAt(k / n)); const w = aktiv.wurzel.position;
  aktiv.gruppen.tueren?.traverse(o => { if (!(o.userData.angel || o.userData.schub) || o.parent?.userData.angel || o.parent?.userData.schub) return; const b = tuerKasten(o), k = P.findIndex(q => q.x + w.x > b.min.x - 0.12 && q.x + w.x < b.max.x + 0.12 && q.z + w.z > b.min.z - 0.12 && q.z + w.z < b.max.z + 0.12);
    if (k >= 0) R.push({ o, e: k / n }); }); return R; }   // nur Türen, deren geschlossenes Blatt die Bahn kreuzt (5.11.: an Türen vorbeigehen öffnete sie)
function tuerSetzen(o, auf) { if (o.userData.schub) { if (!o.userData.schub.t) o.userData.schub.t = 0; o.userData.ziel = auf ? 1 : 0; } else o.userData.ziel = auf ? o.userData.angel.offen : o.userData.angel.zu; }
function tourGehe(j) {
  const t = tour; if (!t || t.laeuft) return; const S = t.m.rundgang; j = (j + S.length) % S.length; if (j === t.i) return;
  const von = S[t.i], st = S[j], pfad = tourPfad(t.i, j); pfeileWeg(); t.laeuft = true; tourSchild(st);
  if (!pfad) { ueberblenden(st.pos, st.ziel, () => { if (tour !== t) return; t.laeuft = false; t.i = j; tourBlick(st.pos, tourRichtung(st)); tourPfeile(); }); return; }
  const P = pfad.map(([x, z]) => new THREE.Vector3(x, 0, z)).filter((v, k, A) => !k || v.distanceTo(A[k - 1]) > 0.04);
  const kurve = new THREE.CatmullRomCurve3(P, false, 'centripetal'), L = kurve.getLength(), dauer = Math.min(10, 1.2 + L / 1.0) * 1000, t0 = performance.now();   // 1 m/s, sanft an und ab (5.11., Tassilo: „langsamer, dynamischer“)
  // Augenhöhe = Boden unter der Bahn + Höhe über dem Boden der beiden Halte (Bodenhöhen vorab alle 25 cm, Terrassen liegen höher)
  const hA = von.pos[1] - bodenHoehe(von.pos[0], von.pos[2], 0), hB = st.pos[1] - bodenHoehe(st.pos[0], st.pos[2], 0), n = Math.max(2, Math.ceil(L / 0.25)), H = [];
  for (let k = 0; k <= n; k++) { const q = kurve.getPointAt(k / n); H.push(bodenHoehe(q.x, q.z, H.at(-1) ?? 0)); }
  const hoehe = u => { const f = u * n, k = Math.min(n - 1, Math.floor(f)); return H[k] + (H[k + 1] - H[k]) * (f - k); };
  const blick = camera.getWorldDirection(new THREE.Vector3()), richtung = new THREE.Vector3(blick.x, 0, blick.z).normalize(), zielH = tourRichtung(st).setY(0).normalize();
  const ende = kurve.getPointAt(1).sub(kurve.getPointAt(Math.max(0, 1 - 1.5 / L))).setY(0).normalize(), passt = ende.dot(zielH) > Math.cos(70 * Math.PI / 180) || strahl(st.pos, [st.pos[0] + ende.x * 5, st.pos[1] - 0.3, st.pos[2] + ende.z * 5]) < 2.5;   // in Gehrichtung verstellt (Schrank, Tür): doch zum Blick des Halts
  controls.enabled = false; const tueren = tuerenAufWeg(kurve, L); t.tuerLog ||= [];
  fahrt = () => {
    const u = Math.min(1, (performance.now() - t0) / dauer), e = 0.5 - 0.5 * Math.cos(Math.PI * u), p = kurve.getPointAt(e);
    for (const d of tueren) { if (d.o.userData.angel) d.max = Math.max(d.max || 0, Math.abs(d.o.rotation.y - d.o.userData.angel.zu)); if (!d.auf && e > d.e - 2 / L) { d.auf = true; tuerSetzen(d.o, true); t.tuerLog.push(d); } }   // 2 m vorher auf, sie bleibt offen (5.11., Tassilo: „die Türen sollten sich hinter dir nicht schließen“)
    const vor = kurve.getPointAt(Math.min(1, e + Math.min(0.5, 0.9 / L))).sub(kurve.getPointAt(Math.max(0, e - (0.3 + 1.2 * e) / L))); vor.y = 0;   // am Ende die letzten 1,5 m, nicht der letzte Schnipsel
    if (vor.lengthSq() > 1e-6) { vor.normalize(); if (!(e > 0.8 && vor.dot(richtung) < -0.2)) richtung.copy(vor); }   // Gehrichtung wie Street View; am Ende kein Umdrehen, wenn der letzte Schnipsel zurückläuft
    const soll = richtung.clone(), jetzt = performance.now(); soll.y = -0.14; soll.normalize(); void zielH; void passt;   // immer nach vorn (5.11., Tassilo: „wenn der Pfeil dich nach vorne bewegt, schaust du nach vorne“)
    blick.lerp(soll, 1 - Math.exp(-Math.min(0.1, (jetzt - (t.tz || jetzt)) / 1000) * 3)).normalize(); t.tz = jetzt;
    camera.position.set(p.x, hoehe(e) + hA + (hB - hA) * e, p.z); controls.target.copy(camera.position).addScaledVector(blick, 0.01); camera.lookAt(controls.target);
    if (u >= 1) { fahrt = null; t.laeuft = false; t.i = j; t.tz = 0; tourBlick(camera.position.toArray(), blick); tourPfeile(); }
  };
}
function pfeileWeg() { const t = tour; if (!t) return; for (const c of [...t.marken.children]) { if (!c.userData.richtung) continue; t.marken.remove(c); c.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); } }
const PFEIL_FORM = (() => { const f = new THREE.Shape(); f.moveTo(0, 0.3); f.lineTo(0.3, 0.02); f.lineTo(0.3, -0.13); f.lineTo(0, 0.15); f.lineTo(-0.3, -0.13); f.lineTo(-0.3, 0.02); f.closePath(); return f; })();
function pfeil() {   // flacher Winkelpfeil wie bei Street View: weiß mit weichem dunklem Rand, immer sichtbar, zeigt in lokal +z
  const g = new THREE.Group(), geo = new THREE.ShapeGeometry(PFEIL_FORM); geo.rotateX(Math.PI / 2);
  const schatten = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthTest: false, side: THREE.DoubleSide })); schatten.scale.setScalar(1.18); schatten.position.set(0, -0.002, -0.02); schatten.renderOrder = 10;
  const weiss = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.94, depthTest: false, side: THREE.DoubleSide })); weiss.renderOrder = 11;
  const neig = new THREE.Group(); neig.rotation.x = -0.75; neig.add(schatten, weiss); g.add(neig); return g;   // Spitze 43° angehoben, zum Betrachter geneigt
}
function pfadPunkt(p, weit) { let rest = weit; for (let n = 1; n < p.length; n++) { const a = p[n - 1], b = p[n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l >= rest) return [a[0] + (b[0] - a[0]) * rest / l, a[1] + (b[1] - a[1]) * rest / l]; rest -= l; } return p.at(-1); }
function pfeilAuswahl(i, c) {   // Pfeile am Halt i von der Stelle c: einer je Richtung (5.11., Ziele aus tools/stadt_rundgang_pfeile.mjs, alle Halte bleiben erreichbar)
  const t = tour, kand = [], RW = t.m.rundgangWege;
  for (const k of RW?.pfeile?.[i] || RW?.nachbarn?.[i] || []) {
    const p = tourPfad(i, k) || [[c.x, c.z], [t.m.rundgang[k].pos[0], t.m.rundgang[k].pos[2]]]; let L = 0; for (let n = 1; n < p.length; n++) L += Math.hypot(p[n][0] - p[n - 1][0], p[n][1] - p[n - 1][1]);
    const q1 = pfadPunkt(p, 1.2), q = pfadPunkt(p, Math.max(Math.min(1.2, L), Math.min(2.2, L - 0.4))), d = new THREE.Vector2(q1[0] - c.x, q1[1] - c.z), r = new THREE.Vector2(q[0] - c.x, q[1] - c.z);
    if (d.lengthSq() > 1e-4 && r.lengthSq() > 1e-4) kand.push({ k, d: d.normalize(), q, r: r.normalize(), L });
  }
  const gesetzt = [];
  for (const e of kand.sort((a, b) => a.L - b.L)) {
    const vor = gesetzt.filter(g => g.d.dot(e.d) > Math.cos(20 * Math.PI / 180)).length;   // jeder Nachbar bekommt einen Pfeil (4.11.: das Auslassen schnitt Räume ab)
    if (vor) { const p = tourPfad(i, e.k), w = Math.min(2.2 + 0.9 * vor, e.L - 0.3); if (p && w > 1.2) e.q = pfadPunkt(p, w); const s = new THREE.Vector2(-e.d.y, e.d.x).multiplyScalar(0.3 * vor); e.q = [e.q[0] + s.x, e.q[1] + s.y]; }   // gleiche Richtung: weiter vorn, leicht versetzt
    gesetzt.push(e);
  }
  return gesetzt;
}
function tourPfeile() {   // Pfeile auf dem Weg, bis 2,2 m voraus, auf 70 cm Höhe
  const t = tour; if (!t) return; pfeileWeg(); const c = camera.position, boden = bodenHoehe(c.x, c.z, c.y - 1.6) + 0.03;
  for (const { k, d, q, r } of pfeilAuswahl(t.i, c)) {
    const g = pfeil(); g.scale.setScalar(1.1); g.userData.grund = 1.1; g.position.set(q[0], bodenHoehe(q[0], q[1], boden - 0.03) + 0.7, q[1]); g.rotation.y = Math.atan2(r.x, r.y); g.traverse(o => { o.userData.halt = k; }); g.userData.richtung = d; t.marken.add(g);   // auf 70 cm (4.11., Tassilo: am Boden sah man sie nicht, auf 1 m zu hoch)
  }
}
function tourEnde() {
  const t = tour; if (!t) return; pfeileWeg(); t.m.wurzel.remove(t.marken); t.schild?.remove(); tour = null; rundgangLauf = null; fahrt = null; canvas.style.opacity = '1';
  controls.enabled = true; controls.enablePan = true; controls.enableZoom = true; controls.rotateSpeed = 1; controls.minDistance = t.m.nahst; controls.maxPolarAngle = Math.PI / 2 - 0.02; blick(t.m.start); melde('');
}
function tourRichtungGehen(d, grenze) {   // zum Pfeil, der am besten in Richtung d (Grundriss) zeigt, wenn der Winkel unter grenze (Grad) bleibt
  const t = tour; if (!t || t.laeuft) return false; let best = null, bw = Math.cos(grenze * Math.PI / 180);
  for (const g of t.marken.children) { if (!g.userData.richtung) continue; const w = g.userData.richtung.dot(d); if (w > bw) { bw = w; best = g; } }
  if (best) tourGehe(best.userData.halt); return !!best;
}
function tourStrahl(e) { const r = canvas.getBoundingClientRect(), ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), camera); return ray; }
const tourPfeilListe = () => tour.marken.children.filter(g => g.userData.richtung);
// Tipp auf einen Pfeil: dorthin gehen; Tipp auf den Boden: in diese Richtung (nur ein Tipp, kein Ziehen); Maus über dem Boden zeigt einen Ring wie Street View
{ let ab = null, ring = null, anstehend = false;
  canvas.addEventListener('pointerdown', e => { ab = [e.clientX, e.clientY]; if (aktiv) aktiv.angetippt = true; });   // wer selbst steuert, bekommt keinen Auto-Rundgang
  canvas.addEventListener('pointerup', e => {
    if (!tour || tour.laeuft || !ab || Math.hypot(e.clientX - ab[0], e.clientY - ab[1]) > 6) return; const ray = tourStrahl(e);
    const h = ray.intersectObjects(tourPfeilListe(), true)[0]; if (h && h.object.userData.halt != null) { tourGehe(h.object.userData.halt); return; }
    if (tuerTipp(ray)) return;
    const b = tour.m.gruppen.architektur && ray.intersectObject(tour.m.gruppen.architektur, true)[0]; if (!b) return;
    const d = new THREE.Vector2(b.point.x - camera.position.x, b.point.z - camera.position.z); if (d.lengthSq() > 0.01) tourRichtungGehen(d.normalize(), 50);
  });
  canvas.addEventListener('pointermove', e => {
    if (!tour || e.buttons || e.pointerType !== 'mouse' || anstehend) return; anstehend = true;
    requestAnimationFrame(() => { anstehend = false; if (!tour || tour.laeuft) { if (ring) ring.visible = false; return; } const ray = tourStrahl(e), L = tourPfeilListe();
      for (const g of L) g.scale.setScalar(g.userData.grund || 1);
      const h = ray.intersectObjects(L, true)[0]; canvas.style.cursor = h ? 'pointer' : '';
      if (h) { let g = h.object; while (g.parent !== tour.marken) g = g.parent; g.scale.setScalar((g.userData.grund || 1) * 1.15); tourSchild(null, tour.m.rundgang[g.userData.halt]); if (ring) ring.visible = false; return; }
      tourSchild(tour.m.rundgang[tour.i]); if (tuerTipp(ray, true)) { canvas.style.cursor = 'pointer'; if (ring) ring.visible = false; return; }
      const b = tour.m.gruppen.architektur && ray.intersectObject(tour.m.gruppen.architektur, true)[0];
      if (!ring) { ring = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.22, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthTest: false })); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 9; }
      if (ring.parent !== tour.marken) tour.marken.add(ring);
      const boden = b && b.face && b.face.normal.clone().transformDirection(b.object.matrixWorld).y > 0.8; ring.visible = !!boden; if (boden) ring.position.copy(b.point).add(new THREE.Vector3(0, 0.02, 0));
    });
  });
  canvas.addEventListener('pointerup', e => { if (tour || !ab || Math.hypot(e.clientX - ab[0], e.clientY - ab[1]) > 6) return; tuerTipp(tourStrahl(e)); });   // auch außerhalb des Rundgangs
  canvas.addEventListener('wheel', e => { if (!tour) return; e.preventDefault(); tour.fov = Math.min(80, Math.max(30, tour.fov * Math.exp(e.deltaY * 0.0012))); camera.fov = tour.fov; camera.updateProjectionMatrix(); }, { passive: false });
  addEventListener('keydown', e => {
    if (!tour || tour.laeuft || /input|textarea|select/i.test(document.activeElement?.tagName || '')) return; const r = canvas.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const v = camera.getWorldDirection(new THREE.Vector3()), d = new THREE.Vector2(v.x, v.z).normalize();
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); tourRichtungGehen(e.key === 'ArrowUp' ? d : d.negate(), 75); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); const w = (e.key === 'ArrowLeft' ? 1 : -1) * 0.35, x = v.x * Math.cos(w) + v.z * Math.sin(w), z = -v.x * Math.sin(w) + v.z * Math.cos(w); controls.target.copy(camera.position).add(new THREE.Vector3(x, v.y, z).normalize().multiplyScalar(0.01)); controls.update(); }
  });
}
function rundgang(m) {
  return tourStarten(m);
}
function rundgangAlt(m) {
  const S = m.rundgang; if (!S?.length) return false;
  if (m.schnitt) schnitt('kein'); if (axo) projektion('persp');
  const T = sagtFuer(m), N = st => typeof st.name === 'object' ? st.name[sprache()] || st.name.es : st.name; let i = 0; rundgangLauf = m;   // Namen je Sprache (4.11.)
  const weiter = () => { if (rundgangLauf !== m || i >= S.length) { if (rundgangLauf === m) { rundgangLauf = null; melde(T.rundgangEnde || ''); } return; } const st = S[i++]; melde(T.rundgangSchritt ? T.rundgangSchritt.replace('{n}', N(st)) : N(st)); const nach = () => setTimeout(weiter, (st.pause || 1.6) * 1000), p0 = camera.position.toArray(), weg = Math.hypot(...st.pos.map((v, j) => v - p0[j]));
    if (strahl(p0, st.pos) < weg) blenden(st.pos, st.ziel, nach); else fahren(st.pos, st.ziel, st.dauer || 3.5, nach); };
  fahren(S[0].pos, S[0].ziel, 2.5, () => { i = 1; melde(N(S[0])); setTimeout(weiter, 1200); });
  return true;
}
// Umgebungsverschattung (4.11., Tassilo: „in Rhino schöner“, weiche Schatten in Ecken und unter Möbeln): GTAO nur am Rechner, nah, ohne Schnitt
// (die Verschattung kennt die Schnittebenen nicht) und in Perspektive; sonst direkt
let NACH = null;
function zeichnen() {
  const m = aktiv, A = m?.bild?.ao;
  if (!A || SCHWACH || m.ebenen?.length || !camera.isPerspectiveCamera || !m.hausInnen) { renderer.render(scene, camera); return; }
  if (!NACH) { const c = new EffectComposer(renderer), rp = new RenderPass(scene, camera), g = new GTAOPass(scene, camera, canvas.clientWidth, canvas.clientHeight);
    g.updateGtaoMaterial({ radius: A.radius ?? 0.5, distanceExponent: A.exponent ?? 1.5, thickness: A.dicke ?? 1, scale: A.staerke ?? 1, samples: 16 }); g.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 }); g.blendIntensity = A.mischung ?? 1;
    g.overrideVisibility = function () { GTAOPass.prototype.overrideVisibility.call(this); this.scene.traverse(o => { if (o.userData.ohneAO) o.visible = false; }); };   // Glas nicht verschatten (sonst schwarze Scheiben)
    c.addPass(rp); c.addPass(g); c.addPass(new OutputPass()); c.setPixelRatio(renderer.getPixelRatio()); c.setSize(canvas.clientWidth, canvas.clientHeight); NACH = { c, rp, g }; }
  NACH.rp.camera = camera; NACH.g.camera = camera; NACH.c.render();
}
// Nahebene mit dem Abstand (4.11., Tassilo: „die Karte flimmert in der Ferne, auch unser Gebäude“): 5 cm bis 14 km mit fester Nahebene lässt der
// Tiefenpuffer aus der Ferne Flächen springen; nah an der Wohnung 5 cm, weit draußen bis 20 m
function nahebene() { const m = aktiv; if (!camera?.isPerspectiveCamera || !controls) return; const z = Math.min(20, Math.max(m.nah ?? 0.05, camera.position.distanceTo(controls.target) * 0.01));
  if (Math.abs(z - camera.near) > camera.near * 0.15) { camera.near = z; camera.updateProjectionMatrix(); } }
function schleife() { requestAnimationFrame(schleife); if (!sichtbar || !aktiv) return; if (fahrt) fahrt(); else controls?.update(); hausWahl(); nahebene(); tuerenBewegen(); punkteSeite(); pulseBewegen(); kachelnNeu(); const r = canvas.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) zeichnen(); }   // außerhalb des Bildes nur laden, nicht zeichnen
function faltLage(o) {   // Laden k bei Faltwinkel θ = t·90° (t = 1 wie in Rhino gefaltet): Gelenkkette mit den Breiten aller Läden davor, Drehung abwechselnd; c führt zu genau auf die Rhino-Lage
  const f = o.userData.falt, th = f.t * Math.PI / 2, k = f.k, n = new THREE.Vector3(f.a.z, 0, -f.a.x).multiplyScalar(f.sg), phi = t => (k % 2 ? -f.sg : f.sg) * t;
  const W = f.vor || (f.vor = o.parent.children.filter(c => c.userData.falt && c.userData.falt.k < k).sort((p, q) => p.userData.falt.k - q.userData.falt.k).map(c => c.userData.falt.w));
  o.position.copy(f.basis); W.forEach((w, j) => { const s = j % 2 ? -1 : 1; o.position.addScaledVector(f.a, w * Math.cos(th)).addScaledVector(n, s * w * (Math.sin(th) - 1)); });
  o.rotation.y = phi(th) - phi(Math.PI / 2); o.position.addScaledVector(f.c, 1 - f.t);
}
let TUER_T = 0;
function tuerenBewegen() { const jetzt = performance.now(), f = 1 - Math.exp(-Math.min(0.2, (jetzt - (TUER_T || jetzt)) / 1000) * 7.5); TUER_T = jetzt;   // zeitbasiert (5.11.: bei wenigen Bildern je Sekunde gingen Türen im Rundgang kaum auf)
  for (const k of ['tueren', 'schraenke', 'fenster']) aktiv?.gruppen[k]?.traverse(o => { const Fa = o.userData.falt; if (Fa) { if (Math.abs(Fa.t - o.userData.ziel) > 0.002) { Fa.t += (o.userData.ziel - Fa.t) * f * 0.7; faltLage(o); } return; } const S = o.userData.schub; if (S) { if (Math.abs(S.t - o.userData.ziel) > 0.002) { S.t = o.userData.t = S.t + (o.userData.ziel - S.t) * f * 0.85; o.position.copy(S.basis).addScaledVector(S.d, S.t); } return; } const a = o.userData.angel; if (!a) return; const z = o.userData.ziel ?? 0, r = a.achse || 'y'; if (Math.abs(z - o.rotation[r]) > 0.001) o.rotation[r] += (z - o.rotation[r]) * f; }); }
// Estate (3.11., Tassilo: Dach bleibt, erst im Schnitt zeigen, was aufgeschnitten ist; unsere echten Fenster statt der Google-Fenster; weiter draußen
// unschärfer wie Google): weit weg (über m.haus.nah Meter) nur die Fotostadt mit dem Google-Haus (Knoten „eigenhaus“ der Kacheln, m.haus.ganz);
// nah, in der Wohnung (m.haus.innen: Kasten) oder im Schnitt: Haus ohne Wohnungsgeschoss (m.haus.schnitt) und unsere Wohnung mit Fenstern
function hausWahl() { const m = aktiv, h = m?.haus; if (!h) return; if (!h.geladen) { h.geladen = true; for (const k of h.wohnung) lade(k); }   // Wohnung schon beim Anflug laden, unsichtbar
  const b = h.innen, p = camera.position, kasten = p.x > b[0] && p.x < b[3] && p.y > b[1] && p.y < b[4] && p.z > b[2] && p.z < b[5]; const innen = !!m.schnitt || (!!h.nah && p.length() < h.nah) || kasten;
  if (!tour && camera.isPerspectiveCamera && h.fovInnen && camera.fov !== (kasten ? h.fovInnen : FOV)) { camera.fov = kasten ? h.fovInnen : FOV; camera.updateProjectionMatrix(); }   // in der Wohnung weiter Bildwinkel (4.11.: 38° wirkt in Räumen eng)
  if (innen === m.hausInnen && m.schnitt === m.hausSchnitt && kasten === m.hausKasten) return; m.hausInnen = innen; m.hausSchnitt = m.schnitt; m.hausKasten = kasten;
  for (const k of Object.keys(m.dateien)) zeige(k); for (const o of m.eigenhaus || []) o.visible = !innen;
  // von außen ohne Schnitt: Deckenplatte der Wohnung aus (h.dach = Höhe unter der Platte), darüber liegt das Google-Dach; von innen bleibt die Decke
  const dach = !m.schnitt && !kasten && h.dach ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), h.dach)] : null;
  if (!m.schnitt) for (const k of h.wohnung) m.gruppen[k]?.traverse(o => { if (o.isMesh && o.material) for (const mat of [].concat(o.material)) mat.clippingPlanes = dach; });
}
// Schnitt nur für die Gruppen außerhalb m.ungeschnitten (Estate: die Fotostadt bleibt ganz), darum Ebenen je Material statt am Renderer
function clipSetzen(m) { for (const [k, g] of Object.entries(m.gruppen)) { const frei = m.ungeschnitten?.includes(k) || m.ungeschnittenBei?.[m.schnitt]?.includes(k); /* Estate: bei „ohne Decke“ bleibt das Google-Haus ganz */ g.traverse(o => { if (o.isMesh && o.material) for (const mat of [].concat(o.material)) mat.clippingPlanes = frei || !m.ebenen?.length ? null : m.ebenen; }); } }
function groesse() {
  const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); NACH?.c.setSize(w, h);
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
  const Bd = m.bild || {}; renderer.toneMapping = Bd.ton ? THREE.NeutralToneMapping : THREE.NoToneMapping; renderer.toneMappingExposure = Bd.belichtung ?? 1;
  if (Bd.schatten && !SCHWACH) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; const S = LICHT.sonne; S.castShadow = true; S.position.set(...(Bd.sonne || [300, 500, 200])).normalize().multiplyScalar(80); S.target.position.set(0, 0, 0); scene.add(S.target);
    const c = S.shadow.camera, r = Bd.schatten; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 200; c.updateProjectionMatrix(); S.shadow.mapSize.set(2048, 2048); S.shadow.bias = -0.0004; S.shadow.normalBias = 0.03; S.shadow.radius = 4; }
  KAPPE.color.set(m.schnittFarbe ?? 0x3a3634); SCHNITT.color.set(m.schnittFarbe ?? 0x1c1c1c);   // Schnittflächen: dunkel wie im Plan, Estate weiß (4.11., Tassilo: keine dunklen Flecke)
  for (const b of wrap.querySelectorAll('.m-reiter button')) b.classList.toggle('on', b.dataset.modell === name);
  for (const l of leisten()) l.hidden = l.dataset.leiste !== name;
  if (m.anflug && !m.angeflogen) {   // Anflug (Estate): erst der Blick aus der Stadt, nach dem Laden die Fahrt zum Startblick
    m.angeflogen = true; kamera(m.anflug.pos, m.anflug.ziel); 
    // 5.11. (Tassilo: „die Karte erst reinzoomen, wenn der Benutzer an dieser Stelle angelangt“): sobald die Bühne zu einem Drittel im Bild ist
    const imBild = () => { const r = canvas.getBoundingClientRect(), s = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0); return s >= 0.35 * Math.min(r.height, innerHeight); };
    const warte = f => { if (aktiv !== m) return; if (!imBild()) { setTimeout(() => warte(f), 250); return; } f(); };   // 5.11. (Tassilo: „diese Pause darf es nicht geben, sonst scrollen die Leute weiter“): sofort los
    m.anflugImBild = imBild; warte(() => { if (aktiv === m && !fahrt) { const b = m.blicke[m.start]; fahren(b.pos, b.ziel, m.anflug.dauer || 6, () => { const frei = () => aktiv === m && !tour && !fahrt && !m.angetippt;
      // 4.11. (Tassilo): stehen bleiben mit Dach, dann Dach in einem Schritt weg, dann ohne Abblenden hinein in den Rundgang
      if (m.rundgangNachAnflug == null) { if (m.schnittStart && !m.schnitt) schnitt(m.schnittStart); return; }
      setTimeout(() => { if (!frei()) return; if (m.schnittStart) schnitt(m.schnittStart); setTimeout(() => { if (frei() && m.schnitt === m.schnittStart) tourStarten(m, true); }, 450); }, m.rundgangNachAnflug); }); } });
    schnitt('kein');
  } else { blick(m.start); schnitt(m.schnitt || m.schnittStart || 'kein'); }   // schnittStart: Modell beginnt geschnitten (Estate: wie der Plan)
  for (const k of Object.keys(m.dateien)) zeige(k);
  if (m.baeume) ladeBaeume(m);
  if (m.bau && !m.teile) { let g = null; try { g = JSON.parse(localStorage.getItem('amphion.bau') || 'null'); } catch { /* ohne Speicher */ } setzeBau(Array.isArray(g) && g.length ? g : BAU_START, false); }
}
// Sichtbar ist eine Gruppe, wenn ihr Schalter an ist; Gruppen des Zustands folgen dem Zustand
function sollSichtbar(k) { const m = aktiv;
  if (k === 'decke' && m.schnitt && m.schnitte[m.schnitt] === 'decke') return false;   // „Sin techo“ (4.11., Tassilo: nicht schneiden, nur die Decke abheben)
  if (k === 'barrio') return !!m.barrioAn;   // El barrio: abstrakte Stadt statt Fotostadt und Wohnung
  if (m.barrioAn && (k === 'stadt' || k === 'kacheln' || k === m.haus?.schnitt || k === m.haus?.offen || m.haus?.wohnung.includes(k) || m.haus?.nachbarn?.includes(k))) return false; if (m.zustaende) { const z = m.zustaende[m.zustand]; if (k in z && !z[k]) return false; }
  const h = m.haus; if (h && (k === h.ganz || k === h.schnitt || k === h.offen)) { const w = !m.hausInnen ? h.ganz : h.offen && m.schnitt === 'planta' ? h.offen : h.schnitt; return m.sichtbar.stadt !== false && k === w; }   // folgt dem Schalter Stadt; h.offen: ohne Decke von oben
  if (h && h.wohnung.includes(k) && !m.hausInnen && m.sichtbar.stadt !== false && m.sichtbar[k] !== false) return false;
  if (h?.nachbarn?.includes(k)) return !!m.hausInnen && m.sichtbar[k] !== false; /* Nachbarkörper, Lichthofschächte, Geschossplatte: nah immer (4.11.: durch die Hoffenster sonst Google-Reste); der Nachbarkörper bleibt ohne Schnitt unter dem Google-Dach */ return m.sichtbar[k === 'kacheln' || k === 'fern' ? 'stadt' : k] !== false; }
function zustand(z) { const m = aktiv; if (!m.zustaende?.[z]) return; m.zustand = z; for (const k of Object.keys(m.dateien)) zeige(k); }
function zeige(k) { const m = aktiv, soll = sollSichtbar(k); if (m.gruppen[k]) m.gruppen[k].visible = soll; else if (soll) lade(k); if (m.baumNetz && m.baeume?.gruppe === k) m.baumNetz.visible = soll; }

// 3D-Tiles (Estate 3.11., Tassilo: „wie Google, weiter draußen unschärfer“): eigenes tileset.json (tools/stadt_google_tiles.py, Z oben), je nach Abstand
// lädt der TilesRenderer die passende Stufe und gibt ferne frei; alle Kacheldateien tragen den Stempel des tileset.json
async function ladeTiles(m, k, g) {
  const { TilesRenderer } = await import('3d-tiles-renderer/three');
  const url = new URL(mitVersion(m.basis + m.dateien[k]), location.href), v = url.searchParams.get('v');
  const t = new TilesRenderer(url.href), gl = new GLTFLoader(t.manager); gl.setDRACOLoader(draco); t.manager.addHandler(/\.(gltf|glb)(\?.*)?$/, gl);
  t.errorTarget = m.kachelFehler ?? 12; t.loadSiblings = false;   // 5.11. (Tassilo: „die Google-Stadt lädt extrem langsam“): keine Geschwisterkacheln auf Vorrat
  if (v) t.preprocessURL = u => { const x = new URL(u, location.href); if (!x.searchParams.has('v')) x.searchParams.set('v', v); return x.href; };
  t.group.rotation.x = -Math.PI / 2; m.eigenhaus ||= new Set();
  t.addEventListener('load-model', ({ scene: s }) => s.traverse(o => {
    if (!o.isMesh) return; const alt = o.material; o.material = new THREE.MeshBasicMaterial({ map: alt.map, side: THREE.DoubleSide, toneMapped: false }); alt.dispose(); o.frustumCulled = false; o.userData.ohneAO = true;   // Licht steckt im Foto
    if (/^eigenhaus/.test(o.name) || /^eigenhaus/.test(o.parent?.name || '')) { m.eigenhaus.add(o); o.visible = !m.hausInnen; }   // Blender zählt weitere Teile hoch (eigenhaus.001, 4.11.)
  }));
  t.addEventListener('dispose-model', ({ scene: s }) => s.traverse(o => m.eigenhaus.delete(o)));
  g.add(t.group); if (m.versatz?.[k]) g.position.set(...m.versatz[k]); m.tiles = t; melde('');
}
// Kachelfeinheit nach Lage (5.11.: 53 MB in 15 s): im Flug grob (die Kacheln sind beim Ankommen veraltet), in der Wohnung mittel (Stadt nur durchs Fenster),
// sonst wie eingestellt; Handy gröber
function kachelnNeu() { const t = aktiv?.tiles; if (!t || !t.group.parent?.visible) return; const f0 = (aktiv.kachelFehler ?? 12) * (SCHWACH ? 1.5 : 1); t.errorTarget = fahrt && !tour ? f0 * 4 : aktiv.hausKasten || tour ? f0 * 2 : f0; if (t.kamera !== camera) { if (t.kamera) t.deleteCamera(t.kamera); t.setCamera(camera); t.kamera = camera; } t.setResolutionFromRenderer(camera, renderer); camera.updateMatrixWorld(); t.update(); }

// Bildwirkung wie in Rhino (4.11., Tassilo: „Schatten, Farben abgetönter“): m.bild = { umgebung, rauh, schatten }: PBR-Material mit Umgebungslicht
// (RoomEnvironment), Normalen mit Knickwinkel (runde Möbel glatt, Kanten scharf), Sonnenschatten; ohne m.bild wie bisher Lambert flach
function matWohnung(m, o, map) {
  const B = m.bild; if (!B) return new THREE.MeshLambertMaterial({ map, vertexColors: true, flatShading: true, side: THREE.DoubleSide });
  const mitN = !!o.geometry.attributes.normal, glatt = mitN || (!SCHWACH && o.geometry.attributes.position.count < 600000);   // Normalen aus dem GLB (web_wohnung_glb.mjs), sonst hier berechnet
  if (glatt && !mitN) { const g = toCreasedNormals(o.geometry, (B.knick ?? 35) * Math.PI / 180); o.geometry.dispose(); o.geometry = g; }
  if (B.schatten && !SCHWACH) { o.castShadow = true; o.receiveShadow = true; }
  if (B.matt) return new THREE.MeshLambertMaterial({ map, vertexColors: true, flatShading: !glatt, side: THREE.DoubleSide });   // matt wie der Rhino-Viewport (4.11.: Texturen in voller Farbe)
  return new THREE.MeshStandardMaterial({ map, vertexColors: true, flatShading: !glatt, roughness: B.rauh ?? 0.85, metalness: 0, envMap: UMGEBUNG, envMapIntensity: B.umgebung ?? 0.6, side: THREE.DoubleSide, clipShadows: true, shadowSide: THREE.DoubleSide });
}
async function lade(k) {
  const m = aktiv; if (m.gruppen[k]) return;
  const g = m.gruppen[k] = new THREE.Group(); g.visible = true; m.wurzel.add(g);
  melde('…');
  if (/tileset\.json$/.test(m.dateien[k])) { try { await ladeTiles(m, k, g); } catch (e) { melde(fehler?.textContent || 'Fehler'); console.error(e); } return; }
  try {
    const d = await loader.loadAsync(mitVersion(m.basis + ((SCHWACH && m.dateienLeicht?.[k]) || m.dateien[k])));   // Handy: leichte Fassung (4.11.: Pflanzen ausgedünnt)
    const netze = []; d.scene.traverse(o => { if (o.isMesh) netze.push(o); });   // erst sammeln: die Schnittflächen kommen als Kinder dazu
    for (const o of netze) {
      if (o.material.map && !o.material.name.startsWith('tex:')) { o.material = new THREE.MeshBasicMaterial({ map: o.material.map, side: THREE.DoubleSide, toneMapped: false }); o.frustumCulled = false; o.userData.ohneAO = true; continue; }   // Fotostadt: Licht steckt im Foto, keine Verschattung (4.11.: Stadt sonst dunkel)   // Fotokacheln: das Licht steckt im Foto
      if (o.material.map) {   // texturierte Teile (Estate, Rhino-Materialien): beleuchtet, Bild wiederholt sich, geschlossene Körper bekommen Kappen
        const solid = !!o.material.userData?.solid; o.material.map.wrapS = o.material.map.wrapT = THREE.RepeatWrapping; o.material.map.colorSpace = THREE.SRGBColorSpace; o.material.map.anisotropy = 4;
        o.material = matWohnung(m, o, o.material.map); o.frustumCulled = false;   // flatShading: ohne Normalen im GLB sonst schwarz
        const kappenGruppe_ = m.kappen ? m.kappen.includes(k) : KAPPEN_GRUPPEN.has(k);
        if (solid && kappenGruppe_) { const s = kappenGruppe(o.geometry); s.visible = !!m.schnitt; o.add(s); m.schnittflaechen.push(s); }
        if (kappenGruppe_) { const s = new THREE.Mesh(o.geometry, SCHNITT); s.frustumCulled = false; s.visible = !!m.schnitt; o.add(s); m.schnittflaechen.push(s); (m.schnittMats ||= []).push(o.material); if (m.schnitt) { o.material.side = THREE.FrontSide; o.material.needsUpdate = true; } }
        continue;
      }
      const glas = o.material.name === 'glas', solid = o.material.name === 'solid';   // solid: geschlossene Körper (tools/web_3dm_glb.mjs), nur sie bekommen Kappen
      o.material = glas
        ? new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.15, roughness: 0.04, envMap: UMGEBUNG, envMapIntensity: m.glas?.spiegel ?? 1.35, transparent: true, opacity: m.glas?.deckung ?? 0.58, side: THREE.DoubleSide, depthWrite: false })   // spiegelt, leicht getönt; m.glas (Estate): klarer, damit man die Stadt sieht
        : matWohnung(m, o, null);
      o.frustumCulled = false; if (glas) o.userData.ohneAO = true;
      const kappenGruppe_ = m.kappen ? m.kappen.includes(k) : KAPPEN_GRUPPEN.has(k);
      if (solid && kappenGruppe_) { const s = kappenGruppe(o.geometry); s.visible = !!m.schnitt; o.add(s); m.schnittflaechen.push(s); }
      // offene Körper (Wände ohne Deckel, Böden als Fläche) in denselben Gruppen: im Schnitt nur Vorderseiten, Rückseiten dunkel, so wirkt
      // auch ein offener Wandkasten massiv; ohne Schnitt wieder beidseitig, damit nichts durchsichtig wird
      if (!glas && !kappenGruppe_ && !m.ohneSchnittflaechen?.includes(k)) { const s = new THREE.Mesh(o.geometry, SCHNITT); s.frustumCulled = false; s.visible = !!m.schnitt; o.add(s); m.schnittflaechen.push(s); }   // wie bisher (Hochhaus: rote Tragwerksflächen in der Strukturansicht)
      if (!glas && kappenGruppe_) { const s = new THREE.Mesh(o.geometry, SCHNITT); s.frustumCulled = false; s.visible = !!m.schnitt; o.add(s); m.schnittflaechen.push(s); (m.schnittMats ||= []).push(o.material); if (m.schnitt) { o.material.side = THREE.FrontSide; o.material.needsUpdate = true; } }
    }
    d.scene.traverse(o => { if (o.parent?.userData.angel || o.parent?.userData.schub || o.parent?.userData.falt) return;   // 5.11.: Teilnetze eines Flügels mit mehreren Materialien tragen denselben Namen; sonst drehten sie doppelt (Tür 180°)
      const fa = /^falt\|(\d+)\|(-?1)\|(\d+)\|(\d+)\|(-?\d+)\|(-?\d+)\|(-?\d+)\|(-?\d+)/.exec(o.name); if (fa) { const a = new THREE.Vector3(+fa[5], 0, +fa[6]).normalize(); o.userData.falt = { k: +fa[1], sg: +fa[2], w: fa[3] / 1000, a, c: new THREE.Vector3(fa[7] / 1000, 0, fa[8] / 1000), basis: o.position.clone(), t: 1 }; o.scale.x = fa[4] / 1000;   /* Breite nach den Fugen der Blenden */ o.userData.ziel = 1;
        o.traverse(c => { if (!c.isMesh || !c.material?.color) return; const f = c.material.color; if (f.r + f.g + f.b > 2.4 && !c.material.map) c.userData.faltWeiss = true; });   // weiße Lackseite (Prüfregel: zu nur zur Küche)
        return; }   // Faltladen: wie gezeichnet gefaltet (Küche offen)
      const kl = /^klappe\|([xz])\|(-?\d+)\|(\d+)/.exec(o.name); if (kl) { const h = kl[3] / 1000; o.position.y += h; if (o.isMesh) o.geometry.translate(0, -h, 0); else for (const c of o.children) c.position.y -= h; o.userData.angel = { offen: kl[2] * Math.PI / 180, zu: 0, achse: kl[1] }; o.userData.ziel = 0; return; }   // Geschirrspüler, Backofen: Drehachse an der Unterkante
      const sb = /^schiebe\|(-?\d+)\|(-?\d+)/.exec(o.name); if (sb) { o.userData.schub = { basis: o.position.clone(), d: new THREE.Vector3(sb[1] / 1000, 0, sb[2] / 1000) };   /* Millimeter: der GLTF-Lader entfernt Punkte aus Namen */ o.userData.ziel = 0; o.userData.t = 0; return; }   // Schiebetür, -flügel: zu
      const t = /^(tuer|schrank|fenster)\|(-?\d+)(?:\|(-?\d+))?(\|zu)?/.exec(o.name); if (t) { const g = Math.PI / 180; o.userData.angel = { offen: +t[2] * g, zu: +(t[3] || 0) * g }; o.userData.ziel = o.userData.angel.zu; o.rotation.y = o.userData.ziel; } });   // alles zu (5.11., Tassilo: Türen öffnen sich beim Durchgehen und schließen danach); Tipp schaltet
    if (k === 'tueren') { const T = []; d.scene.traverse(o => { if (o.userData.angel || o.userData.schub || o.userData.falt?.k === 0) T.push(o); }); for (const o of T) { const r = o.rotation.y; o.rotation.y = 0; tuerPunkte(o); o.rotation.y = r; } }   // Türpunkte im Ruhezustand des Blatts messen
    if (k === 'spiegel') spiegelBauen(m, netze);   // 4.11. (Tassilo): Türen immer offen   // Türflügel (tools/stadt_tueren.mjs): Drehpunkt = Angel
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
  // schnitte: { name: [nx, ny, nz, d] } schneidet, { name: 'decke' } blendet nur die Gruppe „decke“ aus (Wände, Türen, Möbel bleiben ganz)
  const ebene = Array.isArray(s) ? new THREE.Plane(new THREE.Vector3(s[0], s[1], s[2]), s[3]) : null;
  m.ebenen = ebene ? [ebene] : []; renderer.clippingPlanes = []; renderer.localClippingEnabled = true; clipSetzen(m);
  for (const mm of Object.values(MODELLE)) for (const f of mm.schnittflaechen || []) f.visible = !!ebene;
  for (const mat of m.schnittMats || []) { mat.side = ebene ? THREE.FrontSide : THREE.DoubleSide; mat.needsUpdate = true; }
  for (const k of Object.keys(m.dateien)) zeige(k);
  // Kappenebene: groß genug für das ganze Modell, liegt genau in der Schnittebene, schaut zur sichtbaren Seite; löscht danach den Stencil
  if (!m.kappe) { m.kappe = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), KAPPE); m.kappe.renderOrder = 2; m.kappe.frustumCulled = false; m.kappe.onAfterRender = rd => rd.clearStencil(); m.wurzel.add(m.kappe); }
  m.kappe.visible = !!ebene && kappenAn;
  if (ebene) { m.kappe.position.copy(ebene.normal).multiplyScalar(-ebene.constant); m.kappe.lookAt(m.kappe.position.clone().add(ebene.normal)); }
  strukturAnsicht(!!ebene);
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
  if (a.barrio) { if (tour) tourEnde(); barrio(true); return ''; }
  if (m.barrioAn && (a.alles || a.blick || a.schnitt || a.rundgang)) barrio(false);
  if (a.rundgang) return rundgang(m) ? (T.rundgangStart || '') : T.unklar;
  if (tour && (a.alles || a.blick || a.schnitt || a.kamera)) tourEnde();
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
  return { modell: m.name, sichtbar, zustand: m.zustand || null, schnitt: m.schnitt || 'kein', struktur: (() => { let d = null; m.gruppen.gebaeude?.traverse(o => { if (d === null && o.isMesh && o.material !== SCHNITT && !o.material.userData.glas) d = o.material.opacity; }); return d !== null && d < 0.2; })(), abstand: camera.position.distanceTo(controls.target), hoehe: camera.position.y, ebenen: m.ebenen?.length || 0, status: status?.textContent || '', zuruecksetzen: undefined }; };
window.formaZustand.zuruecksetzen = () => { tun({ alles: true }); melde(''); };
window.formaZustand.kamera = (pos, ziel) => kamera(pos, ziel);
window.formaZustand.kameraAbstand = () => camera.position.length();
// Prüfregel Rundgang (4.11.): freier Blick von pos Richtung ziel bis zur ersten Fläche der Wohnung, in Metern (Infinity: nichts getroffen)
window.formaZustand.strahl = (pos, ziel) => strahl(pos, ziel);
// Prüfhilfe (4.11.): welches Objekt trifft ein Strahl von pos Richtung ziel (alle sichtbaren Netze, auch Fotostadt): Name, Eltern, Gruppe, Kachel
window.formaZustand.treffer = (pos, ziel) => { const o = new THREE.Vector3(...pos), r = new THREE.Raycaster(o, new THREE.Vector3(...ziel).sub(o).normalize(), 0.05, 400), z = [];
  scene.traverseVisible(x => { if (x.isMesh) z.push(x); }); const h = r.intersectObjects(z, false)[0]; if (!h) return null; const kette = []; let x = h.object; while (x) { kette.push(x.name || x.type); x = x.parent; }
  const g = Object.entries(aktiv.gruppen).find(([, gr]) => { let y = h.object; while (y) { if (y === gr) return true; y = y.parent; } return false; })?.[0];
  return { abstand: +h.distance.toFixed(2), gruppe: g, kette: kette.slice(0, 6), punkt: h.point.toArray().map(v => +v.toFixed(2)) }; };
window.formaZustand.tour = () => tour ? { halt: tour.i, marken: tourPfeilListe().length, laeuft: !!tour.laeuft, leiste: !!wrap.querySelector('.m-tour'), raum: tour.schild?.querySelector('b')?.textContent, fov: camera.fov } : null;
window.formaZustand.tuerenOffen = () => { let n = 0; aktiv.gruppen.tueren?.traverse(o => { const A = o.userData.angel; if (A && Math.abs(o.rotation.y - A.offen) < 0.05 && Math.abs(A.offen - A.zu) > 1) n++; }); return n; };
window.formaZustand.schubWege = () => { const L = []; for (const k of ['tueren', 'fenster']) aktiv.gruppen[k]?.traverse(o => { if (o.userData.schub) L.push(+o.userData.schub.d.length().toFixed(3)); }); return L; };   // Prüfregel: Schiebewege zwischen 0,3 und 3 m
// faltWeiss (Prüfregel, 5.11.): Läden zu, Strahl auf den Laden am Riegel von der Küche (−x) und vom Salon (+x): innen weißer Lack, außen Holz
window.formaZustand.faltWeiss = () => { const L = []; aktiv.gruppen.tueren?.traverse(o => { if (o.userData.falt) L.push(o); }); const t0 = L.map(o => o.userData.falt.t); L.forEach(o => { o.userData.falt.t = 0; faltLage(o); o.updateMatrixWorld(true); });
  const o = L.find(o => o.userData.falt.k === L.length - 1), c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()), seite = sx => { const r = new THREE.Raycaster(c.clone().add(new THREE.Vector3(sx * 0.6, 0.15, 0)), new THREE.Vector3(-sx, 0, 0)); r.camera = camera; const h = r.intersectObjects(L, true).find(h => h.object.isMesh && !h.object.userData.tuerPunkt); return h ? (h.object.material.map ? 'holz' : '#' + h.object.material.color.getHexString()) : null; };
  const r = { kueche: seite(-1), salon: seite(1) }; L.forEach((o, i) => { o.userData.falt.t = t0[i]; faltLage(o); }); return r; };
window.formaZustand.faltZu = () => { const L = []; aktiv.gruppen.tueren?.traverse(o => { if (o.userData.falt) L.push(o); }); const r = L.map(o => { const t0 = o.userData.falt.t; o.userData.falt.t = 0; faltLage(o); o.updateMatrixWorld(true); const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).sub(aktiv.wurzel.position); o.userData.falt.t = t0; faltLage(o); return [+c.x.toFixed(2), +c.z.toFixed(2)]; }); return r; };   // Prüfregel: zugeklappt liegen die Läden in der Öffnung
window.formaZustand.tuerPunkte = () => { let f = 0, p = 0, doppelt = 0; for (const k of ['tueren', 'schraenke', 'fenster']) aktiv.gruppen[k]?.traverse(o => { const fa = o.userData.falt; if (!o.userData.angel && !o.userData.schub && !fa) return; let q = o.parent; while (q) { if (q.userData.angel || q.userData.schub || q.userData.falt) doppelt++; q = q.parent; } if (k !== 'tueren' || (fa && fa.k)) return; f++; o.traverse(c => { if (c.userData.tuerPunkt) p++; }); }); return { fluegel: f, punkte: p, doppelt }; };   // Prüfregel: zwei Punkte je Türflügel
window.formaZustand.tuerenListe = () => { const L = []; aktiv.gruppen.tueren?.traverse(o => { if (o.userData.angel) L.push([o.name, +o.rotation.y.toFixed(2)]); }); return L; };
window.formaZustand.pfeilBild = () => tour ? tourPfeilListe().map(g => { const w = g.getWorldPosition(new THREE.Vector3()), v = w.clone().project(camera); return { halt: g.userData.halt, welt: w.toArray().map(x => +x.toFixed(2)), bild: [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(3)], sichtbar: g.visible && g.parent?.visible && g.parent.parent?.visible, kam: camera.position.toArray().map(x => +x.toFixed(2)) }; }) : null;
window.formaZustand.blickRichtung = d => { if (!tour) return; tourBlick(camera.position.toArray(), new THREE.Vector3(...d)); };
window.formaZustand.schraenke = auf => { let n = 0; aktiv.gruppen.schraenke?.traverse(o => { const A = o.userData.angel; if (!A) return; n++; if (auf != null) o.userData.ziel = auf ? A.offen : A.zu; }); return n; };
window.formaZustand.pfeileNeu = () => { try { tourPfeile(); return tourPfeilListe().length; } catch (e) { return String(e.stack).slice(0, 400); } };
window.formaZustand.tourDebug = () => tour ? { i: tour.i, nb: tour.m.rundgangWege?.nachbarn?.[tour.i], kinder: tour.marken.children.length, pos: camera.position.toArray() } : null;
window.formaZustand.alleAuf = auf => { let n = 0; for (const k of ['tueren', 'schraenke', 'fenster']) aktiv.gruppen[k]?.traverse(o => { const A = o.userData.angel, S = o.userData.schub; if (S) { o.userData.ziel = auf ? 1 : 0; n++; } else if (o.userData.falt) { o.userData.ziel = auf ? 1 : 0; n++; } else if (A) { o.userData.ziel = auf ? A.offen : A.zu; n++; } }); return n; };
// kollisionen (Prüfregel, 5.11., Tassilo: „Türen gehen in der Küche in andere Türen auf“): jedes Teilnetz eines Flügels als Quader im Rahmen des
// Flügels (3 mm kleiner, Griffe also eigene Quader), Schwenk von zu nach offen in 32 Schritten gegen jeden anderen Flügel zu und offen; meldet Paare
// mit dem freien Winkel in Grad (Klappen drehen nicht um y und fehlen)
window.formaZustand.kollisionen = async () => { const { OBB } = await import('three/addons/math/OBB.js'), L = [];
  for (const k of ['tueren', 'schraenke']) aktiv.gruppen[k]?.traverse(o => { if (o.userData.angel && !o.userData.angel.achse) L.push(o); });
  const ry0 = L.map(o => o.rotation.y), kasten = L.map(o => { o.updateMatrixWorld(true); const inv = o.matrixWorld.clone().invert(), K = []; o.traverse(m => { if (!m.isMesh || m.userData.tuerPunkt || m.material === SCHNITT) return; m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox.clone().applyMatrix4(inv.clone().multiply(m.matrixWorld)), g = b.getSize(new THREE.Vector3()).multiplyScalar(0.5).subScalar(0.003).max(new THREE.Vector3(0.001, 0.001, 0.001)); K.push([b.getCenter(new THREE.Vector3()), g]); }); return K; });
  const obb = (i, ry) => { const o = L[i]; o.rotation.y = ry; o.updateMatrixWorld(true); const M = o.matrixWorld, sk = new THREE.Vector3().setFromMatrixScale(M), R = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().extractRotation(M));   // OBB.applyMatrix4 dreht die Mitte nicht mit
    return kasten[i].map(([c, g]) => new OBB(c.clone().applyMatrix4(M), g.clone().multiply(sk), R.clone())); };
  const schnitt = (a, b) => a.some(x => b.some(y => x.intersectsOBB(y)));
  const nm = o => { const c = o.getWorldPosition(new THREE.Vector3()).sub(aktiv.wurzel.position); return o.name.split('_')[0] + ' @' + [c.x, c.z].map(x => x.toFixed(2)); };
  const zu = L.map((o, i) => obb(i, o.userData.angel.zu)), auf = L.map((o, i) => obb(i, o.userData.angel.offen)), mitte = L.map(o => o.getWorldPosition(new THREE.Vector3())), f = [];
  L.forEach((o, i) => { const A = o.userData.angel, nah = L.map((_, j) => j).filter(j => j !== i && mitte[j].distanceTo(mitte[i]) < 2.5), treffer = new Set();
    let frei = null; for (let s = 1; s <= 32; s++) { const c = obb(i, A.zu + (A.offen - A.zu) * s / 32); for (const j of nah) { if (schnitt(c, zu[j])) { treffer.add(nm(L[j]) + ' (zu)'); frei ??= s - 1; } else if (s === 32 && schnitt(c, auf[j])) treffer.add(nm(L[j]) + ' (offen)'); } }
    o.rotation.y = ry0[i]; if (treffer.size) f.push([nm(o), [...treffer], frei == null ? null : Math.round(Math.abs(A.offen - A.zu) * frei / 32 * 180 / Math.PI)]); });
  if (window.KOLL_DEBUG) { const [x1, z1, x2, z2, grad] = window.KOLL_DEBUG, such = (x, z) => L.map((o, n) => n).filter(n => { const c = L[n].getWorldPosition(new THREE.Vector3()).sub(aktiv.wurzel.position); return Math.hypot(c.x - x, c.z - z) < 0.03; }), I = such(x1, z1), J = such(x2, z2), w = aktiv.wurzel.position;
    const zeig = q => [q.center.clone().sub(w).toArray().map(v => +v.toFixed(3)), q.halfSize.toArray().map(v => +v.toFixed(3))]; const r = []; for (const i of I) { const A = L[i].userData.angel, a = obb(i, A.zu + Math.sign(A.offen - A.zu) * grad * Math.PI / 180); for (const j of J) a.forEach(x => { const t = zu[j].filter(y => x.intersectsOBB(y)); if (t.length) r.push([L[i].name, +A.zu.toFixed(2), +A.offen.toFixed(2), L[i].rotation.y.toFixed(2), zeig(x), t.map(zeig)]); }); } L.forEach((o, n) => { o.rotation.y = ry0[n]; }); return r; }
  L.forEach((o, i) => { o.rotation.y = ry0[i]; }); return f; };
window.formaZustand.teilSetzen = (x, z, t) => { let best = null, bd = 0.08; for (const k of ['tueren', 'schraenke']) aktiv.gruppen[k]?.traverse(o => { if (!o.userData.angel) return; const c = o.getWorldPosition(new THREE.Vector3()).sub(aktiv.wurzel.position), d = Math.hypot(c.x - x, c.z - z); if (d < bd) { bd = d; best = o; } }); if (best) best.userData.ziel = best.userData.angel.zu + t * (best.userData.angel.offen - best.userData.angel.zu); return best?.name; };   // für Vergleichsbilder: Flügel an der Angel (x, z) auf Anteil t öffnen
window.formaZustand.pfeilDoppelt = () => { if (!tour) return null; const S = tour.m.rundgang, f = [];   // Prüfregel: an keinem Halt zwei Pfeile unter 35° auseinander
  S.forEach((st, i) => { const P = pfeilAuswahl(i, new THREE.Vector3(...st.pos)); P.forEach((a, x) => P.slice(x + 1).forEach(b => { if (a.r.dot(b.r) > Math.cos(35 * Math.PI / 180)) f.push(S[i].name.es + ': ' + S[a.k].name.es + ' / ' + S[b.k].name.es); })); }); return f; };
window.formaZustand.pfeilGraph = () => { if (!tour) return null; const S = tour.m.rundgang, A = S.map((st, i) => pfeilAuswahl(i, new THREE.Vector3(...st.pos)).map(e => e.k));   // Prüfregel: über sichtbare Pfeile jeden Halt erreichen
  const weg = [];
  for (let a = 0; a < S.length; a++) { const ges = new Set([a]), st = [a]; while (st.length) for (const b of A[st.pop()]) if (!ges.has(b)) { ges.add(b); st.push(b); } if (ges.size < S.length) weg.push([S[a].name.es, S.filter((_, i) => !ges.has(i)).map(x => x.name.es)]); }
  return weg; };
window.formaZustand.tourPfeile = () => tour ? tourPfeilListe().map(g => g.userData.halt) : [];
window.formaZustand.tourGehe = j => tourGehe(j);
window.formaZustand.blickWeg = (i, j) => { const p = tourPfad(i, j); if (!p) return null; const n = p.length, a = p[Math.max(0, n - 4)], b = p[n - 1], d = new THREE.Vector2(b[0] - a[0], b[1] - a[1]).normalize(), v = camera.getWorldDirection(new THREE.Vector3()); return +(d.x * v.x + d.y * v.z) / Math.hypot(v.x, v.z); };   // Prüfregel: am Ziel Blick in Gehrichtung
window.formaZustand.tourTueren = () => (tour?.tuerLog || []).map(d => [d.o.name, +(d.max || 0).toFixed(2)]);
window.formaZustand.tuerenAuf = () => { let n = 0; aktiv.gruppen.tueren?.traverse(o => { const A = o.userData.angel; if (A && Math.abs(o.rotation.y - A.zu) > 0.8) n++; }); return n; };   // Prüfregel: Türen mehr als 45° offen
window.formaZustand.faehrt = () => !!(fahrt || rundgangLauf);   // Prüfregel: Anflug und Rundgang laufen   // für Prüfungen und Vergleichsbilder: Kamera exakt setzen
// El barrio (4.11., Tassilo: „Madrid abstrahiert, Häuser als Blöcke aus dem Kataster, Supermärkte, Parks, Spielplätze, Metro, Bus, Züge, Flughafen,
// und wie lange man zu Fuß braucht“): Kataster-Blöcke (barrio.glb), Gehzonen 5/10/15 min, Orte mit Symbol und Minuten, Liste mit Sätzen; Tipp auf eine
// Kategorie zeichnet den Fußweg zum nächsten Ziel. Daten: tools/stadt_barrio_daten.py (Catastro, OpenStreetMap), Wegzeiten über das Fußwegenetz.
const KAT = { metro: ['🚇', 'Metro', 'Metro', 'Metro'], cercanias: ['🚆', 'Cercanías', 'Commuter train', 'S-Bahn'], bus: ['🚌', 'Autobús', 'Bus', 'Bus'], bici: ['🚲', 'BiciMAD', 'BiciMAD', 'BiciMAD'],
  super: ['🛒', 'Supermercado', 'Supermarket', 'Supermarkt'], mercado: ['🧺', 'Mercado', 'Market', 'Markthalle'], panaderia: ['🥖', 'Panadería', 'Bakery', 'Bäckerei'], farmacia: ['💊', 'Farmacia', 'Pharmacy', 'Apotheke'],
  colegio: ['🏫', 'Colegio', 'School', 'Schule'], guarderia: ['🧸', 'Escuela infantil', 'Nursery', 'Kita'], universidad: ['🎓', 'Universidad', 'University', 'Universität'],
  salud: ['🏥', 'Hospital o clínica', 'Hospital or clinic', 'Klinik'], medico: ['🩺', 'Médico', 'Doctor', 'Arzt'], parque: ['🌳', 'Parque', 'Park', 'Park'], juegos: ['🛝', 'Parque infantil', 'Playground', 'Spielplatz'],
  perros: ['🐕', 'Zona canina', 'Dog park', 'Hundewiese'], gimnasio: ['🏋️', 'Gimnasio', 'Gym', 'Fitness'], piscina: ['🏊', 'Piscina', 'Pool', 'Schwimmbad'], cultura: ['🎭', 'Cultura', 'Culture', 'Kultur'],
  restaurante: ['🍽️', 'Restaurante', 'Restaurant', 'Restaurant'], cafe: ['☕', 'Café', 'Café', 'Café'], banco: ['🏦', 'Banco', 'Bank', 'Bank'], correos: ['✉️', 'Correos', 'Post office', 'Post'],
  parking: ['🅿️', 'Parking', 'Car park', 'Parkhaus'], carga: ['🔌', 'Carga eléctrica', 'EV charging', 'Ladesäule'] };
const KAT_FOLGE = ['metro', 'bus', 'cercanias', 'super', 'mercado', 'panaderia', 'farmacia', 'colegio', 'guarderia', 'parque', 'juegos', 'medico', 'salud', 'gimnasio', 'piscina', 'cultura', 'restaurante', 'cafe', 'bici', 'parking', 'carga', 'banco', 'correos', 'perros', 'universidad'];
const BT = { es: { titel: 'A pie desde la puerta', min: 'min', km: 'km', zonen: 'Zonas a pie: 5, 10 y 15 min', aero: 'Aeropuerto de Barajas', tren: 'Estación', satz: (a) => a.join(' · '), quelle: 'Datos: Catastro, © OpenStreetMap' },
  en: { titel: 'On foot from the front door', min: 'min', km: 'km', zonen: 'Walking zones: 5, 10 and 15 min', aero: 'Barajas Airport', tren: 'Station', satz: (a) => a.join(' · '), quelle: 'Data: Catastro, © OpenStreetMap' },
  de: { titel: 'Zu Fuß von der Haustür', min: 'Min.', km: 'km', zonen: 'Gehzonen: 5, 10 und 15 Min.', aero: 'Flughafen Barajas', tren: 'Bahnhof', satz: (a) => a.join(' · '), quelle: 'Daten: Catastro, © OpenStreetMap' } };
async function barrio(an) {
  const m = aktiv; m.barrioAn = an; for (const k of Object.keys(m.dateien)) zeige(k); if (m.barrioEbene) m.barrioEbene.visible = an; wrap.querySelector('.m-barrio')?.toggleAttribute('hidden', !an);
  if (!an) { barrioWeg(null); return; }
  if (axo) projektion('persp'); if (m.schnitt) schnitt('kein');
  kamera([260, 330, 380], [0, -21, 0]);
  if (m.barrioDaten) return;
  try { m.barrioDaten = await (await fetch(mitVersion(m.basis + 'barrio.json'))).json(); } catch (e) { console.error(e); return; }
  const D = m.barrioDaten, Y = D.strasse, G = m.barrioEbene = new THREE.Group(); m.wurzel.add(G); const sp = sprache(), li = { es: 1, en: 2, de: 3 }[sp] || 1;
  // Gehzonen
  const farben = { 5: 0x00b4c8, 10: 0x5fc7d3, 15: 0xa9dde3 };
  for (const mi of [15, 10, 5]) { const z = D.zonen[mi]; if (!z) continue; const f = new THREE.Shape(z.map(([x, y]) => new THREE.Vector2(x, y)));
    const fl = new THREE.Mesh(new THREE.ShapeGeometry(f), new THREE.MeshBasicMaterial({ color: farben[mi], transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide })); fl.rotation.x = -Math.PI / 2; fl.position.y = Y + 0.2 + mi * 0.01; G.add(fl);
    const lg = new THREE.BufferGeometry().setFromPoints(z.concat([z[0]]).map(([x, y]) => new THREE.Vector3(x, Y + 0.4, -y))); G.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: farben[mi] }))); }
  // Orte: Symbol und Minuten, feste Bildschirmgröße; je Kategorie die nächsten
  const schild = (txt, hervor) => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d'); x.fillStyle = hervor ? '#00b4c8' : 'rgba(255,255,255,.95)'; x.beginPath(); x.roundRect(4, 8, 248, 80, 40); x.fill(); x.font = '48px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; x.textBaseline = 'middle'; x.fillText(txt[0], 22, 50); x.font = 'bold 36px Helvetica, Arial, sans-serif'; x.fillStyle = hervor ? '#fff' : '#111'; x.fillText(txt[1], 92, 52); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, sizeAttenuation: false })); };
  m.barrioOrte = {};
  for (const [k, L] of Object.entries(D.orte)) { const def = KAT[k]; if (!def) continue; m.barrioOrte[k] = [];
    for (const [i, o] of L.slice(0, k === 'restaurante' || k === 'cafe' || k === 'bus' ? 3 : 5).entries()) { const s = schild([def[0], o.min + ' ' + BT[sp].min], false); s.scale.set(0.085, 0.032, 1); s.position.set(o.x, Y + 26 + (i % 3) * 4, -o.y); s.renderOrder = 20; s.userData.kat = k; G.add(s); m.barrioOrte[k].push(s);
      const pin = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(o.x, Y, -o.y), new THREE.Vector3(o.x, Y + 24 + (i % 3) * 4, -o.y)]), new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.5 })); G.add(pin); } }
  // Haustür
  const tuer = schild(['🏠', ''], true); tuer.scale.set(0.05, 0.032, 1); tuer.position.set(0, Y + 40, 0); tuer.renderOrder = 21; G.add(tuer);
  barrioListe(D, li);
}
function barrioWeg(k) {   // Fußweg zum nächsten Ziel der Kategorie, andere Kategorien blasser
  const m = aktiv; m.barrioWegNetz && m.barrioEbene?.remove(m.barrioWegNetz); m.barrioWegNetz = null;
  for (const [kk, L] of Object.entries(m.barrioOrte || {})) for (const s of L) s.material.opacity = !k || kk === k ? 1 : 0.25;
  const o = k && m.barrioDaten?.orte[k]?.[0]; if (!o?.weg) return; const Y = m.barrioDaten.strasse;
  const pts = o.weg.map(([x, y]) => new THREE.Vector3(x, Y + 1.2, -y)); const kurve = new THREE.CurvePath(); for (let i = 1; i < pts.length; i++) kurve.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
  m.barrioWegNetz = new THREE.Mesh(new THREE.TubeGeometry(kurve, Math.max(8, pts.length * 3), 2.2, 6, false), new THREE.MeshBasicMaterial({ color: 0x00b4c8 })); m.barrioEbene.add(m.barrioWegNetz);
  const ziel = new THREE.Vector3(o.x, Y, -o.y), mitte = ziel.clone().multiplyScalar(0.5); fahren([mitte.x + 140, Y + 260, mitte.z + 200], [mitte.x, Y, mitte.z], 1.6);
}
function barrioListe(D, li) {
  const b = wrap.querySelector('.m-buehne'); let p = wrap.querySelector('.m-barrio'); if (!p) { p = document.createElement('div'); p.className = 'm-barrio'; b.after(p); }
  const sp = sprache(), B = BT[sp], zeilen = [];
  for (const k of KAT_FOLGE) { const o = D.orte[k]?.[0]; if (!o) continue; const def = KAT[k]; zeilen.push(`<button type="button" data-kat="${k}"><span class="b-sym">${def[0]}</span><span class="b-was">${def[li]}${o.n ? ' · ' + o.n : ''}${o.linea ? ' (' + o.linea + ')' : ''}</span><b>${o.min} ${B.min}</b></button>`); }
  const fern = (D.fern || []).filter((f, i, a) => a.findIndex(g => g.k === f.k && (g.k === 'aeropuerto' || g.n === f.n)) === i).map(f => `<span class="b-fern">${f.k === 'aeropuerto' ? '✈️ ' + B.aero : '🚄 ' + f.n} · ${f.km} ${B.km}</span>`).join('');
  p.innerHTML = `<p class="b-titel">${B.titel}</p><div class="b-liste">${zeilen.join('')}</div><p class="b-fern-zeile">${fern}</p><p class="b-hinweis">${B.zonen} · ${B.quelle}</p>`;
  p.onclick = e => { const k = e.target.closest('[data-kat]')?.dataset.kat; if (!k) return; for (const x of p.querySelectorAll('[data-kat]')) x.classList.toggle('on', x.dataset.kat === k); barrioWeg(k); };
}

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
new IntersectionObserver(es => { for (const e of es) { sichtbar = e.isIntersecting; if (sichtbar) start(); } }, { rootMargin: '1200px' }).observe(wrap);   // früh laden (5.11.: die Stadt war beim Ankommen noch nicht da); der Anflug wartet trotzdem auf die Bühne

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
