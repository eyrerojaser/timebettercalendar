// Licencias de TIME: un código único por compra.
//
// Cómo se crea el código (cualquiera de estas dos vías, sin duplicar):
//  A) Webhook de Stripe (/api/stripe-webhook): Stripe avisa al servidor cuando alguien paga.
//     Es la vía principal: queda guardado aunque la persona cierre la página después de pagar.
//  B) La página de gracias (a=redeem): la persona vuelve de Stripe con ?session_id=… y se le muestra su código.
// Las dos usan ensureLicense(), que crea UN solo código por compra.
//
// Reembolsos: cuando Stripe avisa de un reembolso total (charge.refunded) o de una disputa, el código se desactiva solo.
// Compras anteriores: desde el panel, "Sincronizar con Stripe" importa las compras que no se guardaron.
// Recuperar código: la persona pone su correo y se le envía el código (a=recover).
//
// La llave de Stripe (STRIPE_SECRET_KEY) y el secreto del webhook (STRIPE_WEBHOOK_SECRET) viven solo en las variables de Netlify.

export const MAX_DEVICES = 4;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';      // sin 0/O/1/I para no confundir al escribir
const SESSION_OK = /^cs_(live|test)_[A-Za-z0-9]{10,250}$/;
const DEVICE_OK = /^[A-Za-z0-9_-]{8,64}$/;
const CODE_OK = /^[A-Z2-9]{12}$/;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_FAILS = 10;
const LOCK_MS = 15 * 60 * 1000;
const WEBHOOK_TOLERANCE_S = 5 * 60;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const safeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};
const ipOf = (req) => req.headers.get('x-nf-client-connection-ip') || req.headers.get('client-ip') || 'sin-ip';
const clean = (s, n) => String(s || '').trim().slice(0, n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
export const prettyCode = (c) => c.replace(/(.{4})(?=.)/g, '$1-');
export const normalizeCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '').replace(/0/g, '').replace(/1/g, '').replace(/I/g, '');

// Cuenta intentos por IP (o por otra clave); devuelve false si ya se pasó del límite.
async function failGate(store, req, now, bucket, add, max = MAX_FAILS, lockMs = LOCK_MS, who) {
  const key = `rl:${bucket}:${who || await sha256(ipOf(req))}`;
  const rec = (await store.get(key, { type: 'json' })) || { fails: 0, until: 0 };
  if (rec.until > now) return false;
  if (add) {
    rec.fails++;
    if (rec.fails >= max) { rec.until = now + lockMs; rec.fails = 0; }
    await store.setJSON(key, rec);
  }
  return true;
}

/* ---------------- Stripe ---------------- */
async function stripeGet(path, deps) {
  const key = deps.env('STRIPE_SECRET_KEY');
  if (!key) return { error: 'not_configured' };
  const res = await deps.fetch(`https://api.stripe.com/v1/${path}`, { headers: { authorization: `Bearer ${key}` } });
  if (res.status === 404 || res.status === 400) return { error: 'unknown' };
  if (!res.ok) return { error: 'stripe_error', status: res.status };
  return { data: await res.json() };
}
async function stripeSession(id, deps) {
  const r = await stripeGet(`checkout/sessions/${encodeURIComponent(id)}`, deps);
  if (r.error === 'unknown') return { error: 'unknown_session' };
  if (r.error) return { error: r.error };
  return { session: r.data };
}

const isPaidPayment = (s) => s && s.mode === 'payment' && s.payment_status === 'paid';
const rightProduct = (s, deps) => { const p = deps.env('STRIPE_PAYMENT_LINK'); return !p || s.payment_link === p; };

/* ---------------- Crear / buscar licencias ---------------- */
async function addToIndex(store, code) {
  const idx = (await store.get('index', { type: 'json' })) || { codes: [] };
  if (!idx.codes.includes(code)) { idx.codes.push(code); await store.setJSON('index', idx); }
}
async function addEmailIndex(store, email, code) {
  if (!email) return;
  const key = `email:${await sha256(email)}`;
  const rec = (await store.get(key, { type: 'json' })) || { codes: [] };
  if (!rec.codes.includes(code)) { rec.codes.push(code); await store.setJSON(key, rec); }
}

