// Amphion Estate (3.11.2026): Sprache nach Gerät (es zuerst), ?lang=es|en|de, Texte über data-i18n wie auf amphion3d.com.
const TEXTE = {
  es: null,   // Spanisch steht im HTML
  en: {
    'titel': 'Amphion Estate · The renovated home, before the renovation', 'meta': 'For estate agencies in Madrid: we show the home already renovated and furnished, in 3D and in images, before a single euro goes into the works. Several proposals, plans and a 3D model in five days.',
    'nav.ejemplo': 'Example', 'nav.entrega': 'What you get', 'nav.precios': 'Prices', 'nav.como': 'How it works', 'nav.kontakt': 'Order a home',
    'held.vor': 'Madrid · Homes to renovate', 'held.titel': 'Show the finished home <em>before</em> the works.',
    'held.text': 'A home in need of renovation sells on what it could become. We build that home: renovated, adapted and furnished, inside the 3D map of Madrid. Your client walks through it on the phone and compares several proposals, before anyone has spent a euro on the works.',
    'held.ver': 'See the example', 'held.pedir': 'Order a home', 'held.klein': 'Delivered in five working days. We work with ten agencies in Madrid, no more.',
    'fall.vor': 'Real example', 'fall.titel': 'Penthouse in Almagro', 'fall.d1': 'Area', 'fall.d2': 'Size', 'fall.v2': '187 m² built, 34 m² of terraces', 'fall.d3': 'Building', 'fall.v3': '1930, penthouse, 3 bedrooms', 'fall.d4': 'Commission', 'fall.v4': 'Two renovation proposals, 3D model',
    'modell.text': 'This is the home once it is finished, although the works have not started: walls, joinery, kitchen and furniture, in its building and its neighbourhood. Walk through it, lift the ceiling to see it whole from above, remove the furniture, or ask in a sentence for what you want to see.',
    'modell.reiter': 'Penthouse in Almagro', 'modell.frage': 'Tell the home what you want to see …', 'modell.diktat': 'Dictate', 'modell.fehler': 'The model could not be loaded.',
    'chip.0': 'Guided walk', 'chip.1': 'No ceiling: the whole home from above', 'chip.7': 'With the roof: the building as it is', 'chip.2': 'Remove the furniture', 'chip.3': 'Architecture only', 'chip.4': 'Show me the services', 'chip.5': 'Step into the living room', 'chip.6': 'Without the city', 'chip.zurueck': 'Everything back',
    'modell.steuerung': 'Drag to turn · right button or two fingers to pan · wheel or two fingers to zoom',
    'lief.vor': 'What you get', 'lief.titel': 'The finished works, before the works begin', 'lief.text': 'For this home we deliver exactly this. Everything comes from the same model: plans, images and 3D match to the centimetre, and each proposal can be compared with the other.',
    'lief.1t': 'Renovation plan 1:50', 'lief.1': 'Layout, furniture, wardrobes, services and area table. Ready for the dossier and a starting point for the project and the works.',
    'lief.2t': 'Proposal B: four bedrooms', 'lief.2': 'The same home, renovated another way. Your client chooses between options they can see instead of imagining them.',
    'lief.3t': 'Kitchen, open island', 'lief.3': 'Virtual image from the model.', 'lief.4t': 'Living room', 'lief.4': 'Virtual image from the model.', 'lief.5t': 'Dining room towards the terrace', 'lief.5': 'Virtual image from the model.',
    'lief.6t': 'Covered terrace', 'lief.6': 'Virtual image from the model.', 'lief.7t': 'Master bedroom', 'lief.7': 'Virtual image from the model.', 'lief.8t': 'Bathroom A', 'lief.8': 'Virtual image from the model.',
    'lief.hinweis': 'All images are marked as virtual images, as real-estate advertising requires. 3D, plans and images match because they come from the same model.',
    'preis.vor': 'Prices', 'preis.titel': 'One home, one price', 'preis.iva': '+ VAT',
    'preis.1t': 'Home', 'preis.1a': 'The renovated home, in 3D', 'preis.1b': 'Renovation plan 1:50', 'preis.1c': 'Six virtual images', 'preis.1d': 'Link to walk through it on the phone, 90 days',
    'preis.2t': 'Home and design', 'preis.2a': 'Everything in Home', 'preis.2b': 'Two renovation proposals: layout, materials, furniture', 'preis.2c': 'Plans for each proposal', 'preis.2d': 'Twelve virtual images, two interior styles',
    'preis.3t': 'Edition', 'preis.3a': 'Everything in Home and design', 'preis.3b': 'The home inside the 3D map of Madrid, with a guided walk', 'preis.3c': '30-second video, vertical and horizontal', 'preis.3d': 'Printed dossier for the viewing',
    'preis.mehr': '<b>Is the renovation going ahead?</b> The model already exists. We also build custom 3D models and draw the project plans, from the existing state to the works, for agencies, developers and owners.', 'preis.satz': 'Agencies: five homes a month for €24,000 + VAT, with delivery priority. Ten agencies in Madrid only.',
    'wie.vor': 'How it works', 'wie.titel': 'Five working days',
    'wie.1t': 'You send us the plan and the address', 'wie.1': 'The dossier plan, the one from idealista or a hand sketch will do. If it is not to scale, you give us one measurement.',
    'wie.2t': 'We build the home, before and after', 'wie.2': 'With Amphion, our own software: first the home as it is today, then the renovation with walls, joinery, kitchen, bathrooms and furniture. The proposals are designed by our architecture team.',
    'wie.3t': 'We deliver', 'wie.3': 'Plans as PDF, images for the portal, the link for the phone and, if you want, the video. Your client sees the finished home and decides.',
    'kon.titel': 'Do you have a home that does not yet show all it could be?', 'kon.text': 'Madrid. We answer the same day.',
    'fuss.app': 'Amphion, the software', 'fuss.datenschutz': 'Privacy',
  },
  de: {
    'titel': 'Amphion Estate · Die renovierte Wohnung, vor der Renovierung', 'meta': 'Für Maklerbüros in Madrid: Wir zeigen die Wohnung schon renoviert und eingerichtet, in 3D und in Bildern, bevor ein Euro in die Baustelle fließt. Mehrere Vorschläge, Pläne und 3D-Modell in fünf Tagen.',
    'nav.ejemplo': 'Beispiel', 'nav.entrega': 'Was wir liefern', 'nav.precios': 'Preise', 'nav.como': 'So geht es', 'nav.kontakt': 'Wohnung bestellen',
    'held.vor': 'Madrid · Wohnungen vor der Renovierung', 'held.titel': 'Zeig die fertige Wohnung, <em>bevor</em> gebaut wird.',
    'held.text': 'Eine Wohnung, die renoviert werden muss, verkauft sich über das, was aus ihr werden kann. Genau diese Wohnung bauen wir: renoviert, angepasst und eingerichtet, im 3D-Stadtplan von Madrid. Dein Kunde geht am Handy hindurch und vergleicht mehrere Vorschläge, bevor jemand einen Euro in die Baustelle gesteckt hat.',
    'held.ver': 'Beispiel ansehen', 'held.pedir': 'Wohnung bestellen', 'held.klein': 'Lieferung in fünf Arbeitstagen. Wir arbeiten mit zehn Büros in Madrid, nicht mehr.',
    'fall.vor': 'Echtes Beispiel', 'fall.titel': 'Dachgeschosswohnung in Almagro', 'fall.d1': 'Viertel', 'fall.d2': 'Fläche', 'fall.v2': '187 m² Bruttofläche, 34 m² Terrassen', 'fall.d3': 'Gebäude', 'fall.v3': '1930, Dachgeschoss, 3 Schlafzimmer', 'fall.d4': 'Auftrag', 'fall.v4': 'Zwei Umbauvorschläge, 3D-Modell',
    'modell.text': 'So sieht diese Wohnung fertig aus, obwohl der Umbau noch nicht begonnen hat: Wände, Einbauten, Küche und Möbel, in ihrem Haus und in ihrem Viertel. Durchgehen, die Decke abnehmen und die ganze Wohnung von oben sehen, Möbel ausblenden, oder in einem Satz sagen, was du sehen willst.',
    'modell.reiter': 'Wohnung in Almagro', 'modell.frage': 'Sag der Wohnung, was du sehen willst …', 'modell.diktat': 'Diktieren', 'modell.fehler': 'Modell konnte nicht geladen werden.',
    'chip.0': 'Geführter Rundgang', 'chip.1': 'Ohne Decke: die ganze Wohnung von oben', 'chip.7': 'Mit Dach: das Haus, wie es ist', 'chip.2': 'Möbel weg', 'chip.3': 'Nur die Architektur', 'chip.4': 'Zeig die Technik', 'chip.5': 'In den Salon', 'chip.6': 'Ohne die Stadt', 'chip.zurueck': 'Alles zurück',
    'modell.steuerung': 'Ziehen dreht · rechte Maustaste oder zwei Finger verschieben · Rad oder zwei Finger zoomen',
    'lief.vor': 'Was wir liefern', 'lief.titel': 'Der fertige Umbau, bevor der Umbau beginnt', 'lief.text': 'Für diese Wohnung liefern wir genau das. Alles kommt aus demselben Modell: Pläne, Bilder und 3D stimmen auf den Zentimeter überein, und jeder Vorschlag lässt sich mit dem anderen vergleichen.',
    'lief.1t': 'Umbauplan 1:50', 'lief.1': 'Aufteilung, Möblierung, Schränke, Installationen und Flächentabelle. Fertig für das Exposé und Ausgangspunkt für Planung und Bau.',
    'lief.2t': 'Vorschlag B: vier Schlafzimmer', 'lief.2': 'Dieselbe Wohnung, anders umgebaut. Gewählt wird zwischen Möglichkeiten, die man sieht, statt sie sich vorzustellen.',
    'lief.3t': 'Küche, offene Insel', 'lief.3': 'Virtuelles Bild aus dem Modell.', 'lief.4t': 'Salon', 'lief.4': 'Virtuelles Bild aus dem Modell.', 'lief.5t': 'Esszimmer zur Terrasse', 'lief.5': 'Virtuelles Bild aus dem Modell.',
    'lief.6t': 'Gedeckte Terrasse', 'lief.6': 'Virtuelles Bild aus dem Modell.', 'lief.7t': 'Hauptschlafzimmer', 'lief.7': 'Virtuelles Bild aus dem Modell.', 'lief.8t': 'Bad A', 'lief.8': 'Virtuelles Bild aus dem Modell.',
    'lief.hinweis': 'Alle Bilder sind als virtuelle Bilder gekennzeichnet, wie es die Immobilienwerbung verlangt. 3D, Pläne und Bilder stimmen überein, weil sie aus demselben Modell kommen.',
    'preis.vor': 'Preise', 'preis.titel': 'Eine Wohnung, ein Preis', 'preis.iva': '+ MwSt.',
    'preis.1t': 'Wohnung', 'preis.1a': 'Die renovierte Wohnung in 3D', 'preis.1b': 'Umbauplan 1:50', 'preis.1c': 'Sechs virtuelle Bilder', 'preis.1d': 'Link zum Begehen am Handy, 90 Tage',
    'preis.2t': 'Wohnung und Einrichtung', 'preis.2a': 'Alles aus Wohnung', 'preis.2b': 'Zwei Umbauvorschläge: Aufteilung, Materialien, Möbel', 'preis.2c': 'Pläne je Vorschlag', 'preis.2d': 'Zwölf virtuelle Bilder, zwei Einrichtungsstile',
    'preis.3t': 'Edition', 'preis.3a': 'Alles aus Wohnung und Einrichtung', 'preis.3b': 'Die Wohnung im 3D-Stadtplan von Madrid, mit geführtem Rundgang', 'preis.3c': 'Video 30 Sekunden, hoch und quer', 'preis.3d': 'Gedrucktes Exposé für die Besichtigung',
    'preis.mehr': '<b>Wird umgebaut?</b> Das Modell steht schon. Wir bauen auch 3D-Modelle nach Maß und zeichnen die Pläne des Projekts, vom Bestand bis zur Ausführung, für Maklerbüros, Bauträger und Eigentümer.', 'preis.satz': 'Büros: fünf Wohnungen im Monat für 24.000 € + MwSt., mit Vorrang bei der Lieferung. Nur zehn Büros in Madrid.',
    'wie.vor': 'So geht es', 'wie.titel': 'Fünf Arbeitstage',
    'wie.1t': 'Du schickst Plan und Adresse', 'wie.1': 'Der Plan aus dem Exposé, der von idealista oder eine Handskizze genügt. Ist er nicht maßstäblich, nennst du uns ein Maß.',
    'wie.2t': 'Wir bauen die Wohnung, vorher und nachher', 'wie.2': 'Mit Amphion, unserer eigenen Software: zuerst die Wohnung, wie sie heute ist, dann der Umbau mit Wänden, Einbauten, Küche, Bädern und Möbeln. Die Vorschläge entwirft unser Architekturteam.',
    'wie.3t': 'Wir liefern', 'wie.3': 'Pläne als PDF, Bilder für das Portal, den Link fürs Handy und auf Wunsch das Video. Dein Kunde sieht die fertige Wohnung und entscheidet.',
    'kon.titel': 'Hast du eine Wohnung, die noch nicht zeigt, was sie sein kann?', 'kon.text': 'Madrid. Wir antworten am selben Tag.',
    'fuss.app': 'Amphion, das Programm', 'fuss.datenschutz': 'Datenschutz',
  },
};
const SPRACHEN = ['es', 'en', 'de'];
const gewuenscht = new URLSearchParams(location.search).get('lang'), geraet = String(navigator.language || 'es').slice(0, 2).toLowerCase();
const lang = SPRACHEN.includes(gewuenscht) ? gewuenscht : SPRACHEN.includes(geraet) ? geraet : 'es';
document.documentElement.lang = lang;
const T = TEXTE[lang];
if (T) {
  for (const el of document.querySelectorAll('[data-i18n]')) { const v = T[el.dataset.i18n]; if (v == null) continue; if (el.tagName === 'META') el.content = v; else if (el.tagName === 'TITLE') el.textContent = v; else el.innerHTML = v; }
  for (const el of document.querySelectorAll('[data-i18n-ph]')) { const v = T[el.dataset.i18nPh]; if (v) el.placeholder = v; }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) { const v = T[el.dataset.i18nAria]; if (v) el.setAttribute('aria-label', v); }
}
window.formaZaehl = () => {};   // keine Besucherzählung auf dieser Seite
