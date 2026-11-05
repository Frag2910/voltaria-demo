# Voltaria – negozio dimostrativo per tracciamento GA4 + Google Tag Manager

Progetto portfolio per una candidatura come **Digital Analyst**.
È un piccolo e-commerce statico costruito da zero per avere un percorso di acquisto
completo su cui montare e documentare un impianto di misurazione **Google Analytics 4**
tramite **Google Tag Manager**.

> **Negozio dimostrativo.** *Voltaria* è un marchio di fantasia. Prodotti, prezzi e ordini
> sono inventati, nessun prodotto è in vendita, nessun pagamento viene elaborato e nessun
> dato personale viene raccolto o inviato. Un banner fisso lo dichiara su ogni pagina.

---

## Divisione dei ruoli

| Parte | Chi se ne occupa | Stato |
|---|---|---|
| Sito, catalogo, carrello, checkout | sviluppo | completato |
| `dataLayer` secondo le specifiche GA4 Ecommerce | sviluppo | completato |
| Contenitore GTM: variabili, trigger, tag GA4 | analista | da configurare |
| Banner cookie + Consent Mode | analista | spazio predisposto |

GA4 **non** è installato nel codice: nelle pagine c'è solo lo snippet di Google Tag Manager
con l'ID del contenitore `GTM-K27GBKKM`. Ogni tag va creato dentro il contenitore.

---

## Tecnologie

HTML, CSS e JavaScript "a mano", nessun framework e nessuna dipendenza da installare:
il codice del `dataLayer` deve restare leggibile a colpo d'occhio.
Il carrello vive nel `localStorage` del browser.

## Struttura dei file

```
├── index.html        Home con vetrina di 4 prodotti
├── categoria.html    Catalogo completo con filtri per categoria
├── prodotto.html     Scheda prodotto (legge ?id=CODICE-ARTICOLO)
├── carrello.html     Carrello salvato nel browser
├── checkout.html     Cassa finta in 3 passaggi (spedizione, pagamento, riepilogo)
├── conferma.html     Conferma ordine con ID transazione casuale
├── css/style.css     Foglio di stile unico
└── js/
    ├── products.js   Catalogo: 8 prodotti di fantasia
    ├── datalayer.js  UNICO file che scrive nel dataLayer (tutti gli eventi GA4)
    ├── cart.js       Carrello in localStorage, totali, IVA, ID transazione
    └── ui.js         Funzioni comuni dell'interfaccia
```

La logica specifica di ogni pagina sta in un blocco `<script>` in fondo alla pagina stessa,
così è immediato capire quali eventi partono dove.

---

## Il dataLayer

Tre regole seguite in tutto il progetto:

1. `window.dataLayer = window.dataLayer || []` è dichiarato **prima** dello snippet GTM.
2. **Prima di ogni evento** viene fatto `dataLayer.push({ ecommerce: null })`.
   Serve ad azzerare l'oggetto `ecommerce` precedente: senza questo passaggio GTM
   leggerebbe i dati rimasti in memoria dall'evento prima (per esempio gli `items` della
   pagina precedente) e li invierebbe insieme ai nuovi.
3. `value` è sempre la somma di `price × quantity` degli `items` inviati, arrotondata a
   2 decimali, accompagnata da `currency`.

Forma di ogni push:

```js
dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'add_to_cart',
  ecommerce: {
    currency: 'EUR',
    value: 298.00,
    items: [{
      item_id: 'VLT-AUR-001',
      item_name: 'Aura Buds Pro',
      affiliation: 'Voltaria Online Store',
      item_brand: 'Voltaria',
      item_category: 'Audio',
      item_variant: 'Nero Onice',
      price: 149.00,
      quantity: 2
    }]
  }
});
```

### Elenco degli eventi e-commerce

| # | Evento | Dove parte | Quando | Parametri oltre a `items` |
|---|---|---|---|---|
| 1 | `view_item_list` | `index.html`, `categoria.html` | al caricamento e ad ogni cambio di filtro | `item_list_id`, `item_list_name` |
| 2 | `select_item` | elenchi prodotti | clic su un prodotto dell'elenco | `item_list_id`, `item_list_name` |
| 3 | `view_item` | `prodotto.html` | apertura della scheda | `currency`, `value` |
| 4 | `add_to_cart` | elenchi, scheda, carrello | aggiunta o aumento di quantità | `currency`, `value` |
| 5 | `remove_from_cart` | `carrello.html` | rimozione o diminuzione di quantità | `currency`, `value` |
| 6 | `view_cart` | `carrello.html` | al caricamento, se il carrello non è vuoto | `currency`, `value` |
| 7 | `begin_checkout` | `checkout.html` | apertura del passaggio 1 | `currency`, `value` |
| 8 | `add_shipping_info` | `checkout.html` | passaggio 1 completato | `currency`, `value`, `shipping_tier` |
| 9 | `add_payment_info` | `checkout.html` | passaggio 2 completato | `currency`, `value`, `payment_type` |
| 10 | `purchase` | `conferma.html` | ordine finto concluso | `transaction_id`, `affiliation`, `currency`, `value`, `tax`, `shipping` |

