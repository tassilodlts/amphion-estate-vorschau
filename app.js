// Amphion Estate (3.11.2026, Umbau 4.11. für den Wunschkunden): Sprache nach Gerät (es zuerst), ?lang=es|en|de, Texte über data-i18n,
// Vorher/Nachher-Regler, Anfrageformular (öffnet das Mailprogramm mit den Angaben), WhatsApp und Telefon aus window.AMPHION_KONTAKT.
const TEXTE = {
  es: null,   // Spanisch steht im HTML
  en: {
    'titel': 'Amphion Estate · Sell the finished home before the works begin', 'meta': 'For agencies in Madrid: the flat that needs work is sold as the finished home, before any works begin. Your buyer walks through it in 3D, with plans and images, and sees themselves living there. In five days.',
    'nav.ejemplo': 'Example', 'nav.entrega': 'What you get', 'nav.precios': 'Prices', 'nav.fragen': 'Questions', 'nav.kontakt': 'Let’s talk',
    'held.vor': 'Madrid · Flats to renovate', 'held.titel': 'Sell the finished home, <em>before</em> the works begin.',
    'held.text': 'Your buyer does not want a building site: they want their home. We show it to them finished, in 3D, with plans, in its real building in Madrid, so they can walk through it and picture living there. Without touching the flat. In five days.',
    'held.ver': 'See the 3D example', 'held.pedir': 'Ask for a proposal', 'held.klein': 'Only ten agencies in Madrid. We answer the same day.',
    'vgl.links': '3D model', 'vgl.rechts': 'Final image', 'vgl.aria': 'Compare',
    'vort.1t': 'You sell a dream, not a building site', 'vort.1': 'The buyer walks through their future home, finished, and stops taking the works off the price.',
    'vort.2t': 'We help buyers picture it', 'vort.2': 'Hardly anyone can read a plan or see past the current state. Here they do not have to: they open doors, walk into every room, look at the neighbourhood.',
    'vort.3t': 'Before the first works', 'vort.3': 'Not a euro on works to sell. Just a plan and the address.',
    'fall.vor': 'Real example', 'fall.titel': 'Penthouse in Almagro: finished before the works', 'fall.d1': 'Area', 'fall.d2': 'Size', 'fall.v2': '187 m² built, 34 m² of terraces', 'fall.d3': 'Building', 'fall.v3': '1930, penthouse, 3 bedrooms', 'fall.d4': 'Brief', 'fall.v4': 'Two renovation proposals, 3D model',
    'modell.text': 'This is the link your buyer receives: their future home, already finished. Walk through it, open doors, wardrobes and windows, or lift the roof off.',
    'modell.reiter': 'Penthouse in Almagro', 'modell.mehr': 'More views and questions to the home', 'modell.frage': 'For example: show me the kitchen …', 'modell.diktat': 'Dictate', 'modell.fehler': 'The model could not be loaded.',
    'chip.0': 'Guided walk', 'chip.1': 'No ceiling: the whole home from above', 'chip.7': 'With the roof: the building as it is', 'chip.2': 'Remove the furniture', 'chip.8': 'The neighbourhood: what is nearby', 'bar.vor': 'The neighbourhood', 'bar.titel': 'Everything on foot from the door', 'bar.lead': 'Tap a point: you will see the name, the address and the walk from the front door, with real minutes.', 'bar.quelle': 'Data: Catastro, © OpenStreetMap. Times at 80 m per minute along streets and pavements.', 'chip.3': 'Architecture only', 'chip.4': 'Show me the services', 'chip.5': 'Step into the living room', 'chip.6': 'Without the city', 'chip.zurueck': 'Everything back',
    'modell.steuerung': 'Drag to turn · two fingers to pan and zoom',
    'vgl.vor': 'Room by room', 'vgl.titel': 'Same viewpoint, same model', 'vgl.text': 'Slide: on the left the 3D model, on the right the final image. They match to the pixel because they come from the same model, so what your buyer sees is what can be built.',
    'vgl.k1': 'Kitchen', 'vgl.k2': 'Bathroom', 'vgl.k3': 'Terrace', 'vgl.k4': 'Sitting room', 'vgl.foto': 'Do you have photos of the current state? We use them with the same framing and the slider compares today and after the renovation.',
    'lief.vor': 'What you get', 'lief.titel': 'Everything to sell the finished home before the works',
    'lief.l1': '<b>3D link with your agency’s logo</b> to send by WhatsApp or put in the listing.', 'lief.l2': '<b>Renovation plan 1:50</b> with furniture and areas, ready for the dossier.',
    'lief.l3': '<b>Images for the portal</b>, marked as virtual images.', 'lief.l4': '<b>Two proposals</b> for the buyer who imagines something else.', 'lief.l5': '<b>The neighbourhood in 3D</b>: metro, schools, parks and supermarkets, with real walking minutes from the front door.',
    'lief.1t': 'Renovation plan 1:50', 'lief.1': 'Layout, furniture, wardrobes, services and areas.', 'lief.2t': 'Proposal B: four bedrooms', 'lief.2': 'The same home, renovated another way.',
    'lief.3t': 'Kitchen, open island', 'lief.4t': 'Living room', 'lief.5t': 'Dining room towards the terrace', 'lief.6t': 'Covered terrace', 'lief.7t': 'Master bedroom', 'lief.8t': 'Bathroom',
    'lief.hinweis': 'Virtual images from the model, marked as such on the portals.', 'preis.vor': 'Prices', 'preis.titel': 'Price depending on the home', 'preis.lead': 'A 50 m² flat is not a 500 m² one. Tell us size, condition and deadline, and we give you the price within a day.', 'preis.anfrage': 'Ask for a price for my home', 'preis.iva': '+ VAT', 'preis.zahl': 'Paid by the agency or the owner, as you prefer. 50 % on order, 50 % on delivery.', 'preis.satz': 'Agencies: monthly rate for several homes, with delivery priority. Ten agencies in Madrid only.',
    'preis.mehr': '<b>Is the renovation going ahead?</b> The model already exists: we also do the project and the construction plans.',
    'wie.vor': 'How it works', 'wie.titel': 'Five working days',
    'wie.1t': 'You send us the address and a plan', 'wie.1': 'The one from the listing or a hand sketch will do. Photos of the current state are even better.',
    'wie.2t': 'We design and build the home', 'wie.2': 'Real measurements, real materials, in its own building in Madrid. Not an image generator.',
    'wie.3t': 'You receive link, plans and images', 'wie.3': 'Ready for the listing, the buyer’s WhatsApp and the viewing.',
    'faq.vor': 'Frequent questions', 'faq.titel': 'What agencies ask us',
    'faq.1q': 'Who pays?', 'faq.1a': 'The agency or the owner; we invoice whoever places the order. 50 % on order and 50 % on delivery.',
    'faq.2q': 'Is it legal to advertise with virtual images?', 'faq.2a': 'Yes. All of them are marked as virtual images, as the portals and real-estate advertising require.',
    'faq.3q': 'What do you need from me?', 'faq.3a': 'The address and a plan (the one from the listing will do). With photos of the current state the result is even better.',
    'faq.4q': 'Can I add my agency’s logo?', 'faq.4a': 'Yes. The 3D link carries your brand and you can send it to your clients or add it to the listing.',
    'faq.5q': 'Does it work on a phone?', 'faq.5a': 'Yes. The buyer opens the link on the phone, without installing anything.',
    'faq.6q': 'And if the buyer wants to renovate?', 'faq.6a': 'The model and the plans are the basis for the project. If they want, we do it.',
    'kon.titel': 'Do you have a flat that needs work? Sell it finished.', 'kon.text': 'Send us the address and within a day we tell you how to show the finished home.',
    'kon.f1': 'Address of the home', 'kon.f2': 'Your name and agency', 'kon.f3': 'Phone or email', 'kon.f4': 'By when?', 'kon.senden': 'Send the request', 'kon.plano': 'Your email opens with the details; attach the plan if you have it.',
    'kon.wa': 'WhatsApp', 'kon.tel': 'Call',
    'fuss.datenschutz': 'Privacy',
  },
  de: {
    'titel': 'Amphion Estate · Die fertige Wohnung verkaufen, bevor die Baustelle beginnt', 'meta': 'Für Maklerbüros in Madrid: Die Wohnung vor der Renovierung wird als fertiges Zuhause verkauft, bevor die Baustelle beginnt. Käufer gehen in 3D hindurch, mit Plänen und Bildern, und sehen sich darin wohnen. In fünf Tagen.',
    'nav.ejemplo': 'Beispiel', 'nav.entrega': 'Was du bekommst', 'nav.precios': 'Preise', 'nav.fragen': 'Fragen', 'nav.kontakt': 'Kontakt',
    'held.vor': 'Madrid · Wohnungen vor der Renovierung', 'held.titel': 'Die fertige Wohnung verkaufen, <em>bevor</em> die Baustelle beginnt.',
    'held.text': 'Käufer wollen keine Baustelle, sondern ihr Zuhause. Wir zeigen es fertig, in 3D, mit Plänen, im echten Haus in Madrid, damit sie hindurchgehen und sich darin wohnen sehen. Ohne die Wohnung anzufassen. In fünf Tagen.',
    'held.ver': 'Beispiel in 3D ansehen', 'held.pedir': 'Angebot anfragen', 'held.klein': 'Nur zehn Büros in Madrid. Wir antworten am selben Tag.',
    'vgl.links': '3D-Modell', 'vgl.rechts': 'Endbild', 'vgl.aria': 'Vergleichen',
    'vort.1t': 'Ein Traum statt einer Baustelle', 'vort.1': 'Käufer gehen durch ihr fertiges Zuhause und ziehen den Umbau nicht mehr vom Preis ab.',
    'vort.2t': 'Wir helfen beim Vorstellen', 'vort.2': 'Kaum jemand kann einen Plan lesen oder über den heutigen Zustand hinwegsehen. Hier müssen sie das nicht: Türen öffnen, in jedes Zimmer gehen, das Viertel ansehen.',
    'vort.3t': 'Vor der ersten Baustelle', 'vort.3': 'Kein Euro in den Umbau, um zu verkaufen. Nur ein Plan und die Adresse.',
    'fall.vor': 'Echtes Beispiel', 'fall.titel': 'Dachgeschoss in Almagro: fertig vor dem Umbau', 'fall.d1': 'Viertel', 'fall.d2': 'Fläche', 'fall.v2': '187 m² Bruttofläche, 34 m² Terrassen', 'fall.d3': 'Gebäude', 'fall.v3': '1930, Dachgeschoss, 3 Schlafzimmer', 'fall.d4': 'Auftrag', 'fall.v4': 'Zwei Umbauvorschläge, 3D-Modell',
    'modell.text': 'Diesen Link bekommen deine Käufer: ihr künftiges Zuhause, schon fertig. Hindurchgehen, Türen, Schränke und Fenster öffnen oder das Dach abnehmen.',
    'modell.reiter': 'Wohnung in Almagro', 'modell.mehr': 'Weitere Ansichten und Fragen an die Wohnung', 'modell.frage': 'Zum Beispiel: Zeig mir die Küche …', 'modell.diktat': 'Diktieren', 'modell.fehler': 'Modell konnte nicht geladen werden.',
    'chip.0': 'Geführter Rundgang', 'chip.1': 'Ohne Decke: die ganze Wohnung von oben', 'chip.7': 'Mit Dach: das Haus, wie es ist', 'chip.2': 'Möbel weg', 'chip.8': 'Das Viertel: was in der Nähe ist', 'bar.vor': 'Das Viertel', 'bar.titel': 'Alles zu Fuß ab der Haustür', 'bar.lead': 'Tippen Sie auf einen Punkt: Name, Adresse und der Fußweg ab der Haustür, mit echten Minuten.', 'bar.quelle': 'Daten: Catastro, © OpenStreetMap. Gehzeiten mit 80 m pro Minute über Straßen und Gehwege.', 'chip.3': 'Nur die Architektur', 'chip.4': 'Zeig die Technik', 'chip.5': 'In den Salon', 'chip.6': 'Ohne die Stadt', 'chip.zurueck': 'Alles zurück',
    'modell.steuerung': 'Ziehen dreht · zwei Finger verschieben und zoomen',
    'vgl.vor': 'Raum für Raum', 'vgl.titel': 'Gleicher Blick, gleiches Modell', 'vgl.text': 'Schieben: links das 3D-Modell, rechts das Endbild. Sie decken sich pixelgenau, weil sie aus demselben Modell kommen. Was dein Käufer sieht, lässt sich so bauen.',
    'vgl.k1': 'Küche', 'vgl.k2': 'Bad', 'vgl.k3': 'Terrasse', 'vgl.k4': 'Wohnzimmer', 'vgl.foto': 'Hast du Fotos vom heutigen Zustand? Wir nutzen sie mit demselben Ausschnitt, dann vergleicht der Regler heute und nach dem Umbau.',
    'lief.vor': 'Was du bekommst', 'lief.titel': 'Alles, um die fertige Wohnung vor dem Umbau zu verkaufen',
    'lief.l1': '<b>3D-Link mit dem Logo deines Büros</b> für WhatsApp oder die Anzeige.', 'lief.l2': '<b>Umbauplan 1:50</b> mit Möbeln und Flächen, fertig fürs Exposé.',
    'lief.l3': '<b>Bilder für das Portal</b>, als virtuelle Bilder gekennzeichnet.', 'lief.l4': '<b>Zwei Vorschläge</b> für den Käufer, der sich etwas anderes vorstellt.', 'lief.l5': '<b>Das Viertel in 3D</b>: Metro, Schulen, Parks und Supermärkte, mit echten Gehminuten ab der Haustür.',
    'lief.1t': 'Umbauplan 1:50', 'lief.1': 'Aufteilung, Möbel, Schränke, Installationen und Flächen.', 'lief.2t': 'Vorschlag B: vier Schlafzimmer', 'lief.2': 'Dieselbe Wohnung, anders umgebaut.',
    'lief.3t': 'Küche, offene Insel', 'lief.4t': 'Salon', 'lief.5t': 'Esszimmer zur Terrasse', 'lief.6t': 'Gedeckte Terrasse', 'lief.7t': 'Hauptschlafzimmer', 'lief.8t': 'Bad',
    'lief.hinweis': 'Virtuelle Bilder aus dem Modell, in den Portalen als solche gekennzeichnet.', 'preis.vor': 'Preise', 'preis.titel': 'Preis je nach Wohnung', 'preis.lead': 'Eine Wohnung mit 50 m² ist keine mit 500 m². Nenn uns Fläche, Zustand und Termin, und du hast den Preis in einem Tag.', 'preis.anfrage': 'Preis für meine Wohnung anfragen', 'preis.iva': '+ MwSt.', 'preis.zahl': 'Bezahlt vom Büro oder vom Eigentümer, wie du willst. 50 % bei Auftrag, 50 % bei Lieferung.', 'preis.satz': 'Büros: Monatstarif für mehrere Wohnungen, mit Vorrang bei der Lieferung. Nur zehn Büros in Madrid.',
    'preis.mehr': '<b>Wird umgebaut?</b> Das Modell steht schon: Wir machen auch das Projekt und die Ausführungspläne.',
    'wie.vor': 'So geht es', 'wie.titel': 'Fünf Arbeitstage',
    'wie.1t': 'Du schickst Adresse und Plan', 'wie.1': 'Der aus der Anzeige oder eine Handskizze genügt. Fotos vom heutigen Zustand sind noch besser.',
    'wie.2t': 'Wir entwerfen und bauen die Wohnung', 'wie.2': 'Echte Maße, echte Materialien, in ihrem Haus in Madrid. Kein Bildgenerator.',
    'wie.3t': 'Du bekommst Link, Pläne und Bilder', 'wie.3': 'Fertig für die Anzeige, das WhatsApp des Käufers und die Besichtigung.',
    'faq.vor': 'Häufige Fragen', 'faq.titel': 'Was Maklerbüros uns fragen',
    'faq.1q': 'Wer bezahlt?', 'faq.1a': 'Das Büro oder der Eigentümer; wir stellen dem Auftraggeber die Rechnung. 50 % bei Auftrag und 50 % bei Lieferung.',
    'faq.2q': 'Darf man mit virtuellen Bildern werben?', 'faq.2a': 'Ja. Alle sind als virtuelle Bilder gekennzeichnet, wie es die Portale und die Immobilienwerbung verlangen.',
    'faq.3q': 'Was braucht ihr von mir?', 'faq.3a': 'Die Adresse und einen Plan (der aus der Anzeige genügt). Mit Fotos vom heutigen Zustand wird es noch besser.',
    'faq.4q': 'Kann mein Logo drauf?', 'faq.4a': 'Ja. Der 3D-Link trägt deine Marke, du kannst ihn Kunden schicken oder in die Anzeige setzen.',
    'faq.5q': 'Funktioniert es am Handy?', 'faq.5a': 'Ja. Der Käufer öffnet den Link am Handy, ohne etwas zu installieren.',
    'faq.6q': 'Und wenn der Käufer umbauen will?', 'faq.6a': 'Modell und Pläne sind die Grundlage für sein Projekt. Wenn er will, machen wir es.',
    'kon.titel': 'Hast du eine Wohnung vor der Renovierung? Verkauf sie fertig.', 'kon.text': 'Schick uns die Adresse, und wir sagen dir in einem Tag, wie sich das fertige Zuhause zeigen lässt.',
    'kon.f1': 'Adresse der Wohnung', 'kon.f2': 'Dein Name und Büro', 'kon.f3': 'Telefon oder E-Mail', 'kon.f4': 'Bis wann?', 'kon.senden': 'Anfrage senden', 'kon.plano': 'Dein E-Mail-Programm öffnet sich mit den Angaben; häng den Plan an, wenn du ihn hast.',
    'kon.wa': 'WhatsApp', 'kon.tel': 'Anrufen',
    'fuss.datenschutz': 'Datenschutz',
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
for (const a of document.querySelectorAll('.sprachen a')) a.classList.toggle('on', a.dataset.lang === lang);
window.formaZaehl = () => {};   // keine Besucherzählung auf dieser Seite

// Vorher/Nachher-Regler: unsichtbares Schiebefeld über beiden Bildern setzt --p (Breite des oberen Bildes)
for (const v of document.querySelectorAll('[data-vergleich]')) {
  const r = v.querySelector('input'), setze = () => v.style.setProperty('--p', r.value + '%');
  r.addEventListener('input', setze); setze();
}

// Kontakt: WhatsApp und Telefon nur, wenn hinterlegt (window.AMPHION_KONTAKT); Formular öffnet das Mailprogramm mit den Angaben
const K = window.AMPHION_KONTAKT || {};
const anrede = { es: 'Hola, me interesa Amphion Estate para una vivienda.', en: 'Hello, I am interested in Amphion Estate for a home.', de: 'Hallo, ich interessiere mich für Amphion Estate für eine Wohnung.' }[lang];
if (K.whatsapp) for (const a of document.querySelectorAll('.wa, .wa-fest')) { a.href = 'https://wa.me/' + K.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent(anrede); a.target = '_blank'; a.rel = 'noopener'; a.hidden = false; }
if (K.telefon) for (const a of document.querySelectorAll('.tel')) { a.href = 'tel:' + K.telefon.replace(/[^\d+]/g, ''); a.hidden = false; }
const formular = document.querySelector('.anfrage');
formular?.addEventListener('submit', e => {
  e.preventDefault(); const f = new FormData(formular), z = [anrede, ''];
  for (const el of formular.querySelectorAll('label')) { const n = el.querySelector('input').name; if (f.get(n)) z.push(el.querySelector('span').textContent + ': ' + f.get(n)); }
  location.href = 'mailto:' + (K.email || 'hello@amphion3d.com') + '?subject=' + encodeURIComponent('Amphion Estate · ' + (f.get('direccion') || '')) + '&body=' + encodeURIComponent(z.join('\n'));
});
