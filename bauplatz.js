// Amphion · Website: Bauplatz (2.11., Tassilo: „bau ein gelbes Dach“, „ein gotisches Dach“ soll auf der Website wirklich gehen).
// Ein Gebäude aus einfachen Bauteilen (Liste wie die Cloud sie liefert, /demo/bauen) wird hier zu 3D-Körpern: Quader, Zylinder, Kegel,
// Pyramide, Kugel und Dächer (Sattel, Walm, Pult, Flach, Zelt, Mansard, Tonne). Koordinaten in Metern, y oben, „mitte“ = Mitte der Grundfläche unten.
import * as THREE from 'three';

// Startgebäude: zweigeschossiges Haus mit Satteldach, 12 × 10 m, Eingang im Süden (+z)
export const START = (() => {
  const t = [
    { id: 'sockel', art: 'quader', mitte: [0, 0, 0], masse: [12.3, 0.5, 10.3], drehung: 0, farbe: '#8f8a80', stoff: 'stein' },
    { id: 'waende', art: 'quader', mitte: [0, 0.5, 0], masse: [12, 5.7, 10], drehung: 0, farbe: '#ece6da', stoff: 'putz' },
    { id: 'dach', art: 'dach', form: 'sattel', neigung: 38, ueberstand: 0.5, mitte: [0, 6.2, 0], masse: [12, 3.9, 10], drehung: 0, farbe: '#9c4a32', stoff: 'dachziegel' },
    { id: 'kamin', art: 'quader', mitte: [3.2, 8.2, -1.6], masse: [0.7, 2.6, 0.7], drehung: 0, farbe: '#8a5a44', stoff: 'ziegel' },
    { id: 'tuer', art: 'quader', mitte: [0, 0.5, 5.06], masse: [1.2, 2.3, 0.12], drehung: 0, farbe: '#5a4030', stoff: 'holz' },
    { id: 'stufe', art: 'quader', mitte: [0, 0, 5.6], masse: [2.2, 0.5, 1.0], drehung: 0, farbe: '#8f8a80', stoff: 'stein' },
  ];
  const fenster = (id, x, y, z, b, h, quer) => t.push({ id, art: 'quader', mitte: [x, y, z], masse: quer ? [0.12, h, b] : [b, h, 0.12], drehung: 0, farbe: '#9fb6c2', stoff: 'glas' });
  for (const [i, x] of [-4, -2.2, 2.2, 4].entries()) fenster('f_s_eg' + i, x, 1.4, 5.06, 1.2, 1.5);
  for (const [i, x] of [-4, -1.4, 1.4, 4].entries()) fenster('f_s_og' + i, x, 4.0, 5.06, 1.2, 1.5);
  for (const [i, x] of [-3.5, 0, 3.5].entries()) { fenster('f_n_eg' + i, x, 1.4, -5.06, 1.2, 1.5); fenster('f_n_og' + i, x, 4.0, -5.06, 1.2, 1.5); }
  for (const [i, z] of [-2.2, 2.2].entries()) { fenster('f_o_eg' + i, 6.06, 1.4, z, 1.2, 1.5, true); fenster('f_o_og' + i, 6.06, 4.0, z, 1.2, 1.5, true); fenster('f_w_eg' + i, -6.06, 1.4, z, 1.2, 1.5, true); fenster('f_w_og' + i, -6.06, 4.0, z, 1.2, 1.5, true); }
  return t;
})();

const RAUH = { putz: 0.95, ziegel: 0.9, holz: 0.75, beton: 0.9, stein: 0.85, metall: 0.35, glas: 0.05, dachziegel: 0.8, gruen: 1 };
const zahl = (v, d) => (Number.isFinite(+v) ? +v : d);

