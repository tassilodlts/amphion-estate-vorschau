// Amphion Estate · El barrio als eigene Karte unter dem Modell (4.11.2026, Tassilo: „als eigene Darstellung unter der Karte, mit Farben statt Emojis,
// Straßen darstellen, abstrakter; auf jedes Element drücken können, Name, Adresse; der Fußweg gepunktet von der Haustür bis zur Tür des Ortes;
// beim Herauszoomen werden die kleinen Sachen kleiner; dynamischer“).
// Daten: modell/monteesquinza/barrio.glb (Kataster-Blöcke) und barrio.json (tools/stadt_barrio_daten.py, tools/stadt_barrio_bloecke.mjs:
// Orte mit Fußweg, Adresse, Öffnungszeiten; Straßen nach Klasse; Grünflächen; Haustür). Koordinaten: x = Ost', y = Nord' → Szene (x, Höhe, -y).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const wrap = document.querySelector('[data-barrio]'); if (wrap) start();
const sprache = () => (document.documentElement.lang || 'es').slice(0, 2);
// Kategorien: Familie, Farbe, Namen es/en/de; Familien halten die Farben ruhig (Verkehr blau, Einkauf orange, Gesundheit rot, Bildung violett, Grün grün …)
const FAM = [
  ['mover', { es: 'Moverse', en: 'Getting around', de: 'Unterwegs' }, [['metro', '#1f5fd1', 'Metro', 'Metro', 'Metro'], ['bus', '#4b8ee8', 'Autobús', 'Bus', 'Bus'], ['cercanias', '#173f8f', 'Cercanías', 'Commuter train', 'S-Bahn'], ['bici', '#79b4f0', 'BiciMAD', 'BiciMAD', 'BiciMAD'], ['parking', '#5c6f8f', 'Parking', 'Car park', 'Parkhaus'], ['carga', '#8aa4c8', 'Carga eléctrica', 'EV charging', 'Ladesäule']]],
  ['comprar', { es: 'Compras', en: 'Shopping', de: 'Einkauf' }, [['super', '#ef7d1a', 'Supermercado', 'Supermarket', 'Supermarkt'], ['mercado', '#c95f0e', 'Mercado', 'Market', 'Markthalle'], ['panaderia', '#f2a65a', 'Panadería', 'Bakery', 'Bäckerei']]],
  ['salud', { es: 'Salud', en: 'Health', de: 'Gesundheit' }, [['farmacia', '#e0393e', 'Farmacia', 'Pharmacy', 'Apotheke'], ['medico', '#f0767a', 'Médico', 'Doctor', 'Arzt'], ['salud', '#a8262b', 'Hospital o clínica', 'Hospital or clinic', 'Klinik']]],
  ['educar', { es: 'Colegios', en: 'Schools', de: 'Schulen' }, [['colegio', '#7b4fc9', 'Colegio', 'School', 'Schule'], ['guarderia', '#a98be0', 'Escuela infantil', 'Nursery', 'Kita'], ['universidad', '#523190', 'Universidad', 'University', 'Universität']]],
  ['verde', { es: 'Verde', en: 'Green', de: 'Grün' }, [['parque', '#3d9a4b', 'Parque', 'Park', 'Park'], ['juegos', '#7cc46f', 'Parque infantil', 'Playground', 'Spielplatz'], ['perros', '#a7d58c', 'Zona canina', 'Dog park', 'Hundewiese']]],
  ['deporte', { es: 'Deporte', en: 'Sport', de: 'Sport' }, [['gimnasio', '#0f9e9a', 'Gimnasio', 'Gym', 'Fitness'], ['piscina', '#3cc3c9', 'Piscina', 'Pool', 'Schwimmbad']]],
  ['ocio', { es: 'Comer y cultura', en: 'Food and culture', de: 'Essen und Kultur' }, [['restaurante', '#c2347a', 'Restaurante', 'Restaurant', 'Restaurant'], ['cafe', '#e07bb0', 'Café', 'Café', 'Café'], ['cultura', '#8e2a6b', 'Cultura', 'Culture', 'Kultur']]],
  ['servicios', { es: 'Servicios', en: 'Services', de: 'Dienste' }, [['banco', '#8a7a62', 'Banco', 'Bank', 'Bank'], ['correos', '#b3a07c', 'Correos', 'Post office', 'Post']]]];