// Crea (una sola vez por compra) el código de una sesión de Stripe ya pagada. Devuelve { code, rec, created }.
export async function ensureLicense(store, session, now, opts = {}) {
  const sid = opts.sid || session.id;
  const existing = await store.get(`sess:${sid}`, { type: 'json' });
  if (existing) return { ...(await waitRecord(store, existing.code)), created: false };

  const code = makeCode();
  const claim = await store.setJSON(`sess:${sid}`, { code }, { onlyIfNew: true });   // evita códigos dobles si llegan dos avisos a la vez
  if (claim && claim.modified === false) {
    const again = await store.get(`sess:${sid}`, { type: 'json' });
    return { ...(await waitRecord(store, again.code)), created: false };
  }
  const cd = session.customer_details || {};
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent && session.payment_intent.id) || '';
  const rec = {
    code, session: sid, paymentIntent: pi,
    name: clean(cd.name, 100), email: clean(cd.email || session.customer_email, 160).toLowerCase(),
    amount: session.amount_total, currency: session.currency,
    created: session.created ? session.created * 1000 : now,            // fecha real de la compra (la que da Stripe)
    devices: [], revoked: !!opts.revoked, status: opts.revoked ? (opts.status || 'revoked') : 'active'
  };
  if (opts.revoked) rec.revokedAt = now;
  await store.setJSON(`code:${code}`, rec);
  if (pi) await store.setJSON(`pi:${pi}`, { code });
  await addToIndex(store, code);
  await addEmailIndex(store, rec.email, code);
  return { code, rec, created: true };
}
async function waitRecord(store, code) {                                  // por si otro aviso todavía está escribiendo el registro
  for (let i = 0; i < 6; i++) {
    const rec = await store.get(`code:${code}`, { type: 'json' });
    if (rec) return { code, rec };
    await sleep(150);
  }
  return { code, rec: null };
}

async function revokeByPaymentIntent(store, pi, status, now) {
  if (!pi) return false;
  const ref = await store.get(`pi:${pi}`, { type: 'json' });
  if (!ref) return false;
  const rec = await store.get(`code:${ref.code}`, { type: 'json' });
  if (!rec) return false;
  rec.revoked = true; rec.status = status; rec.revokedAt = now;
  await store.setJSON(`code:${ref.code}`, rec);
  return true;
}

/* ---------------- Webhook de Stripe ---------------- */
export async function handleWebhook(req, store, deps) {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const secret = deps.env('STRIPE_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'not_configured' }, 503);
  const now = deps.now ? deps.now() : Date.now();
  const payload = await req.text();
  const header = req.headers.get('stripe-signature') || '';
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=')).filter((p) => p.length === 2));
  const t = Number(parts.t);
  if (!t || Math.abs(now / 1000 - t) > WEBHOOK_TOLERANCE_S) return json({ error: 'bad_signature' }, 400);
  const expected = await hmacHex(secret, `${t}.${payload}`);
  const sigs = header.split(',').map((p) => p.trim()).filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!sigs.some((s) => safeEqual(s, expected))) return json({ error: 'bad_signature' }, 400);

  let event; try { event = JSON.parse(payload); } catch { return json({ error: 'bad_json' }, 400); }
  const obj = event && event.data && event.data.object;
  try { await store.setJSON('meta:webhook', { at: now, type: String(event && event.type || '').slice(0, 80) }); } catch (e) {}
  if (!obj) return json({ ok: true });

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      if (isPaidPayment(obj) && rightProduct(obj, deps)) await ensureLicense(store, obj, now);
      break;
    case 'charge.refunded':
      if (obj.refunded === true || (obj.amount && obj.amount_refunded >= obj.amount)) await revokeByPaymentIntent(store, obj.payment_intent, 'refunded', now);
      break;
    case 'charge.dispute.created':
      await revokeByPaymentIntent(store, obj.payment_intent, 'dispute', now);
      break;
    default: break;
  }
  return json({ ok: true });
}