// Prisma: Profil in der z-y-Ebene (geschlossen, gegen den Uhrzeigersinn), entlang x von -B/2 bis B/2
function prisma(profil, B) {
  const P = [], quer = (a, b, c) => P.push(...a, ...b, ...c), n = profil.length, x0 = -B / 2, x1 = B / 2;
  for (let i = 0; i < n; i++) { const [za, ya] = profil[i], [zb, yb] = profil[(i + 1) % n]; quer([x0, ya, za], [x0, yb, zb], [x1, yb, zb]); quer([x0, ya, za], [x1, yb, zb], [x1, ya, za]); }
  const dreiecke = THREE.ShapeUtils.triangulateShape(profil.map(([z, y]) => new THREE.Vector2(z, y)), []);
  for (const [a, b, c] of dreiecke) { const [pa, pb, pc] = [profil[a], profil[b], profil[c]]; quer([x0, pa[1], pa[0]], [x0, pc[1], pc[0]], [x0, pb[1], pb[0]]); quer([x1, pa[1], pa[0]], [x1, pb[1], pb[0]], [x1, pc[1], pc[0]]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); return g;
}
// Dreiecke aus Punktlisten (Flächen als Fächer)
function flaechen(liste) {
  const P = []; for (const f of liste) for (let i = 1; i + 1 < f.length; i++) P.push(...f[0], ...f[i], ...f[i + 1]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); return g;
}

// Dach über der Grundfläche b (x) × d (z), First in x; Höhe aus der Neigung (oder aus masse[1])
function dach(t) {
  let [b, h, d] = (t.masse || [10, 3, 10]).map(Number); const ue = zahl(t.ueberstand, 0.4), form = t.form || 'sattel';
  let dreh = false; if ((form === 'walm' || form === 'zelt') && b < d) { [b, d] = [d, b]; dreh = true; }   // Walm/Zelt: First immer entlang der langen Seite
  const B = b + 2 * ue, D = d + 2 * ue, tan = Math.tan(zahl(t.neigung, 35) * Math.PI / 180);
  const hoehe = t.neigung != null ? (form === 'pult' ? D * tan : D / 2 * tan) : zahl(h, 3);
  let g;
  if (form === 'flach') { g = new THREE.BoxGeometry(B, Math.max(0.2, zahl(h, 0.4)), D); g.translate(0, Math.max(0.2, zahl(h, 0.4)) / 2, 0); }
  else if (form === 'pult') g = prisma([[-D / 2, 0], [D / 2, 0], [-D / 2, hoehe]].reverse(), B);
  else if (form === 'mansard') g = prisma([[-D / 2, 0], [D / 2, 0], [D / 2 - D * 0.16, hoehe * 0.62], [0, hoehe], [-D / 2 + D * 0.16, hoehe * 0.62]].reverse(), B);
  else if (form === 'tonne') { const pr = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; pr.push([D / 2 * Math.cos(a), hoehe * Math.sin(a)]); } g = prisma(pr, B); }
  else if (form === 'zelt') { const s = [0, hoehe, 0], e = [[-B / 2, 0, -D / 2], [B / 2, 0, -D / 2], [B / 2, 0, D / 2], [-B / 2, 0, D / 2]]; g = flaechen([[e[3], e[2], s], [e[2], e[1], s], [e[1], e[0], s], [e[0], e[3], s], [e[0], e[1], e[2], e[3]]]); }
  else if (form === 'walm') {
    const r = Math.max(0, B / 2 - D / 2), a = [-r, hoehe, 0], c = [r, hoehe, 0], e = [[-B / 2, 0, -D / 2], [B / 2, 0, -D / 2], [B / 2, 0, D / 2], [-B / 2, 0, D / 2]];
    g = flaechen([[e[3], e[2], c, a], [e[1], e[0], a, c], [e[2], e[1], c], [e[0], e[3], a], [e[0], e[1], e[2], e[3]]]);
  } else g = prisma([[-D / 2, 0], [D / 2, 0], [0, hoehe]].reverse(), B);   // Satteldach
  if (dreh) g.rotateY(Math.PI / 2);
  return g;
}

function geometrie(t) {
  const [b, h, d] = (t.masse || [1, 1, 1]).map(v => Math.max(0.01, zahl(v, 1)));
  let g;
  switch (t.art) {
    case 'zylinder': g = new THREE.CylinderGeometry(b / 2, b / 2, h, 40); break;
    case 'kegel': g = new THREE.ConeGeometry(b / 2, h, 40); break;
    case 'pyramide': g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); g.rotateY(Math.PI / 4); g.scale(b, h, d); break;
    case 'kugel': g = new THREE.SphereGeometry(0.5, 40, 20); g.scale(b, h, d); break;
    case 'dach': return dach(t);
    default: g = new THREE.BoxGeometry(b, h, d);
  }
  if (t.art === 'kugel') g.translate(0, h / 2, 0); else g.translate(0, h / 2, 0);
  return g;
}

// Liste → Gruppe. umgebung: Spiegelbild für Glas und Metall
export function baue(teile, umgebung) {
  const gruppe = new THREE.Group(); gruppe.name = 'bau';
  for (const t of (teile || []).slice(0, 200)) {
    try {
      const glas = t.stoff === 'glas', farbe = new THREE.Color(/^#[0-9a-f]{6}$/i.test(t.farbe || '') ? t.farbe : '#d8d4cc');
      const mat = glas
        ? new THREE.MeshStandardMaterial({ color: farbe, metalness: 0.2, roughness: 0.05, envMap: umgebung, envMapIntensity: 1.4, transparent: true, opacity: 0.62 })
        : new THREE.MeshStandardMaterial({ color: farbe, metalness: t.stoff === 'metall' ? 0.7 : 0, roughness: RAUH[t.stoff] ?? 0.9, envMap: umgebung, envMapIntensity: t.stoff === 'metall' ? 1.0 : 0.22, flatShading: t.art === 'dach' || t.art === 'pyramide', side: THREE.DoubleSide });   // Umgebungslicht hellt Putz auf
      const m = new THREE.Mesh(geometrie(t), mat), [x, y, z] = (t.mitte || [0, 0, 0]).map(v => zahl(v, 0));
      m.position.set(x, y, z); m.rotation.y = -zahl(t.drehung, 0) * Math.PI / 180; m.castShadow = m.receiveShadow = true; m.userData.teil = t.id;
      gruppe.add(m);
    } catch (e) { console.warn('Bauteil übersprungen', t, e); }
  }
  return gruppe;
}

// Licht und Schatten des Bauplatzes: eine Sonne nur für diese Szene und ein Boden, der nur den Schatten zeigt
export function bauLicht() {
  const g = new THREE.Group(), sonne = new THREE.DirectionalLight(0xfff4e6, 0.55);   // schwach: die Szene hat schon Licht, diese Sonne macht vor allem den Schatten
  sonne.position.set(28, 42, 22); sonne.castShadow = true; sonne.shadow.mapSize.set(2048, 2048);
  Object.assign(sonne.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 140 }); sonne.shadow.bias = -0.0004; sonne.shadow.normalBias = 0.02;
  const schatten = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: 0.22 })); schatten.rotation.x = -Math.PI / 2; schatten.position.y = 0.005; schatten.receiveShadow = true;
  g.add(sonne, sonne.target, schatten); return g;
}