Parametri dentro `items`: `item_id`, `item_name`, `affiliation`, `item_brand`,
`item_category`, `item_variant`, `price`, `quantity` e, negli elenchi, `index`,
`item_list_id`, `item_list_name`.

### Eventi personalizzati

Eventi fuori dalle specifiche e-commerce, per misurare l'interazione con la pagina.
Non riempiono l'oggetto `ecommerce`, quindi **non** sono preceduti da `ecommerce: null`:
quell'azzeramento serve solo a ripulire dati di prodotto rimasti in memoria, e qui non ce
ne sono. I parametri stanno al primo livello del push, non dentro un oggetto annidato.

| Evento | Dove parte | Quando | Parametri |
|---|---|---|---|
| `cta_click` | `index.html` | clic sul pulsante "Vedi il catalogo" nell'intestazione | `cta_text`, `cta_location` |

```js
dataLayer.push({
  event: 'cta_click',
  cta_text: 'Vedi il catalogo',
  cta_location: 'home_hero'
});
```

Due dettagli di attuazione:

- `cta_text` viene letto dal pulsante stesso. Se un giorno l'etichetta cambia, l'evento
  resta allineato a quello che l'utente ha davvero letto, senza interventi sul codice.
- il link viene trattenuto un istante perché il push avvenga **prima** del cambio pagina.
  Il pulsante è marcato nell'HTML con `data-cta` e `data-cta-location`: aggiungere altri
  pulsanti tracciati non richiede nuovo JavaScript, bastano i due attributi.

### Scelte di misurazione

- **Quantità modificata nel carrello**: l'evento viene inviato sulla *differenza*, non sul
  totale. Da 1 a 3 pezzi → `add_to_cart` con `quantity: 2`; da 3 a 1 → `remove_from_cart`
  con `quantity: 2`. Inviare il totale gonfierebbe i valori nei report.
- **`purchase` inviato una volta sola**: gli ID transazione già tracciati vengono salvati nel
  `localStorage`, così ricaricando la pagina di conferma l'evento non si duplica.
  È uno degli errori più frequenti nelle entrate GA4.
- **`value` di `purchase`** comprende la spedizione; `tax` è l'IVA al 22% scorporata dai
  prezzi, che nel catalogo sono già IVA inclusa.
- **`select_item` e cambio pagina**: il clic sul prodotto viene trattenuto un istante per
  far avvenire il push prima della navigazione. In GTM va comunque previsto l'invio con
  `sendBeacon` o l'opzione di attesa dei tag.
- **Niente evento al passaggio 3** del checkout: le specifiche GA4 non ne prevedono uno per
  il riepilogo. Se servisse misurare quel passaggio, si aggiungerebbe un evento
  personalizzato, non uno dell'elenco ufficiale.

---

## Cosa configurare in Google Tag Manager

1. Contenitore collegato: `GTM-K27GBKKM`, già inserito nel `<head>` e nel
   `<noscript>` di tutte e 6 le pagine.
2. Variabile **Data Layer** di nome `ecommerce`, versione 2.
3. Un trigger **Evento personalizzato** per ciascuno dei 10 eventi e-commerce.
4. Tag **GA4 Event** per ogni evento, con l'opzione "Invia dati e-commerce" impostata su
   *Data Layer*.
5. Tag di configurazione GA4 attivato su "Inizializzazione consenso" o "All Pages".
6. Per `cta_click`: due variabili **Data Layer** (`cta_text` e `cta_location`), un trigger
   **Evento personalizzato** sul nome `cta_click` e un tag **GA4 Event** che invia i due
   parametri. Qui l'opzione dei dati e-commerce va lasciata **disattivata**.

Per vedere i push nella console del browser: apri gli strumenti per sviluppatori, scrivi
`VOLTARIA_DEBUG = true` e naviga nel sito. Oppure scrivi `dataLayer` per vedere l'array.

## Spazio per il banner cookie (Consent Mode)

Predisposto, da riempire in un secondo momento:

- nel `<head>` di ogni pagina, un commento segna il punto dove va il blocco
  `gtag('consent', 'default', { ... 'denied' })`, **prima** dello snippet GTM;
- in fondo al `<body>`, il contenitore `<div id="cookie-banner-slot">` è vuoto e invisibile:
  lì andranno i pulsanti Accetta / Rifiuta / Personalizza, collegati a
  `gtag('consent', 'update', ...)`.

---

## Come aprire il sito in locale

Nella cartella del progetto:

```bash
python3 -m http.server 8000
```

Poi apri **http://localhost:8000** nel browser. Per fermare il server: `Ctrl+C`.

Un server locale (invece del doppio clic sui file) serve perché il sito usa indirizzi con
parametri e `localStorage`, e perché è la condizione in cui funzionano correttamente
l'anteprima di GTM e il debug di GA4.

## Nota sulla pubblicazione

Progetto non pubblicato online. Resta in locale finché non si decide dove ospitarlo.