/* ---------------- Sincronizar compras pasadas desde Stripe ---------------- */
async function syncFromStripe(store, deps, now) {
  const out = { imported: 0, already: 0, skipped: 0, refunded: 0, unchecked: 0 };
  let after = '';
  for (let page = 0; page < 5; page++) {                                   // hasta 500 compras
    const r = await stripeGet(`checkout/sessions?limit=100${after ? `&starting_after=${after}` : ''}`, deps);
    if (r.error === 'not_configured') return { error: 'not_configured' };
    if (r.error) return { error: r.error };
    const list = r.data.data || [];
    for (const s of list) {
      if (!isPaidPayment(s) || !rightProduct(s, deps)) { out.skipped++; continue; }
      if (await store.get(`sess:${s.id}`, { type: 'json' })) { out.already++; continue; }
      let refunded = false;
      const pi = typeof s.payment_intent === 'string' ? s.payment_intent : (s.payment_intent && s.payment_intent.id);
      if (pi) {
        const p = await stripeGet(`payment_intents/${encodeURIComponent(pi)}?expand[]=latest_charge`, deps);
        if (p.data && p.data.latest_charge && typeof p.data.latest_charge === 'object') refunded = p.data.latest_charge.refunded === true;
        else out.unchecked++;                                                // la llave no puede ver reembolsos: se avisa
      }
      await ensureLicense(store, s, now, refunded ? { revoked: true, status: 'refunded' } : {});
      out.imported++; if (refunded) out.refunded++;
    }
    if (!r.data.has_more || !list.length) break;
    after = list[list.length - 1].id;
  }
  return out;
}


/* ---------------- Diagnóstico de la conexión con Stripe (para el panel) ---------------- */
async function diagnose(store, deps, origin) {
  const d = {
    stripeKey: !!deps.env('STRIPE_SECRET_KEY'), webhookSecret: !!deps.env('STRIPE_WEBHOOK_SECRET'),
    buyUrl: !!deps.env('BUY_URL'), mail: !!(deps.mailConfigured && deps.mailConfigured()),
    expectedRedirect: `${origin}/gracias.html?session_id={CHECKOUT_SESSION_ID}`, redirect: 'unknown', redirectUrl: '',
    lastWebhook: await store.get('meta:webhook', { type: 'json' }).catch(() => null),
    lastRedeem: await store.get('meta:redeem', { type: 'json' }).catch(() => null)
  };
  const link = deps.env('STRIPE_PAYMENT_LINK');
  if (d.stripeKey && link) {
    const r = await stripeGet(`payment_links/${encodeURIComponent(link)}`, deps);
    const ac = r.data && r.data.after_completion;
    if (ac) {
      const url = ac.type === 'redirect' && ac.redirect ? String(ac.redirect.url || '') : '';
      d.redirectUrl = url;
      d.redirect = !url ? 'no_redirect' : (/\/gracias\.html\?session_id=\{CHECKOUT_SESSION_ID\}\s*$/.test(url) && url.startsWith(origin) ? 'ok' : 'wrong');
    }
  }
  return d;
}

/* ---------------- Correo de recuperación ---------------- */
function recoveryMail(codes, lang, origin) {
  const en = lang === 'en';
  const list = codes.map(prettyCode);
  const subject = en ? 'Your TIME · Better Calendar code' : 'Tu código de TIME · Better Calendar';
  const intro = en ? 'Here is your purchase code for TIME · Better Calendar:' : 'Este es tu código de compra de TIME · Better Calendar:';
  const how = en
    ? 'Open the app, enter this code once and you are in. It works on up to 4 devices. If you did not ask for this email, you can ignore it.'
    : 'Abre la app, escribe este código una vez y listo. Funciona en hasta 4 dispositivos. Si tú no pediste este correo, puedes ignorarlo.';
  const link = origin ? `${origin}/?code=${codes[0]}` : '';
  const linkTxt = en ? 'Or open this link to activate it automatically:' : 'O abre este enlace para activarla automáticamente:';
  const text = `${intro}\n\n${list.join('\n')}\n\n${how}${link ? `\n\n${linkTxt}\n${link}` : ''}\n\nEyre Digital Studio`;
  const html = `<div style="font-family:Arial,sans-serif;color:#3A2A22;max-width:480px"><p>${intro}</p>${list.map((c) => `<p style="font:700 24px monospace;letter-spacing:2px;background:#FCF3EC;border:2px dashed #8C3520;padding:14px;text-align:center;color:#8C3520">${c}</p>`).join('')}<p>${how}</p>${link ? `<p>${linkTxt}<br><a href="${link}">${link}</a></p>` : ''}<p style="color:#8A7367">Eyre Digital Studio</p></div>`;
  return { subject, text, html };
}

