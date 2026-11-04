/* ==========================================================================
   Voltaria – Catalogo prodotti (dati di fantasia)
   --------------------------------------------------------------------------
   Nessun prodotto, marchio o prezzo reale: tutto inventato per il progetto.
   Questo file è la "fonte di verità" usata sia dalle pagine sia dal dataLayer,
   così i parametri degli eventi GA4 corrispondono sempre a ciò che si vede.
   ========================================================================== */

var VOLTARIA_CURRENCY = 'EUR';
var VOLTARIA_AFFILIATION = 'Voltaria Online Store';

var PRODUCTS = [
  {
    id: 'VLT-AUR-001',
    name: 'Aura Buds Pro',
    brand: 'Voltaria',
    category: 'Audio',
    variant: 'Nero Onice',
    price: 149.00,
    glyph: '🎧',
    tagline: 'Auricolari con cancellazione del rumore adattiva',
    description: 'Auricolari in-ear con cancellazione attiva del rumore, 32 ore di autonomia con la custodia e ricarica wireless. Prodotto dimostrativo, non in vendita.',
    specs: ['Cancellazione attiva adattiva', 'Autonomia 8h + 24h custodia', 'Bluetooth 5.4', 'Resistenza IPX5']
  },
  {
    id: 'VLT-NMB-014',
    name: 'Nimbus 14',
    brand: 'Voltaria',
    category: 'Computer',
    variant: '16 GB / 512 GB',
    price: 1299.00,
    glyph: '💻',
    tagline: 'Portatile ultraleggero da 14 pollici',
    description: 'Scocca in alluminio riciclato da 1,1 kg, display 14" 2.8K a 120 Hz e autonomia dichiarata di 18 ore. Prodotto dimostrativo, non in vendita.',
    specs: ['Display 14" 2.8K 120 Hz', '16 GB RAM / 512 GB SSD', 'Peso 1,1 kg', '2x USB-C Thunderbolt']
  },
  {
    id: 'VLT-PLS-003',
    name: 'Pulse Band 3',
    brand: 'Voltaria',
    category: 'Indossabili',
    variant: 'Cinturino Grafite',
    price: 229.00,
    glyph: '⌚',
    tagline: 'Smartwatch con rilevamento del sonno',
    description: 'Cassa in titanio da 42 mm, GPS doppia frequenza, 40 modalità di allenamento e 10 giorni di autonomia. Prodotto dimostrativo, non in vendita.',
    specs: ['Cassa titanio 42 mm', 'GPS doppia frequenza', 'Autonomia 10 giorni', 'Impermeabile 10 ATM']
  },
  {
    id: 'VLT-ORB-360',
    name: 'Orbit 360',
    brand: 'Voltaria',
    category: 'Audio',
    variant: 'Sabbia',
    price: 189.50,
    glyph: '🔊',
    tagline: 'Diffusore portatile a 360 gradi',
    description: 'Diffusore Bluetooth con emissione circolare, 24 ore di riproduzione e certificazione IP67 per uso esterno. Prodotto dimostrativo, non in vendita.',
    specs: ['Audio 360°', 'Autonomia 24 ore', 'Certificazione IP67', 'Abbinamento stereo multiplo']
  },
  {
    id: 'VLT-LMN-27Q',
    name: 'Lumen 27Q',
    brand: 'Voltaria',
    category: 'Monitor',
    variant: '27" QHD 165 Hz',
    price: 399.00,
    glyph: '🖥️',
    tagline: 'Monitor QHD per lavoro e gioco',
    description: 'Pannello IPS 27" 2560x1440 a 165 Hz, copertura sRGB 99% e hub USB-C con erogazione da 90 W. Prodotto dimostrativo, non in vendita.',
    specs: ['IPS 27" 2560x1440', 'Frequenza 165 Hz', 'USB-C 90 W', 'Supporto regolabile in altezza']
  },
  {
    id: 'VLT-KNT-002',
    name: 'Kinetic K2',
    brand: 'Voltaria',
    category: 'Accessori',
    variant: 'Switch tattili',
    price: 119.00,
    glyph: '⌨️',
    tagline: 'Tastiera meccanica wireless 75%',
    description: 'Layout 75% con switch sostituibili a caldo, struttura in alluminio e tripla connettività. Prodotto dimostrativo, non in vendita.',
    specs: ['Layout 75% italiano', 'Switch sostituibili a caldo', 'Bluetooth / 2.4G / USB-C', 'Retroilluminazione RGB']
  },
  {
    id: 'VLT-VST-4K',
    name: 'Vista Cam 4K',
    brand: 'Voltaria',
    category: 'Accessori',
    variant: 'Con treppiede',
    price: 99.00,
    glyph: '📷',
    tagline: 'Webcam 4K con inquadratura automatica',
    description: 'Sensore 4K a 30 fps, inquadratura automatica del soggetto, due microfoni con riduzione del rumore e copriobiettivo fisico. Prodotto dimostrativo, non in vendita.',
    specs: ['Risoluzione 4K 30 fps', 'Inquadratura automatica', 'Doppio microfono', 'Copriobiettivo fisico']
  },
  {
    id: 'VLT-CRE-20K',
    name: 'Core 20K',
    brand: 'Voltaria',
    category: 'Accessori',
    variant: '20.000 mAh',
    price: 69.90,
    glyph: '🔋',
    tagline: 'Batteria esterna da ricarica rapida',
    description: 'Batteria esterna da 20.000 mAh con uscita da 100 W, schermo con percentuale residua e cavo USB-C integrato. Prodotto dimostrativo, non in vendita.',
    specs: ['Capacità 20.000 mAh', 'Uscita massima 100 W', 'Display percentuale', 'Cavo USB-C integrato']
  }
];

/* Cerca un prodotto per codice articolo. Restituisce null se non esiste. */
function getProductById(id) {
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id === id) return PRODUCTS[i];
  }
  return null;
}

/* Formatta un numero come prezzo in euro, es. 149 -> "149,00 €" */
function formatPrice(amount) {
  return amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}
