/* ==========================================================================
   Voltaria – Carrello e ordine (salvati in localStorage)
   --------------------------------------------------------------------------
   Nel localStorage salvo solo codici articolo e quantità: nessun dato
   personale, nessuna chiamata di rete. Il browser è l'unico "server".

   Chiavi usate:
     voltaria_cart    -> righe del carrello: [{ id, quantity }]
     voltaria_order   -> ordine finto in attesa di conferma
     voltaria_tracked -> ID transazioni per cui l'evento purchase è già partito
   ========================================================================== */

var CART_KEY = 'voltaria_cart';
var ORDER_KEY = 'voltaria_order';
var TRACKED_KEY = 'voltaria_tracked';

/* Aliquota IVA italiana: i prezzi del catalogo sono già IVA inclusa,
   quindi l'imposta si "scorpora" dal prezzo invece di aggiungersi. */
var VAT_RATE = 0.22;

/* Metodi di spedizione: la chiave diventa shipping_tier in GA4. */
var SHIPPING_OPTIONS = [
  { tier: 'Standard', label: 'Standard – 3/5 giorni lavorativi', cost: 0 },
  { tier: 'Express', label: 'Express – entro 24 ore', cost: 9.90 },
  { tier: 'Ritiro in negozio', label: 'Ritiro in negozio – gratuito', cost: 0 }
];

/* Metodi di pagamento: la chiave diventa payment_type in GA4. */
var PAYMENT_OPTIONS = [
  { type: 'Carta di credito', label: 'Carta di credito (dimostrativa)' },
  { type: 'PayPal', label: 'Portafoglio digitale (dimostrativo)' },
  { type: 'Bonifico', label: 'Bonifico bancario (dimostrativo)' }
];

var Cart = (function () {
  'use strict';

  /* Legge il carrello dal localStorage. Se è rovinato o assente, torna vuoto. */
  function read() {
    try {
      var raw = window.localStorage.getItem(CART_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function write(rows) {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(rows));
    } catch (e) {
      /* localStorage pieno o disattivato: il sito continua a funzionare. */
    }
    document.dispatchEvent(new CustomEvent('voltaria:cart-updated'));
  }

  /* Righe complete: unisce le quantità salvate ai dati del catalogo.
     Scarta i codici che non esistono più (catalogo cambiato). */
  function lines() {
    return read()
      .map(function (row) {
        var product = getProductById(row.id);
        return product ? { product: product, quantity: row.quantity } : null;
      })
      .filter(function (line) { return line !== null && line.quantity > 0; });
  }

  function add(id, quantity) {
    var rows = read();
    var qty = quantity || 1;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) {
        rows[i].quantity += qty;
        write(rows);
        return;
      }
    }
    rows.push({ id: id, quantity: qty });
    write(rows);
  }

  function setQuantity(id, quantity) {
    if (quantity <= 0) { remove(id); return; }
    var rows = read().map(function (row) {
      if (row.id === id) row.quantity = quantity;
      return row;
    });
    write(rows);
  }

  function remove(id) {
    write(read().filter(function (row) { return row.id !== id; }));
  }

  function clear() {
    write([]);
  }

  /* Numero totale di pezzi, per il contatore nell'intestazione. */
  function count() {
    return read().reduce(function (total, row) { return total + row.quantity; }, 0);
  }

  function subtotal() {
    return lines().reduce(function (total, line) {
      return total + line.product.price * line.quantity;
    }, 0);
  }

  function isEmpty() {
    return lines().length === 0;
  }

  return {
    lines: lines,
    add: add,
    setQuantity: setQuantity,
    remove: remove,
    clear: clear,
    count: count,
    subtotal: subtotal,
    isEmpty: isEmpty
  };
})();

var Order = (function () {
  'use strict';

  function round2(n) { return Math.round(n * 100) / 100; }

  /* Calcola i totali dell'ordine a partire dal costo di spedizione scelto.
     tax = IVA già compresa nei prezzi, scorporata per il parametro GA4. */
  function totals(shippingCost) {
    var sub = Cart.subtotal();
    var shipping = shippingCost || 0;
    var tax = sub - (sub / (1 + VAT_RATE));
    return {
      subtotal: round2(sub),
      shipping: round2(shipping),
      tax: round2(tax),
      total: round2(sub + shipping)
    };
  }

  /* ID transazione casuale: prefisso + base36 del momento + 4 cifre casuali.
     È finto, serve solo a rendere unico l'evento purchase. */
  function newTransactionId() {
    var stamp = Date.now().toString(36).toUpperCase();
    var random = Math.floor(1000 + Math.random() * 9000);
    return 'VLT-' + stamp + '-' + random;
  }

  function save(order) {
    try {
      window.localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch (e) { /* ignorato: progetto dimostrativo */ }
  }

  function read() {
    try {
      var raw = window.localStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try { window.localStorage.removeItem(ORDER_KEY); } catch (e) {}
  }

  /* Evita di inviare due volte purchase se si ricarica la pagina di conferma:
     un errore classico che gonfia le entrate in GA4. */
  function alreadyTracked(transactionId) {
    try {
      var raw = window.localStorage.getItem(TRACKED_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return list.indexOf(transactionId) !== -1;
    } catch (e) {
      return false;
    }
  }

  function markTracked(transactionId) {
    try {
      var raw = window.localStorage.getItem(TRACKED_KEY);
      var list = raw ? JSON.parse(raw) : [];
      list.push(transactionId);
      window.localStorage.setItem(TRACKED_KEY, JSON.stringify(list.slice(-20)));
    } catch (e) {}
  }

  return {
    totals: totals,
    newTransactionId: newTransactionId,
    save: save,
    read: read,
    clear: clear,
    alreadyTracked: alreadyTracked,
    markTracked: markTracked
  };
})();
