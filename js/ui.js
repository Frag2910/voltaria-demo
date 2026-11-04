/* ==========================================================================
   Voltaria – Funzioni comuni dell'interfaccia
   --------------------------------------------------------------------------
   Qui c'è solo "come si disegna la pagina". Gli eventi di tracciamento
   vengono richiesti chiamando DL.* , mai scritti a mano nel dataLayer.
   ========================================================================== */

/* Legge un parametro dall'indirizzo, es. prodotto.html?id=VLT-AUR-001 */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* Aggiorna il numerino accanto a "Carrello" nell'intestazione. */
function updateCartCount() {
  var badges = document.querySelectorAll('[data-cart-count]');
  var count = Cart.count();
  for (var i = 0; i < badges.length; i++) {
    badges[i].textContent = count;
    badges[i].hidden = count === 0;
  }
}

/* HTML di una scheda prodotto dentro un elenco. */
function productCardHTML(product, index) {
  return '' +
    '<article class="card" data-product-id="' + product.id + '" data-index="' + index + '">' +
      '<a class="card__media" href="prodotto.html?id=' + encodeURIComponent(product.id) + '" data-select-item>' +
        '<span aria-hidden="true">' + product.glyph + '</span>' +
      '</a>' +
      '<div class="card__body">' +
        '<p class="card__category">' + product.category + '</p>' +
        '<h3 class="card__title">' +
          '<a href="prodotto.html?id=' + encodeURIComponent(product.id) + '" data-select-item>' +
            product.brand + ' ' + product.name +
          '</a>' +
        '</h3>' +
        '<p class="card__tagline">' + product.tagline + '</p>' +
        '<p class="card__price">' + formatPrice(product.price) + '</p>' +
        '<button type="button" class="btn btn--small" data-add-to-cart>Aggiungi al carrello</button>' +
      '</div>' +
    '</article>';
}

/* Disegna un elenco di prodotti e collega gli eventi select_item e add_to_cart.
   listId / listName finiscono nei parametri item_list_id e item_list_name. */
function renderProductList(container, products, listId, listName) {
  container.innerHTML = products.map(function (product, i) {
    return productCardHTML(product, i);
  }).join('');

  container.addEventListener('click', function (event) {
    var card = event.target.closest('[data-product-id]');
    if (!card) return;
    var product = getProductById(card.getAttribute('data-product-id'));
    var index = parseInt(card.getAttribute('data-index'), 10);
    if (!product) return;

    /* Clic sul prodotto -> select_item, poi si apre la scheda.
       Blocco il link per un istante così il push avviene prima di cambiare
       pagina: è il motivo per cui in GTM il tag select_item va impostato
       con "Attendi i tag" oppure con invio tramite sendBeacon. */
    var link = event.target.closest('[data-select-item]');
    if (link) {
      event.preventDefault();
      DL.selectItem(listId, listName, product, index);
      window.location.href = link.getAttribute('href');
      return;
    }

    /* Clic su "Aggiungi al carrello" -> add_to_cart */
    if (event.target.closest('[data-add-to-cart]')) {
      Cart.add(product.id, 1);
      DL.addToCart(product, 1);
      showToast(product.brand + ' ' + product.name + ' aggiunto al carrello');
    }
  });
}

/* Messaggino temporaneo di conferma in basso a destra. */
function showToast(message) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(function () {
    toast.classList.remove('is-visible');
  }, 2600);
}

/* Avvio comune a tutte le pagine. */
document.addEventListener('DOMContentLoaded', function () {
  updateCartCount();

  /* Evidenzia la voce di menu della pagina corrente. */
  var current = window.location.pathname.split('/').pop() || 'index.html';
  var links = document.querySelectorAll('.site-nav a');
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute('href') === current) links[i].classList.add('is-current');
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});

/* Il carrello cambia -> aggiorno il contatore. */
document.addEventListener('voltaria:cart-updated', updateCartCount);