const KAT = {}; for (const [fam, , L] of FAM) for (const [k, farbe, es, en, de] of L) KAT[k] = { fam, farbe, n: { es, en, de } };
const GROSS = 7;   // Kugelhalbmesser in Metern (5.11., Tassilo: „die Punkte größer“; Weltgröße, beim Herauszoomen also kleiner)
const ANFANG = new Set(['metro', 'bus', 'super', 'mercado', 'panaderia', 'farmacia', 'colegio', 'parque', 'juegos', 'gimnasio']);   // beim Öffnen sichtbar, der Rest per Tipp
const T = { es: { min: 'min a pie', m: 'm', casa: 'Tu casa', maps: 'Ver en Google Maps', web: 'Web', horas: 'Horario', cerca: 'Lo más cercano', alle: 'Todo', keine: 'Nada' },
  en: { min: 'min on foot', m: 'm', casa: 'Your home', maps: 'Open in Google Maps', web: 'Website', horas: 'Hours', cerca: 'Nearest', alle: 'All', keine: 'None' },
  de: { min: 'Min. zu Fuß', m: 'm', casa: 'Ihr Zuhause', maps: 'In Google Maps öffnen', web: 'Webseite', horas: 'Öffnungszeiten', cerca: 'Am nächsten', alle: 'Alle', keine: 'Keine' } };

// Beschreibung (5.11., Tassilo: „Name, Betreff, Beschreibung, alles erscheinen, damit man versteht, was da ist“): aus den OSM-Angaben je Ort (o.t)
const KUECHE = { spanish: ['española', 'Spanish', 'spanisch'], regional: ['regional', 'regional', 'regional'], tapas: ['tapas', 'tapas', 'Tapas'], italian: ['italiana', 'Italian', 'italienisch'], pizza: ['pizza', 'pizza', 'Pizza'],
  japanese: ['japonesa', 'Japanese', 'japanisch'], sushi: ['sushi', 'sushi', 'Sushi'], chinese: ['china', 'Chinese', 'chinesisch'], asian: ['asiática', 'Asian', 'asiatisch'], thai: ['tailandesa', 'Thai', 'thailändisch'],
  korean: ['coreana', 'Korean', 'koreanisch'], vietnamese: ['vietnamita', 'Vietnamese', 'vietnamesisch'], indian: ['india', 'Indian', 'indisch'], mexican: ['mexicana', 'Mexican', 'mexikanisch'], peruvian: ['peruana', 'Peruvian', 'peruanisch'],
  argentinian: ['argentina', 'Argentinian', 'argentinisch'], venezuelan: ['venezolana', 'Venezuelan', 'venezolanisch'], american: ['americana', 'American', 'amerikanisch'], burger: ['hamburguesas', 'burgers', 'Burger'],
  mediterranean: ['mediterránea', 'Mediterranean', 'mediterran'], french: ['francesa', 'French', 'französisch'], greek: ['griega', 'Greek', 'griechisch'], lebanese: ['libanesa', 'Lebanese', 'libanesisch'], turkish: ['turca', 'Turkish', 'türkisch'],
  kebab: ['kebab', 'kebab', 'Kebab'], seafood: ['marisco', 'seafood', 'Meeresfrüchte'], steak_house: ['carnes', 'steak house', 'Steakhaus'], international: ['internacional', 'international', 'international'], fusion: ['fusión', 'fusion', 'Fusion'],
  vegetarian: ['vegetariana', 'vegetarian', 'vegetarisch'], vegan: ['vegana', 'vegan', 'vegan'], coffee_shop: ['café', 'coffee', 'Kaffee'], sandwich: ['bocadillos', 'sandwiches', 'Sandwiches'], breakfast: ['desayunos', 'breakfast', 'Frühstück'],
  cake: ['tartas', 'cakes', 'Kuchen'], ice_cream: ['helados', 'ice cream', 'Eis'], healthy: ['saludable', 'healthy', 'gesund'], juice: ['zumos', 'juices', 'Säfte'], tea: ['té', 'tea', 'Tee'], chicken: ['pollo', 'chicken', 'Hähnchen'] };
