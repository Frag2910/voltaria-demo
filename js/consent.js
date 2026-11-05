/* ==========================================================================
   Voltaria – Banner cookie e Consent Mode v2
   --------------------------------------------------------------------------
   Il blocco gtag('consent', 'default', ...) NON sta qui: sta nel <head> di
   ogni pagina, prima dello snippet GTM, perché deve essere la prima cosa che
   il browser esegue. Questo file si occupa solo di:
     - mostrare il banner alla prima visita;
     - comunicare la scelta a Google con gtag('consent', 'update', ...);
     - ricordarla nel localStorage;
     - riaprire il banner dal link "Preferenze cookie" nel footer.

   Due principi seguiti:
   1. Accettare e rifiutare costano lo stesso. I due pulsanti sono identici per
      dimensione, colore e peso: nessun "Rifiuta" grigio e minuscolo. Oltre a
      essere corretto, è ciò che chiede il GDPR: il consenso deve essere libero.
   2. Il consenso non blocca il sito. È una barra in fondo alla pagina, non una
      finestra modale: si può navigare, aggiungere al carrello e concludere
      l'ordine anche ignorandola. Chi rifiuta non perde nessuna funzione.

   Le categorie pubblicitarie (ad_storage, ad_user_data, ad_personalization)
   restano sempre "denied": questo sito non fa pubblicità e non profila nessuno,
   quindi non ha motivo di chiederlo.
   ========================================================================== */

var CONSENT_KEY = 'voltaria_consent';

var Consent = (function () {
  'use strict';

  /* ---------- memoria della scelta ---------- */

  function leggi() {
    try {
      return JSON.parse(window.localStorage.getItem(CONSENT_KEY));
    } catch (e) {
      return null;
    }
  }

  function salva(stato) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({
        analytics_storage: stato,
        /* La data serve a far scadere il consenso dopo un po': per legge va
           richiesto di nuovo, di solito dopo 6-12 mesi. */
        date: new Date().toISOString()
      }));
    } catch (e) {
      /* localStorage pieno o disattivato: la scelta vale per questa visita. */
    }
  }

  /* ---------- comunicazione a Google ---------- */

  /* Aggiorna solo analytics_storage. Le voci pubblicitarie non si toccano:
     restano "denied" come dichiarato nel default dentro il <head>. */
  function aggiorna(stato) {
    try {
      if (typeof gtag === 'function') {
        gtag('consent', 'update', { analytics_storage: stato });
      }
      /* Evento a disposizione di GTM: utile per attivare tag nel momento
         esatto in cui il consenso cambia. Non è un evento e-commerce,
         quindi nessun ecommerce: null. */
      window.dataLayer.push({ event: 'consent_update', consent_analytics: stato });
    } catch (e) {
      /* Il tracciamento non deve mai rompere la pagina: annoto e proseguo. */
      if (window.console) console.warn('[consenso] aggiornamento non riuscito:', e);
    }
  }

  /* ---------- banner ---------- */

  function html() {
    return '' +
      '<div class="cookie-banner">' +
        '<div class="cookie-banner__text">' +
          '<p><strong>Cookie statistici.</strong> Questo &egrave; un sito dimostrativo per un ' +
          'progetto portfolio e usa Google Analytics solo a fini statistici, per misurare ' +
          'la navigazione. Nessun cookie pubblicitario, nessuna profilazione. ' +
          'Puoi rifiutare senza perdere nessuna funzione del sito.</p>' +
        '</div>' +
        '<div class="cookie-banner__actions">' +
          '<button type="button" class="cookie-banner__btn" data-consenso="granted">Accetta statistici</button>' +
          '<button type="button" class="cookie-banner__btn" data-consenso="denied">Rifiuta</button>' +
        '</div>' +
      '</div>';
  }

  function mostra() {
    var slot = document.getElementById('cookie-banner-slot');
    if (!slot) return;
    slot.innerHTML = html();
    /* La classe sul body lascia spazio in fondo, così la barra non copre
       il piede pagina e il messaggino di conferma non ci finisce sotto. */
    document.body.classList.add('has-cookie-banner');
  }

  function nascondi() {
    var slot = document.getElementById('cookie-banner-slot');
    if (slot) slot.innerHTML = '';
    document.body.classList.remove('has-cookie-banner');
  }

  /* ---------- avvio ---------- */

  function scegli(stato) {
    salva(stato);
    aggiorna(stato);
    nascondi();
    if (typeof showToast === 'function') {
      showToast(stato === 'granted'
        ? 'Cookie statistici attivati'
        : 'Cookie statistici rifiutati');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* Prima visita: nessuna scelta in memoria, chiedo.
       Visite successive: il consenso salvato è già stato applicato nel <head>,
       quindi non mostro nulla e non interrompo la navigazione. */
    if (!leggi()) mostra();

    document.addEventListener('click', function (event) {
      var pulsante = event.target.closest('[data-consenso]');
      if (pulsante) {
        scegli(pulsante.getAttribute('data-consenso'));
        return;
      }

      /* Link "Preferenze cookie" nel footer: riapre il banner. */
      var preferenze = event.target.closest('[data-cookie-preferences]');
      if (preferenze) {
        event.preventDefault();
        mostra();
      }
    });
  });

  /* Reso pubblico per il footer, per i test e per la console del browser:
     Consent.leggi() mostra la scelta attuale, Consent.mostra() riapre il banner. */
  return {
    leggi: leggi,
    salva: salva,
    aggiorna: aggiorna,
    mostra: mostra,
    nascondi: nascondi,
    scegli: scegli
  };
})();
