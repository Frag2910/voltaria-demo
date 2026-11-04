/* ==========================================================================
   Voltaria – Livello di tracciamento (dataLayer GA4 Ecommerce)
   --------------------------------------------------------------------------
   Questo è l'UNICO file che scrive nel dataLayer: tutte le pagine chiamano
   le funzioni di DL.* e non fanno push per conto proprio. Serve a tenere in
   un solo posto la forma dei parametri, come si fa in un piano di misurazione.

   Regole seguite (specifiche ufficiali GA4 Ecommerce):
   1. window.dataLayer esiste PRIMA dello snippet di Google Tag Manager.
   2. Prima di ogni evento si fa push di { ecommerce: null }: azzera l'oggetto
      "ecommerce" precedente, altrimenti GTM leggerebbe dati vecchi rimasti in
      memoria (es. gli item della pagina prima) e li manderebbe insieme ai nuovi.
   3. L'array "items" usa i nomi di parametro previsti da GA4: item_id,
      item_name, item_brand, item_category, item_variant, price, quantity,
      index, item_list_id, item_list_name.
   4. "value" è sempre la somma di price * quantity degli item inviati,
      arrotondata a 2 decimali, con "currency" accanto.

   In GTM: variabile Data Layer "ecommerce" + trigger Evento personalizzato
   sul nome di ogni evento elencato nel README.
   ========================================================================== */

/* Deve stare in cima: GTM aggiunge a questo array, non lo ricrea. */
window.dataLayer = window.dataLayer || [];

/* Metti a true dalla console (VOLTARIA_DEBUG = true) per vedere i push nei log. */
var VOLTARIA_DEBUG = false;

var DL = (function () {
  'use strict';

  /* ---------- funzioni di supporto ---------- */

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  /* Trasforma un prodotto del catalogo in un "item" GA4.
     extra = parametri aggiuntivi di contesto (quantity, index, lista...). */
  function toItem(product, extra) {
    var item = {
      item_id: product.id,
      item_name: product.name,
      affiliation: VOLTARIA_AFFILIATION,
      item_brand: product.brand,
      item_category: product.category,
      item_variant: product.variant,
      price: round2(product.price),
      quantity: 1
    };
    if (extra) {
      for (var key in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, key)) item[key] = extra[key];
      }
    }
    return item;
  }

  /* Somma price * quantity di tutti gli item: è il "value" dell'evento. */
  function sumValue(items) {
    var total = 0;
    for (var i = 0; i < items.length; i++) {
      total += items[i].price * (items[i].quantity || 1);
    }
    return round2(total);
  }

  /* Converte le righe del carrello [{product, quantity}] in item GA4. */
  function cartToItems(lines) {
    return lines.map(function (line, i) {
      return toItem(line.product, { quantity: line.quantity, index: i });
    });
  }

  /* Il cuore del file: azzeramento + push dell'evento. */
  function push(eventName, ecommerce) {
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({ event: eventName, ecommerce: ecommerce });
    if (VOLTARIA_DEBUG && window.console) {
      console.log('[dataLayer] ' + eventName, ecommerce);
    }
  }

  /* ---------- eventi ecommerce GA4 ---------- */

  /* Elenco prodotti visualizzato (pagina categoria, vetrina in home). */
  function viewItemList(listId, listName, products) {
    var items = products.map(function (product, i) {
      return toItem(product, { index: i, item_list_id: listId, item_list_name: listName });
    });
    push('view_item_list', {
      item_list_id: listId,
      item_list_name: listName,
      items: items
    });
  }

  /* Clic su un prodotto dentro un elenco. */
  function selectItem(listId, listName, product, index) {
    push('select_item', {
      item_list_id: listId,
      item_list_name: listName,
      items: [toItem(product, { index: index, item_list_id: listId, item_list_name: listName })]
    });
  }

  /* Scheda prodotto aperta. */
  function viewItem(product) {
    var items = [toItem(product, { quantity: 1 })];
    push('view_item', {
      currency: VOLTARIA_CURRENCY,
      value: sumValue(items),
      items: items
    });
  }

  /* Aggiunta al carrello. */
  function addToCart(product, quantity) {
    var items = [toItem(product, { quantity: quantity })];
    push('add_to_cart', {
      currency: VOLTARIA_CURRENCY,
      value: sumValue(items),
      items: items
    });
  }

  /* Rimozione dal carrello: il "value" è il valore della parte rimossa. */
  function removeFromCart(product, quantity) {
    var items = [toItem(product, { quantity: quantity })];
    push('remove_from_cart', {
      currency: VOLTARIA_CURRENCY,
      value: sumValue(items),
      items: items
    });
  }

  /* Carrello visualizzato. */
  function viewCart(lines) {
    var items = cartToItems(lines);
    push('view_cart', {
      currency: VOLTARIA_CURRENCY,
      value: sumValue(items),
      items: items
    });
  }

  /* Inizio del checkout (passaggio 1). */
  function beginCheckout(lines, coupon) {
    var items = cartToItems(lines);
    var ecommerce = {
      currency: VOLTARIA_CURRENCY,
      value: sumValue(items),
      items: items
    };
    if (coupon) ecommerce.coupon = coupon;
    push('begin_checkout', ecommerce);
  }

  /* Metodo di spedizione scelto (passaggio 1 completato). */
  function addShippingInfo(lines, shippingTier) {
    var items = cartToItems(lines);
    push('add_shipping_info', {
      currency: VOLTARIA_CURRENCY,
      value: sumValue(items),
      shipping_tier: shippingTier,
      items: items
    });
  }

  /* Metodo di pagamento scelto (passaggio 2 completato). */
  function addPaymentInfo(lines, paymentType) {
    var items = cartToItems(lines);
    push('add_payment_info', {
      currency: VOLTARIA_CURRENCY,
      value: sumValue(items),
      payment_type: paymentType,
      items: items
    });
  }

  /* Ordine finto concluso. order contiene i totali calcolati alla conferma. */
  function purchase(order) {
    var items = cartToItems(order.lines);
    var ecommerce = {
      transaction_id: order.transactionId,
      affiliation: VOLTARIA_AFFILIATION,
      currency: VOLTARIA_CURRENCY,
      value: round2(order.total),
      tax: round2(order.tax),
      shipping: round2(order.shipping),
      items: items
    };
    /* Il codice sconto va inviato solo se c'e davvero: un parametro vuoto
       in GA4 crea una dimensione "(not set)" inutile nei report. */
    if (order.coupon) ecommerce.coupon = order.coupon;
    push('purchase', ecommerce);
  }

  /* Reso pubblico solo ciò che le pagine devono poter chiamare. */
  return {
    viewItemList: viewItemList,
    selectItem: selectItem,
    viewItem: viewItem,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    viewCart: viewCart,
    beginCheckout: beginCheckout,
    addShippingInfo: addShippingInfo,
    addPaymentInfo: addPaymentInfo,
    purchase: purchase
  };
})();