const SATZ = { es: { kueche: 'Cocina', silla: 'Accesible en silla de ruedas', sillaT: 'Acceso parcial en silla de ruedas', terraza: 'Con terraza', llevar: 'Para llevar', vege: 'Opciones vegetarianas', publico: 'Público', privado: 'Privado',
    concert: 'Concertado', isced: ['Escuela infantil', 'Primaria', 'ESO', 'Bachillerato'], gestion: 'Gestiona', tel: 'Teléfono', cerca: 'Cerca de', gratis: 'Gratis', pago: 'De pago', plazas: 'plazas', esp: 'Especialidad', red: 'Red', dias: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do', 'festivos'], foto: 'Foto: Wikimedia Commons' },
  en: { kueche: 'Cuisine', silla: 'Wheelchair accessible', sillaT: 'Partly wheelchair accessible', terraza: 'Outdoor seating', llevar: 'Takeaway', vege: 'Vegetarian options', publico: 'Public', privado: 'Private', concert: 'State-funded private',
    isced: ['Nursery', 'Primary', 'Secondary', 'Sixth form'], gestion: 'Run by', tel: 'Phone', cerca: 'Near', gratis: 'Free', pago: 'Paid', plazas: 'spaces', esp: 'Speciality', red: 'Network', dias: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'holidays'], foto: 'Photo: Wikimedia Commons' },
  de: { kueche: 'Küche', silla: 'Rollstuhlgerecht', sillaT: 'Teilweise rollstuhlgerecht', terraza: 'Mit Terrasse', llevar: 'Zum Mitnehmen', vege: 'Vegetarische Gerichte', publico: 'Öffentlich', privado: 'Privat', concert: 'Privat, staatlich gefördert',
    isced: ['Kita', 'Grundschule', 'Sekundarstufe', 'Oberstufe'], gestion: 'Betreiber', tel: 'Telefon', cerca: 'Nahe', gratis: 'Kostenlos', pago: 'Kostenpflichtig', plazas: 'Plätze', esp: 'Fachrichtung', red: 'Netz', dias: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So', 'Feiertage'], foto: 'Foto: Wikimedia Commons' } };
function stunden(h, sp) { const D = SATZ[sp].dias, E = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su', 'PH']; return h.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, x => D[E.indexOf(x)]).replace(/\boff\b/g, '–').replace(/;\s*/g, ' · '); }
function merkmale(o, sp) {   // kurze Sätze, je Zeile einer
  const t = o.t || {}, S = SATZ[sp] || SATZ.es, L = [], j = { es: 0, en: 1, de: 2 }[sp] ?? 0, ja = v => v === 'yes' || v === 'only';
  if (t.cuisine) L.push(S.kueche + ': ' + t.cuisine.split(/[;,]/).map(c => KUECHE[c.trim()]?.[j] || c.trim().replace(/_/g, ' ')).join(', '));
  if (t['isced:level']) L.push(t['isced:level'].split(/[;,-]/).map(n => S.isced[+n] || '').filter(Boolean).join(', '));
  if (t['operator:type']) L.push({ public: S.publico, government: S.publico, private: S.privado, private_non_profit: S.privado, religious: S.concert, community: S.publico }[t['operator:type']] || '');
  if (t['healthcare:speciality']) L.push(S.esp + ': ' + t['healthcare:speciality'].replace(/[;_]/g, ' '));
  if (t.network && o.k !== 'metro') L.push(S.red + ': ' + t.network);
  if (t.capacity && /^\d+$/.test(t.capacity)) L.push(t.capacity + ' ' + S.plazas);
  if (t.fee) L.push(t.fee === 'no' ? S.gratis : S.pago);
  if (ja(t.outdoor_seating)) L.push(S.terraza); if (ja(t.takeaway)) L.push(S.llevar); if (ja(t['diet:vegetarian'])) L.push(S.vege);
  if (t.wheelchair === 'yes') L.push(S.silla); else if (t.wheelchair === 'limited') L.push(S.sillaT);
  const op = t.operator || t.brand; if (op && op !== o.n) L.push(S.gestion + ': ' + op);
  return L.filter(Boolean);
}
function start() {
  let los = false; const io = new IntersectionObserver(e => { if (!los && e[0].isIntersecting) { los = true; io.disconnect(); aufbauen(); } }, { rootMargin: '400px' }); io.observe(wrap);
}
async function aufbauen() {
  const basis = wrap.dataset.barrio, canvas = wrap.querySelector('canvas'), info = wrap.querySelector('.b-info'), tip = wrap.querySelector('.b-tip'), chips = document.querySelector('.b-kat');
  const mitV = pfad => window.AMPHION_DATEIEN?.[pfad] ? `${pfad}?v=${window.AMPHION_DATEIEN[pfad]}` : pfad;   // Versionsstempel wie im Betrachter
  const D = await (await fetch(mitV(basis + 'barrio.json'))).json(), Y = D.strasse, sp = sprache(), TX = T[sp] || T.es;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf3f1ec); scene.fog = new THREE.Fog(0xf3f1ec, 1800, 3200);
  const camera = new THREE.PerspectiveCamera(32, 1, 5, 8000); camera.position.set(-260, Y + 520, 520);
  const controls = new MapControls(camera, canvas); controls.target.set(0, Y, 0); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 60; controls.maxDistance = 2600; controls.maxPolarAngle = 1.15; controls.screenSpacePanning = false;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c8, 2.1)); const sonne = new THREE.DirectionalLight(0xffffff, 1.2); sonne.position.set(-300, 600, 200); scene.add(sonne);
  // Boden, Grün, Straßen (flach, leicht übereinander gegen Flimmern)
  const boden = new THREE.Mesh(new THREE.CircleGeometry(2400, 96), new THREE.MeshBasicMaterial({ color: 0xe9e5dd })); boden.rotation.x = -Math.PI / 2; boden.position.y = Y - 0.2; scene.add(boden);
  const flaeche = (ringe, farbe, h) => { const geos = ringe.map(r => { const g = new THREE.ShapeGeometry(new THREE.Shape(r.map(([x, y]) => new THREE.Vector2(x, y)))); g.rotateX(-Math.PI / 2); g.translate(0, h, 0); return g; }); return new THREE.Mesh(mergeGeometries(geos), new THREE.MeshBasicMaterial({ color: farbe })); };
  if (D.gruen?.length) scene.add(flaeche(D.gruen, 0xcfe2c2, Y - 0.1));
  const BREITE = { 1: 15, 2: 11, 3: 8, 4: 6 }, strGeo = [];
  for (const s of D.strassen || []) {
    const b = BREITE[s.k] || 7, P = s.p.map(([x, y]) => new THREE.Vector2(x, -y));
    for (let i = 1; i < P.length; i++) { const a = P[i - 1], c = P[i], d = c.clone().sub(a), L = d.length(); if (L < 0.01) continue; const g = new THREE.PlaneGeometry(L, b); g.rotateX(-Math.PI / 2); g.rotateY(-Math.atan2(d.y, d.x)); g.translate((a.x + c.x) / 2, Y - 0.05 + (5 - s.k) * 0.01, (a.y + c.y) / 2); strGeo.push(g); }
    for (const p of P) { const g = new THREE.CircleGeometry(b / 2, 10); g.rotateX(-Math.PI / 2); g.translate(p.x, Y - 0.05 + (5 - s.k) * 0.01, p.y); strGeo.push(g); }   // runde Stöße
  }
  if (strGeo.length) scene.add(new THREE.Mesh(mergeGeometries(strGeo.map(g => g.index ? g.toNonIndexed() : g)), new THREE.MeshBasicMaterial({ color: 0xffffff })));
  // Blöcke aus dem Kataster (weiß, unser Haus türkis aus der Datei)
  const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/'), gl = new GLTFLoader().setDRACOLoader(draco);
  gl.loadAsync(mitV(basis + 'barrio.glb')).then(d => { d.scene.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }); } }); scene.add(d.scene); });
  // Haustür
  const tuer = new THREE.Vector3(D.tuer?.[0] ?? 0, Y, -(D.tuer?.[1] ?? 0));
  const tuerRing = new THREE.Mesh(new THREE.RingGeometry(4, 6.5, 40), new THREE.MeshBasicMaterial({ color: 0x00b4c8, transparent: true })); tuerRing.rotation.x = -Math.PI / 2; tuerRing.position.copy(tuer).setY(Y + 0.3); scene.add(tuerRing);
  const tuerPunkt = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), new THREE.MeshBasicMaterial({ color: 0x00b4c8 })); tuerPunkt.rotation.x = -Math.PI / 2; tuerPunkt.position.copy(tuer).setY(Y + 0.35); scene.add(tuerPunkt);
  // Orte: farbige Kugel auf dünnem Stiel, Weltgröße (beim Herauszoomen kleiner); je Kategorie ein InstancedMesh
  const orte = [], gruppen = {}, kugel = new THREE.SphereGeometry(1, 18, 12), stiele = [];
  for (const [k, L] of Object.entries(D.orte)) {
    if (!KAT[k]) continue; const im = new THREE.InstancedMesh(kugel, new THREE.MeshLambertMaterial({ color: KAT[k].farbe }), L.length), m4 = new THREE.Matrix4();
    L.forEach((o, i) => { const h = Y + 14 + (i % 3) * 2; m4.compose(new THREE.Vector3(o.x, h, -o.y), new THREE.Quaternion(), new THREE.Vector3(GROSS, GROSS, GROSS)); im.setMatrixAt(i, m4); orte.push({ ...o, k, i, im, hh: h }); stiele.push(o.x, Y, -o.y, o.x, h, -o.y); });   // hh: Höhe der Kugel (h ist die Öffnungszeit)
    im.userData.k = k; im.visible = ANFANG.has(k); gruppen[k] = im; scene.add(im);
  }
  const stielGeo = new THREE.BufferGeometry(); stielGeo.setAttribute('position', new THREE.Float32BufferAttribute(stiele, 3)); const stielLinien = new THREE.LineSegments(stielGeo, new THREE.LineBasicMaterial({ color: 0x8c8780, transparent: true, opacity: 0.55 })); scene.add(stielLinien);
  const stielSichtbar = () => { const a = stielGeo.attributes.position, sichtbar = new Set(Object.entries(gruppen).filter(([, g]) => g.visible).map(([k]) => k)); let j = 0; for (const o of orte) { const s = sichtbar.has(o.k) ? 1 : 0; a.setY(j * 2 + 1, s ? o.hh : Y); j++; } a.needsUpdate = true; };
  stielSichtbar();
  // Fußweg: Punkte im Abstand von 6 m, die nacheinander erscheinen und danach langsam wandern (gepunktet, Farbe der Kategorie)
  let weg = null, wahl = null;
  const punktGeo = new THREE.CircleGeometry(1.6, 12); punktGeo.rotateX(-Math.PI / 2);
  function wegZeigen(o) {
    if (weg) { scene.remove(weg.mesh); weg.mesh.dispose(); weg = null; } if (!o?.weg) return;
    const P = o.weg.map(([x, y]) => new THREE.Vector3(x, Y + 0.4, -y)), pts = []; let rest = 0;
    for (let i = 1; i < P.length; i++) { const a = P[i - 1], d = P[i].clone().sub(a), L = d.length(); for (let s = rest; s < L; s += 6) pts.push(a.clone().addScaledVector(d, s / L)); rest = (rest - L) % 6; if (rest < 0) rest += 6; }
    pts.push(P.at(-1)); const mesh = new THREE.InstancedMesh(punktGeo, new THREE.MeshBasicMaterial({ color: KAT[o.k].farbe, depthTest: false, transparent: true }), pts.length); mesh.count = 0; mesh.renderOrder = 5; scene.add(mesh); weg = { mesh, pts, t0: performance.now() };   // auch hinter hohen Häusern sichtbar
  }
  function zeichneWeg(now) {
    if (!weg) return; const n = weg.pts.length, sicht = Math.min(n, Math.floor((now - weg.t0) / 18)), m4 = new THREE.Matrix4(), welle = (now - weg.t0) / 140;
    for (let i = 0; i < sicht; i++) { const s = 1 + 0.35 * Math.max(0, Math.cos((i - welle) * 0.6)) ** 8; m4.compose(weg.pts[i], new THREE.Quaternion(), new THREE.Vector3(s, 1, s)); weg.mesh.setMatrixAt(i, m4); }
    weg.mesh.count = sicht; weg.mesh.instanceMatrix.needsUpdate = true;
  }
  // Auswahl: Karte mit Name, Kategorie, Gehzeit, Adresse, Öffnungszeiten, Links; Kamera fährt so, dass Weg und Ort im Bild sind
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function waehle(o) {
    if (wahl) { const m = new THREE.Matrix4().compose(new THREE.Vector3(wahl.x, wahl.hh, -wahl.y), new THREE.Quaternion(), new THREE.Vector3(GROSS, GROSS, GROSS)); wahl.im.setMatrixAt(wahl.i, m); wahl.im.instanceMatrix.needsUpdate = true; }   // alte Wahl wieder klein
    wahl = o; wegZeigen(o); if (!o) { info.hidden = true; return; }
    const K = KAT[o.k], maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(o.n ? `${o.n}, ${o.dir ? o.dir + ', ' : ''}Madrid` : `${o.la},${o.lo}`);
    const S = SATZ[sp] || SATZ.es, M = merkmale(o, sp), tel = o.t?.phone || o.t?.['contact:phone'], ort = o.dir || (o.cerca ? S.cerca + ' ' + o.cerca : '');
    info.innerHTML = `<button type="button" class="b-zu" aria-label="×">×</button>${o.img ? `<figure class="b-bild"><img src="${esc(o.img)}" alt="" loading="lazy" referrerpolicy="no-referrer"><figcaption>${S.foto}</figcaption></figure>` : ''}
      <p class="b-k" style="--f:${K.farbe}">${esc(K.n[sp] || K.n.es)}</p><h3>${esc(o.n || K.n[sp] || K.n.es)}${o.linea ? ' <span>' + esc(o.linea) + '</span>' : ''}</h3>
      <p class="b-zeit"><b>${o.min}</b> ${TX.min} · ${o.m} ${TX.m}</p>${ort ? `<p class="b-dir">${esc(ort)}</p>` : ''}${o.t?.description ? `<p class="b-desc">${esc(o.t.description)}</p>` : ''}
      ${M.length ? `<ul class="b-merk">${M.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${o.h ? `<p class="b-h">${TX.horas}: ${esc(stunden(o.h, sp))}</p>` : ''}${tel ? `<p class="b-h">${S.tel}: <a href="tel:${esc(tel.split(';')[0].replace(/\s/g, ''))}">${esc(tel.split(';')[0])}</a></p>` : ''}
      <p class="b-links"><a href="${maps}" target="_blank" rel="noopener">${TX.maps}</a>${o.web ? ` · <a href="${esc(o.web)}" target="_blank" rel="noopener">${TX.web}</a>` : ''}</p>`;
    const bild = info.querySelector('.b-bild img'); if (bild) bild.onerror = () => bild.closest('figure').remove();   // Bild weg, Karte bleibt
    info.hidden = false; info.querySelector('.b-zu').onclick = () => waehle(null);
    const b = new THREE.Box3(); for (const [x, y] of o.weg || [[o.x, o.y]]) b.expandByPoint(new THREE.Vector3(x, Y, -y)); b.expandByPoint(tuer);
    const c = b.getCenter(new THREE.Vector3()), r = Math.max(120, b.getSize(new THREE.Vector3()).length() * 0.9), dir = camera.position.clone().sub(controls.target).normalize();
    flug = { p0: camera.position.clone(), t0: controls.target.clone(), p1: c.clone().addScaledVector(dir, r * 1.6), t1: c, s: performance.now() };
  }
  let flug = null;
  // Kategorien als Farbchips, nach Familie; Tipp schaltet alle Orte der Kategorie an oder aus
  const naechste = k => D.orte[k]?.[0];
  chips.innerHTML = FAM.map(([fam, fn, L]) => `<div class="b-fam"><p>${esc(fn[sp] || fn.es)}</p>${L.filter(([k]) => D.orte[k]?.length).map(([k, f]) => `<button type="button" data-k="${k}" class="${ANFANG.has(k) ? 'on' : ''}" style="--f:${f}"><i></i>${esc(KAT[k].n[sp] || KAT[k].n.es)}<span>${naechste(k).min} min</span></button>`).join('')}</div>`).join('');
  chips.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k, an = !gruppen[k].visible; gruppen[k].visible = an; b.classList.toggle('on', an); stielSichtbar(); if (an) waehle(orte.find(o => o.k === k && o.i === 0)); else if (wahl?.k === k) waehle(null); };
  // Zeigen und Tippen
  const ray = new THREE.Raycaster(), maus = new THREE.Vector2(); let ab = null;
  const treffer = e => { const r = canvas.getBoundingClientRect(); maus.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(maus, camera); const h = ray.intersectObjects(Object.values(gruppen).filter(g => g.visible), false)[0]; return h ? orte.find(o => o.im === h.object && o.i === h.instanceId) : null; };
  canvas.addEventListener('pointerdown', e => { ab = [e.clientX, e.clientY]; flug = null; });
  canvas.addEventListener('pointerup', e => { if (!ab || Math.hypot(e.clientX - ab[0], e.clientY - ab[1]) > 6) return; waehle(treffer(e)); });
  canvas.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || e.buttons) { tip.hidden = true; return; } const o = treffer(e); canvas.style.cursor = o ? 'pointer' : ''; if (!o) { tip.hidden = true; return; } const r = canvas.getBoundingClientRect(); tip.textContent = `${o.n || KAT[o.k].n[sp]} · ${o.min} min`; tip.style.left = (e.clientX - r.left + 14) + 'px'; tip.style.top = (e.clientY - r.top - 10) + 'px'; tip.hidden = false; });
  // Größe, Schleife
  const groesse = () => { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  new ResizeObserver(groesse).observe(canvas); groesse();
  const m4 = new THREE.Matrix4();
  renderer.setAnimationLoop(now => {
    if (flug) { const u = Math.min(1, (now - flug.s) / 1400), e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2; camera.position.lerpVectors(flug.p0, flug.p1, e); controls.target.lerpVectors(flug.t0, flug.t1, e); if (u >= 1) flug = null; }
    controls.update(); const s = 1 + 0.18 * Math.sin(now / 380); tuerRing.scale.set(s, s, s);
    if (wahl) { const p = 0.5 + 0.5 * Math.sin(now / 220), q = GROSS * (1.35 + 0.25 * p); m4.compose(new THREE.Vector3(wahl.x, wahl.hh, -wahl.y), new THREE.Quaternion(), new THREE.Vector3(q, q, q)); wahl.im.setMatrixAt(wahl.i, m4); wahl.im.instanceMatrix.needsUpdate = true; }
    zeichneWeg(now); renderer.render(scene, camera);
  });
  window.formaBarrio = { orte: () => orte.length, sichtbar: () => Object.values(gruppen).filter(g => g.visible).reduce((a, g) => a + g.count, 0), waehle: (k, i = 0) => waehle(orte.find(o => o.k === k && o.i === i)), wahl: () => wahl && { n: wahl.n, min: wahl.min, weg: weg?.pts.length || 0, karte: !info.hidden, merk: info.querySelectorAll('.b-merk li').length, ort: !!info.querySelector('.b-dir'), text: info.textContent.replace(/\s+/g, ' ').trim() }, groesse: GROSS, chips: () => chips.querySelectorAll('[data-k]').length };
  wrap.classList.add('bereit');
}
