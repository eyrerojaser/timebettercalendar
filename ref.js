/* Afiliadas de TIME: guarda 30 días el código de quien recomendó la app y lo pega en el enlace de compra de Stripe. */
(function () {
  var KEY = 'time-ref', DAYS = 30;
  function read() {
    try { var r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && /^[A-Z2-9]{8}$/.test(r.c) && Date.now() - r.t < DAYS * 864e5) return r.c; } catch (e) {}
    return '';
  }
  try {
    var m = /[?&]ref=([A-Za-z0-9]{8})(?:&|$)/.exec(location.search);
    if (m) {
      var code = m[1].toUpperCase();
      if (/^[A-Z2-9]{8}$/.test(code) && read() !== code) {
        localStorage.setItem(KEY, JSON.stringify({ c: code, t: Date.now() }));
        fetch('/api/affiliate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'click', code: code }), keepalive: true }).catch(function () {});
      }
    }
  } catch (e) {}
  window.timeRef = {
    code: read,
    buyUrl: function (url) {
      var c = read(); if (!c || !url || url.indexOf('buy.stripe.com') < 0 || /[?&]client_reference_id=/.test(url)) return url;
      return url + (url.indexOf('?') < 0 ? '?' : '&') + 'client_reference_id=aff_' + c;
    }
  };
})();