/* ---------------- Entrada principal ---------------- */
export async function handleLicense(req, store, deps) {
  const url = new URL(req.url);
  const now = deps.now ? deps.now() : Date.now();
  const a = url.searchParams.get('a') || '';

  // ---------- Panel (admin) ----------
  if (url.searchParams.get('admin') === '1') {
    const cfg = await deps.adminStore.get('admin-cfg', { type: 'json' });
    if (!cfg) return json({ error: 'no_admin' }, 401);
    if (!(await failGate(store, req, now, 'adm', false))) return json({ error: 'locked' }, 423);
    if ((await sha256(req.headers.get('x-admin-key') || '')) !== cfg.hash) {
      await failGate(store, req, now, 'adm', true);
      return json({ error: 'wrong_password' }, 401);
    }
    if (req.method === 'GET') {
      const idx = (await store.get('index', { type: 'json' })) || { codes: [] };
      const list = [];
      for (const c of idx.codes) {
        const r = await store.get(`code:${c}`, { type: 'json' });
        if (r) list.push({
          code: prettyCode(c), name: r.name, email: r.email, created: r.created, devices: (r.devices || []).length,
          revoked: !!r.revoked, status: r.revoked ? (r.status && r.status !== 'active' ? r.status : 'revoked') : 'active',
          amount: r.amount, currency: r.currency
        });
      }
      list.sort((x, y) => y.created - x.created);
      return json({ ok: true, purchases: list, webhook: !!deps.env('STRIPE_WEBHOOK_SECRET'), mail: !!(deps.mailConfigured && deps.mailConfigured()), diag: await diagnose(store, deps, url.origin) });
    }
    if (req.method === 'POST') {
      let body; try { body = JSON.parse(await req.text()); } catch { return json({ error: 'bad_json' }, 400); }
      if (body && body.action === 'sync') {
        const res = await syncFromStripe(store, deps, now);
        if (res.error) return json({ error: res.error }, res.error === 'not_configured' ? 503 : 502);
        return json({ ok: true, ...res });
      }
      const code = normalizeCode(body && body.code);
      const rec = CODE_OK.test(code) ? await store.get(`code:${code}`, { type: 'json' }) : null;
      if (!rec) return json({ error: 'not_found' }, 404);
      if (body.action === 'revoke') { rec.revoked = true; rec.status = 'revoked'; rec.revokedAt = now; }
      else if (body.action === 'restore') { rec.revoked = false; rec.status = 'active'; delete rec.revokedAt; }
      else if (body.action === 'reset_devices') rec.devices = [];
      else return json({ error: 'bad_action' }, 400);
      await store.setJSON(`code:${code}`, rec);
      return json({ ok: true });
    }
    return json({ error: 'method_not_allowed' }, 405);
  }

  // ---------- Público ----------
  if (a === 'info' && req.method === 'GET') {
    return json({ ok: true, buyUrl: deps.env('BUY_URL') || '', ready: !!deps.env('STRIPE_SECRET_KEY') });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const text = await req.text();
  if (text.length > 4000) return json({ error: 'too_large' }, 413);
  let body; try { body = JSON.parse(text); } catch { return json({ error: 'bad_json' }, 400); }

  if (a === 'redeem') {
    const sid = clean(body && body.session_id, 300);
    if (!SESSION_OK.test(sid)) return json({ error: 'bad_session' }, 400);
    if (!(await failGate(store, req, now, 'red', false))) return json({ error: 'too_many_requests' }, 429);

    const existing = await store.get(`sess:${sid}`, { type: 'json' });
    if (existing) {
      const { rec } = await waitRecord(store, existing.code);
      return json({ ok: true, code: prettyCode(existing.code), name: rec && rec.name, email: rec && rec.email });
    }
    const { session, error } = await stripeSession(sid, deps);
    if (error === 'not_configured') return json({ error }, 503);
    if (error === 'unknown_session') { await failGate(store, req, now, 'red', true); return json({ error }, 404); }
    if (error) return json({ error }, 502);
    if (!isPaidPayment(session)) return json({ error: 'not_paid' }, 402);
    if (!rightProduct(session, deps)) return json({ error: 'wrong_product' }, 403);
    const { code, rec } = await ensureLicense(store, session, now, { sid });
    try { await store.setJSON('meta:redeem', { at: now }); } catch (e) {}
    return json({ ok: true, code: prettyCode(code), name: rec && rec.name, email: rec && rec.email });
  }

  if (a === 'activate') {
    const code = normalizeCode(body && body.code);
    const device = clean(body && body.device, 64);
    if (!DEVICE_OK.test(device)) return json({ error: 'bad_device' }, 400);
    if (!(await failGate(store, req, now, 'act', false))) return json({ error: 'too_many_requests' }, 429);
    const rec = CODE_OK.test(code) ? await store.get(`code:${code}`, { type: 'json' }) : null;
    if (!rec) { await failGate(store, req, now, 'act', true); return json({ error: 'invalid_code' }, 404); }
    if (rec.revoked) return json({ error: 'revoked' }, 403);
    rec.devices = rec.devices || [];
    if (!rec.devices.includes(device)) {
      if (rec.devices.length >= MAX_DEVICES) return json({ error: 'too_many_devices', max: MAX_DEVICES }, 409);
      rec.devices.push(device);
      await store.setJSON(`code:${code}`, rec);
    }
    return json({ ok: true, name: rec.name });
  }

  if (a === 'recover') {
    const email = clean(body && body.email, 160).toLowerCase();
    const lang = body && body.lang === 'en' ? 'en' : 'es';
    if (!EMAIL_OK.test(email)) return json({ error: 'bad_email' }, 400);
    if (!deps.sendMail || !(deps.mailConfigured && deps.mailConfigured())) return json({ error: 'mail_not_configured' }, 503);
    // Límites: por IP (5 pedidos por hora) y por correo (3 por hora), para que nadie pueda llenar de correos a otra persona.
    if (!(await failGate(store, req, now, 'rec-ip', true, 5, 3600e3))) return json({ error: 'too_many_requests' }, 429);
    if (!(await failGate(store, req, now, 'rec-mail', true, 3, 3600e3, await sha256(email)))) return json({ ok: true });
    const ref = await store.get(`email:${await sha256(email)}`, { type: 'json' });
    const codes = [];
    const cand = new Set((ref && ref.codes) || []);
    if (!cand.size) {                                                       // compras guardadas antes de existir el índice de correos
      const idx = (await store.get('index', { type: 'json' })) || { codes: [] };
      for (const c of idx.codes) { const r = await store.get(`code:${c}`, { type: 'json' }); if (r && r.email === email) { cand.add(c); await addEmailIndex(store, email, c); } }
    }
    for (const c of cand) {
      const r = await store.get(`code:${c}`, { type: 'json' });
      if (r && !r.revoked) codes.push(c);
    }
    if (codes.length) {
      try { await deps.sendMail({ to: email, ...recoveryMail(codes.slice(0, 3), lang, url.origin) }); }
      catch (e) { return json({ error: 'mail_failed' }, 502); }
    }
    return json({ ok: true });                                              // misma respuesta exista o no la compra
  }

  return json({ error: 'bad_action' }, 400);
}
