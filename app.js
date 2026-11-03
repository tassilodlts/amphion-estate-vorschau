// Amphion Estate (3.11.2026): Sprache nach Gerät (es zuerst), ?lang=es|en|de, Texte über data-i18n wie auf amphion3d.com.
const TEXTE = {
  es: null,   // Spanisch steht im HTML
  en: {
    'titel': 'Amphion Estate · Your home, built in 3D before you sell it', 'meta': 'For the best agencies in Madrid: the home in 3D inside the map of Madrid, plans, interior design proposals and renders, in five days.',
    'nav.ejemplo': 'Example', 'nav.entrega': 'What you get', 'nav.precios': 'Prices', 'nav.como': 'How it works', 'nav.kontakt': 'Order a home',
    'held.vor': 'Madrid · Ten agencies only', 'held.titel': 'Your home, built in 3D <em>before</em> you sell it.',
    'held.text': 'We build the home as it is and as it could be: inside the 3D map of Madrid, with plans, two interior design proposals and renders. The buyer walks through it on the phone before the first visit.',
    'held.ver': 'See the example', 'held.pedir': 'Order a home', 'held.klein': 'Delivered in five working days. We work with ten agencies in Madrid, no more.',
    'fall.vor': 'Real example', 'fall.titel': 'Penthouse in Almagro', 'fall.d1': 'Area', 'fall.d2': 'Size', 'fall.v2': '187 m² built, 34 m² of terraces', 'fall.d3': 'Building', 'fall.v3': '1930, penthouse, 3 bedrooms', 'fall.d4': 'Commission', 'fall.v4': 'Complete visualisation, 3D model',
    'modell.text': 'This is what the buyer receives: the whole home in 3D, in its neighbourhood, with its joinery, kitchen and furniture. Walk through it, cut it at plan height, remove the furniture, or just ask in a sentence.',
    'modell.reiter': 'Penthouse in Almagro', 'modell.frage': 'Tell the home what you want to see …', 'modell.diktat': 'Dictate', 'modell.fehler': 'The model could not be loaded.',
    'chip.0': 'Guided walk', 'chip.1': 'Cut it at 1.20 m, like the plan', 'chip.2': 'Remove the furniture', 'chip.3': 'Architecture only', 'chip.4': 'Show me the services', 'chip.5': 'Step into the living room', 'chip.6': 'Without the city', 'chip.zurueck': 'Everything back',
    'modell.steuerung': 'Drag to turn · right button or two fingers to pan · wheel or two fingers to zoom',
    'lief.vor': 'What you get', 'lief.titel': 'Everything the buyer needs to decide', 'lief.text': 'For this home we deliver exactly this. Every piece comes from the same model, which is why plans, images and 3D match to the centimetre.',
    'lief.1t': 'Floor plan 1:50', 'lief.1': 'With furniture, wardrobes, services and area table, ready for the dossier and for the buyer’s architect.',
    'lief.2t': 'Proposal B: four bedrooms', 'lief.2': 'A second way to live in the same flat, for the buyer who imagines something else.',
    'lief.3t': 'Kitchen, open island', 'lief.3': 'Virtual image from the model.', 'lief.4t': 'Living room', 'lief.4': 'Virtual image from the model.', 'lief.5t': 'Dining room towards the terrace', 'lief.5': 'Virtual image from the model.',
    'lief.6t': 'Covered terrace', 'lief.6': 'Virtual image from the model.', 'lief.7t': 'Master bedroom', 'lief.7': 'Virtual image from the model.', 'lief.8t': 'Bathroom A', 'lief.8': 'Virtual image from the model.',
    'lief.hinweis': 'All images are marked as virtual images, as real-estate advertising requires. 3D, plans and images match because they come from the same model.',
    'preis.vor': 'Prices', 'preis.titel': 'One home, one price', 'preis.iva': '+ VAT',
    'preis.1t': 'Home', 'preis.1a': 'The home in 3D, as it is', 'preis.1b': 'Floor plan 1:50', 'preis.1c': 'Six virtual images', 'preis.1d': 'Link to walk through it on the phone, 90 days',
    'preis.2t': 'Home and design', 'preis.2a': 'Everything in Home', 'preis.2b': 'Two interior design proposals: layout, materials, furniture', 'preis.2c': 'Plans for each proposal', 'preis.2d': 'Twelve virtual images, two interior styles',
    'preis.3t': 'Edition', 'preis.3a': 'Everything in Home and design', 'preis.3b': 'The home inside the 3D map of Madrid, with a guided walk', 'preis.3c': '30-second video, vertical and horizontal', 'preis.3d': 'Printed dossier for the viewing',
    'preis.satz': 'Agencies: five homes a month for €24,000 + VAT, with delivery priority. Ten agencies in Madrid only.',
    'wie.vor': 'How it works', 'wie.titel': 'Five working days',
    'wie.1t': 'You send us the plan and the address', 'wie.1': 'The dossier plan, the one from idealista or a hand sketch will do. If it is not to scale, you give us one measurement.',
    'wie.2t': 'We build the home', 'wie.2': 'With Amphion, our own software: walls, joinery, kitchen, bathrooms, furniture. Interior design proposals by our team.',
    'wie.3t': 'We deliver', 'wie.3': 'Plans as PDF, images for the portal, the link for the phone and, if you want, the video. And you sell.',
    'kon.titel': 'Do you have a home that deserves this?', 'kon.text': 'Madrid. We answer the same day.',
    'fuss.app': 'Amphion, the software', 'fuss.datenschutz': 'Privacy',
  },
  de: {
    'titel': 'Amphion Estate · Deine Wohnung, in 3D gebaut, bevor du sie verkaufst', 'meta': 'Für die besten Maklerbüros in Madrid: die Wohnung in 3D im Stadtplan von Madrid, Pläne, Einrichtungsvorschläge und Renderings, in fünf Tagen.',
    'nav.ejemplo': 'Beispiel', 'nav.entrega': 'Was wir liefern', 'nav.precios': 'Preise', 'nav.como': 'So geht es', 'nav.kontakt': 'Wohnung bestellen',
    'held.vor': 'Madrid · Nur zehn Büros', 'held.titel': 'Deine Wohnung, in 3D gebaut, <em>bevor</em> du sie verkaufst.',
    'held.text': 'Wir bauen die Wohnung, wie sie ist und wie sie sein könnte: im 3D-Stadtplan von Madrid, mit Plänen, zwei Einrichtungsvorschlägen und Renderings. Der Käufer geht am Handy hindurch, bevor er sie besichtigt.',
    'held.ver': 'Beispiel ansehen', 'held.pedir': 'Wohnung bestellen', 'held.klein': 'Lieferung in fünf Arbeitstagen. Wir arbeiten mit zehn Büros in Madrid, nicht mehr.',
    'fall.vor': 'Echtes Beispiel', 'fall.titel': 'Dachgeschosswohnung in Almagro', 'fall.d1': 'Viertel', 'fall.d2': 'Fläche', 'fall.v2': '187 m² Bruttofläche, 34 m² Terrassen', 'fall.d3': 'Gebäude', 'fall.v3': '1930, Dachgeschoss, 3 Schlafzimmer', 'fall.d4': 'Auftrag', 'fall.v4': 'Vollständige Visualisierung, 3D-Modell',
    'modell.text': 'Das bekommt der Käufer: die ganze Wohnung in 3D, in ihrem Viertel, mit Einbauten, Küche und Möbeln. Durchgehen, auf Planhöhe schneiden, Möbel ausblenden, oder einfach einen Satz schreiben.',
    'modell.reiter': 'Wohnung in Almagro', 'modell.frage': 'Sag der Wohnung, was du sehen willst …', 'modell.diktat': 'Diktieren', 'modell.fehler': 'Modell konnte nicht geladen werden.',
    'chip.0': 'Geführter Rundgang', 'chip.1': 'Bei 1,20 m schneiden, wie der Plan', 'chip.2': 'Möbel weg', 'chip.3': 'Nur die Architektur', 'chip.4': 'Zeig die Technik', 'chip.5': 'In den Salon', 'chip.6': 'Ohne die Stadt', 'chip.zurueck': 'Alles zurück',
    'modell.steuerung': 'Ziehen dreht · rechte Maustaste oder zwei Finger verschieben · Rad oder zwei Finger zoomen',
    'lief.vor': 'Was wir liefern', 'lief.titel': 'Alles, was der Käufer zur Entscheidung braucht', 'lief.text': 'Für diese Wohnung liefern wir genau das. Jedes Stück kommt aus demselben Modell, deshalb stimmen Pläne, Bilder und 3D auf den Zentimeter überein.',
    'lief.1t': 'Grundriss 1:50', 'lief.1': 'Mit Möblierung, Schränken, Installationen und Flächentabelle, fertig für das Exposé und den Architekten des Käufers.',
    'lief.2t': 'Vorschlag B: vier Schlafzimmer', 'lief.2': 'Eine zweite Art, dieselbe Wohnung zu bewohnen, für den Käufer, der sich etwas anderes vorstellt.',
    'lief.3t': 'Küche, offene Insel', 'lief.3': 'Virtuelles Bild aus dem Modell.', 'lief.4t': 'Salon', 'lief.4': 'Virtuelles Bild aus dem Modell.', 'lief.5t': 'Esszimmer zur Terrasse', 'lief.5': 'Virtuelles Bild aus dem Modell.',
    'lief.6t': 'Gedeckte Terrasse', 'lief.6': 'Virtuelles Bild aus dem Modell.', 'lief.7t': 'Hauptschlafzimmer', 'lief.7': 'Virtuelles Bild aus dem Modell.', 'lief.8t': 'Bad A', 'lief.8': 'Virtuelles Bild aus dem Modell.',
    'lief.hinweis': 'Alle Bilder sind als virtuelle Bilder gekennzeichnet, wie es die Immobilienwerbung verlangt. 3D, Pläne und Bilder stimmen überein, weil sie aus demselben Modell kommen.',
    'preis.vor': 'Preise', 'preis.titel': 'Eine Wohnung, ein Preis', 'preis.iva': '+ MwSt.',
    'preis.1t': 'Wohnung', 'preis.1a': 'Die Wohnung in 3D, wie sie ist', 'preis.1b': 'Grundriss 1:50', 'preis.1c': 'Sechs virtuelle Bilder', 'preis.1d': 'Link zum Begehen am Handy, 90 Tage',
    'preis.2t': 'Wohnung und Einrichtung', 'preis.2a': 'Alles aus Wohnung', 'preis.2b': 'Zwei Einrichtungsvorschläge: Aufteilung, Materialien, Möbel', 'preis.2c': 'Pläne je Vorschlag', 'preis.2d': 'Zwölf virtuelle Bilder, zwei Einrichtungsstile',
    'preis.3t': 'Edition', 'preis.3a': 'Alles aus Wohnung und Einrichtung', 'preis.3b': 'Die Wohnung im 3D-Stadtplan von Madrid, mit geführtem Rundgang', 'preis.3c': 'Video 30 Sekunden, hoch und quer', 'preis.3d': 'Gedrucktes Exposé für die Besichtigung',
    'preis.satz': 'Büros: fünf Wohnungen im Monat für 24.000 € + MwSt., mit Vorrang bei der Lieferung. Nur zehn Büros in Madrid.',
    'wie.vor': 'So geht es', 'wie.titel': 'Fünf Arbeitstage',
    'wie.1t': 'Du schickst Plan und Adresse', 'wie.1': 'Der Plan aus dem Exposé, der von idealista oder eine Handskizze genügt. Ist er nicht maßstäblich, nennst du uns ein Maß.',
    'wie.2t': 'Wir bauen die Wohnung', 'wie.2': 'Mit Amphion, unserer eigenen Software: Wände, Einbauten, Küche, Bäder, Möbel. Die Einrichtungsvorschläge aus unserem Team.',
    'wie.3t': 'Wir liefern', 'wie.3': 'Pläne als PDF, Bilder für das Portal, den Link fürs Handy und auf Wunsch das Video. Und du verkaufst.',
    'kon.titel': 'Hast du eine Wohnung, die das verdient?', 'kon.text': 'Madrid. Wir antworten am selben Tag.',
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
