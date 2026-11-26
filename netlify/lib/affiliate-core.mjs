// Programa de afiliadas de TIME.
//
// Cómo funciona (todo automático):
//  1. La persona se registra en /afiliados.html (nombre + correo). Le llega un correo con su enlace personal y su panel privado.
//  2. Comparte su enlace:  https://TU-SITIO/r/CODIGO   (el código queda guardado 30 días en el navegador de quien lo abre).
//  3. Cuando esa persona compra, el botón de compra agrega  client_reference_id=aff_CODIGO  al enlace de pago de Stripe.
//  4. El webhook de Stripe (el mismo de las licencias) registra la comisión: $5 pendientes.
//  5. Pasados los días de garantía (7 por defecto), una función diaria hace la transferencia a la cuenta de Stripe de la afiliada.
//     Si hubo reembolso o disputa antes, la comisión se cancela sola.
//
// Pagos: Stripe Connect (cuentas "Express"). Cada afiliada abre su cuenta de pago con Stripe una sola vez desde su panel.
// Variables de Netlify:
//   STRIPE_CONNECT_KEY       llave restringida de Stripe con permiso de ESCRITURA en Connect (cuentas y enlaces) y Transferencias
//   AFFILIATE_AMOUNT_CENTS   (opcional) comisión en centavos, 500 = $5
//   AFFILIATE_HOLD_DAYS      (opcional) días de espera antes de pagar, 7 por defecto (0 = pagar de inmediato)

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_OK = /^[A-Z2-9]{8}$/;
const TOKEN_OK = /^[a-f0-9]{48}$/;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DAY = 24 * 60 * 60 * 1000;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const clean = (s, n) => String(s || '').trim().slice(0, n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ipOf = (req) => req.headers.get('x-nf-client-connection-ip') || req.headers.get('client-ip') || 'sin-ip';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const randomCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => ALPHABET[b % ALPHABET.length]).join('');
const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');

export const commissionCents = (deps) => { const n = Number(deps.env('AFFILIATE_AMOUNT_CENTS')); return Number.isFinite(n) && n >= 100 && n <= 100000 ? Math.round(n) : 500; };
export const holdDays = (deps) => { const raw = deps.env('AFFILIATE_HOLD_DAYS'); const n = raw === undefined || raw === '' || raw === null ? 7 : Number(raw); return Number.isFinite(n) && n >= 0 && n <= 60 ? n : 7; };
const money = (cents, cur = 'usd') => `${cur.toLowerCase() === 'usd' ? '$' : cur.toUpperCase() + ' '}${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;

// Limita intentos por IP (por hora) para que nadie llene el sistema de registros.
async function allow(store, req, bucket, max, now, windowMs = 60 * 60 * 1000) {
  const key = `rl:${bucket}:${await sha256(ipOf(req))}`;
  const rec = (await store.get(key, { type: 'json' })) || { n: 0, since: now };
  if (now - rec.since > windowMs) { rec.n = 0; rec.since = now; }
  if (rec.n >= max) return false;
  rec.n++; await store.setJSON(key, rec);
  return true;
}

/* ---------------- Stripe (escritura, con la llave de Connect) ---------------- */
function form(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v, key, out); else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}
async function stripeCall(deps, method, path, body, idem) {
  const key = deps.env('STRIPE_CONNECT_KEY');
  if (!key) return { error: 'not_configured' };
  const headers = { authorization: `Bearer ${key}` };
  const opts = { method, headers };
  if (body) { headers['content-type'] = 'application/x-www-form-urlencoded'; opts.body = form(body).join('&'); }
  if (idem) headers['idempotency-key'] = idem;
  let res;
  try { res = await deps.fetch(`https://api.stripe.com/v1/${path}`, opts); } catch (e) { return { error: 'network' }; }
  let data = null; try { data = await res.json(); } catch (e) { /* sin cuerpo */ }
  if (!res.ok) return { error: (data && data.error && (data.error.code || data.error.type)) || 'stripe_error', message: data && data.error && data.error.message, status: res.status };
  return { data };
}

// ¿Puede esta cuenta recibir transferencias?
async function refreshAccount(store, aff, deps) {
  if (!aff.acct) return aff;
  const r = await stripeCall(deps, 'GET', `accounts/${encodeURIComponent(aff.acct)}`);
  if (r.data) {
    aff.ready = !!(r.data.capabilities && r.data.capabilities.transfers === 'active');
    aff.payoutsEnabled = !!r.data.payouts_enabled;
    aff.detailsSubmitted = !!r.data.details_submitted;
    await store.setJSON(`aff:${aff.id}`, aff);
  }
  return aff;
}

/* ---------------- Datos ---------------- */
async function addToList(store, key, id) {
  const idx = (await store.get(key, { type: 'json' })) || { ids: [] };
  if (!idx.ids.includes(id)) { idx.ids.push(id); await store.setJSON(key, idx); }
}
const getList = async (store, key) => ((await store.get(key, { type: 'json' })) || { ids: [] }).ids;

async function affByToken(store, token) {
  if (!TOKEN_OK.test(String(token || ''))) return null;
  const ref = await store.get(`tok:${await sha256(token)}`, { type: 'json' });
  return ref ? store.get(`aff:${ref.id}`, { type: 'json' }) : null;
}
async function affByCode(store, code) {
  const c = String(code || '').toUpperCase();
  if (!CODE_OK.test(c)) return null;
  const ref = await store.get(`code:${c}`, { type: 'json' });
  return ref ? store.get(`aff:${ref.id}`, { type: 'json' }) : null;
}

/* ---------------- Correos ---------------- */
function welcomeMail(aff, token, origin, lang) {
  const en = lang === 'en';
  const panel = `${origin}/afiliados.html?k=${token}`;
  const link = `${origin}/r/${aff.code}`;
  const subject = en ? 'Your TIME affiliate link' : 'Tu enlace de afiliada de TIME';
  const lines = en
    ? [`Hi ${aff.name.split(' ')[0]},`, 'You are in! Here is your personal link. Every time someone buys TIME through it, you earn a commission.', `Your link: ${link}`, `Your private panel (sales, earnings and payout setup): ${panel}`, 'Keep your panel link private: it is your key. To get paid, open your panel and connect your payout account with Stripe (one time).', 'Eyre Digital Studio']
    : [`Hola ${aff.name.split(' ')[0]},`, '¡Ya estás dentro! Este es tu enlace personal. Cada vez que alguien compre TIME con él, ganas una comisión.', `Tu enlace: ${link}`, `Tu panel privado (ventas, ganancias y cuenta de pago): ${panel}`, 'Guarda el enlace de tu panel, es tu llave. Para cobrar, abre tu panel y conecta tu cuenta de pago con Stripe (una sola vez).', 'Eyre Digital Studio'];
  const text = lines.join('\n\n');
  const html = `<div style="font-family:Arial,sans-serif;color:#3A2A22;max-width:520px;line-height:1.55"><p>${esc(lines[0])}</p><p>${esc(lines[1])}</p>` +
    `<p style="background:#FCF3EC;border:2px dashed #8C3520;padding:12px 14px;border-radius:10px;word-break:break-all"><b>${en ? 'Your link' : 'Tu enlace'}:</b><br>${esc(link)}</p>` +
    `<p><a href="${esc(panel)}" style="display:inline-block;background:#8C3520;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:99px">${en ? 'Open my panel' : 'Abrir mi panel'}</a></p>` +
    `<p>${esc(lines[4])}</p><p>${esc(lines[5])}</p></div>`;
  return { subject, text, html };
}
async function tryMail(deps, msg) {
  if (!deps.mail || !deps.mail.configured()) return false;
  try { await deps.mail.send(msg); return true; } catch (e) { console.error('affiliate_mail_failed', e && e.message); return false; }
}

/* ---------------- Comisiones ---------------- */
// Se llama desde el webhook de compras cuando una compra está pagada.
export async function recordCommission(store, session, now, deps) {
  if (!store || !session) return null;
  const m = /^aff_([A-Z2-9]{8})$/i.exec(String(session.client_reference_id || ''));
  if (!m) return null;
  const sid = String(session.id || '');
  if (!/^cs_(live|test)_[A-Za-z0-9]{10,250}$/.test(sid)) return null;
  const aff = await affByCode(store, m[1]);
  if (!aff) return null;
  const email = clean((session.customer_details && session.customer_details.email) || session.customer_email, 160).toLowerCase();
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent && session.payment_intent.id) || '';
  const self = !!email && email === aff.email;
  const rec = {
    sid, affId: aff.id, pi, amount: commissionCents(deps), cur: 'usd',
    status: self ? 'blocked' : (aff.paused ? 'blocked' : 'pending'), reason: self ? 'self' : (aff.paused ? 'paused' : ''),
    created: session.created ? session.created * 1000 : now, releaseAt: (session.created ? session.created * 1000 : now) + holdDays(deps) * DAY, tries: 0
  };
  const claim = await store.setJSON(`com:${sid}`, rec, { onlyIfNew: true });
  if (claim && claim.modified === false) return null;                         // ya estaba registrada (Stripe reintenta avisos)
  if (pi) await store.setJSON(`pi:${pi}`, { sid });
  await addToList(store, 'idx:com', sid);
  if (rec.status === 'pending') {
    const when = new Date(rec.releaseAt).toLocaleDateString('es-US', { day: 'numeric', month: 'long' });
    await tryMail(deps, {
      to: aff.email, subject: `¡Alguien compró TIME con tu enlace! ${money(rec.amount)}`,
      text: `¡Buenas noticias, ${aff.name.split(' ')[0]}! Alguien compró TIME con tu enlace y ganaste ${money(rec.amount)}.\n\nSe te paga ${holdDays(deps) > 0 ? `a partir del ${when}, después de los días de garantía` : 'automáticamente'}${aff.ready ? '' : '. Todavía no has conectado tu cuenta de pago: entra a tu panel y hazlo para recibir el dinero'}.\n\nEyre Digital Studio`
    });
  }
  return rec;
}

// Reembolso o disputa: la comisión pendiente se cancela; si ya se pagó, se intenta revertir la transferencia.
export async function cancelCommissionByPayment(store, pi, status, now, deps) {
  if (!store || !pi) return false;
  const ref = await store.get(`pi:${pi}`, { type: 'json' });
  if (!ref) return false;
  const rec = await store.get(`com:${ref.sid}`, { type: 'json' });
  if (!rec) return false;
  if (rec.status === 'pending') { rec.status = 'canceled'; rec.reason = status; rec.canceledAt = now; }
  else if (rec.status === 'paid' && rec.transfer && !rec.reversed) {
    const r = await stripeCall(deps, 'POST', `transfers/${encodeURIComponent(rec.transfer)}/reversals`, { metadata: { reason: status } }, `rev-${rec.sid}`);
    if (r.data) { rec.reversed = true; rec.reason = status; } else { rec.clawback = status; rec.reverseError = r.error || 'error'; }
  } else return false;
  await store.setJSON(`com:${rec.sid}`, rec);
  return true;
}

// Paga las comisiones que ya cumplieron los días de espera. La corre una función programada cada día.
export async function payDueCommissions(store, deps, now) {
  const out = { paid: 0, canceled: 0, waiting: 0, failed: 0 };
  if (!deps.env('STRIPE_CONNECT_KEY')) return { ...out, error: 'not_configured' };
  for (const sid of await getList(store, 'idx:com')) {
    const rec = await store.get(`com:${sid}`, { type: 'json' });
    if (!rec || rec.status !== 'pending' || rec.releaseAt > now) continue;
    const aff = await store.get(`aff:${rec.affId}`, { type: 'json' });
    if (!aff || aff.paused) { out.waiting++; continue; }
    // ¿la compra sigue vigente? (la licencia no fue desactivada por reembolso)
    if (deps.licenseStore) {
      const s = await deps.licenseStore.get(`sess:${sid}`, { type: 'json' });
      const lic = s ? await deps.licenseStore.get(`code:${s.code}`, { type: 'json' }) : null;
      if (lic && lic.revoked) { rec.status = 'canceled'; rec.reason = lic.status || 'revoked'; rec.canceledAt = now; await store.setJSON(`com:${sid}`, rec); out.canceled++; continue; }
    }
    if (!aff.acct) { out.waiting++; continue; }
    if (!aff.ready) { await refreshAccount(store, aff, deps); if (!aff.ready) { out.waiting++; continue; } }
    const r = await stripeCall(deps, 'POST', 'transfers', {
      amount: rec.amount, currency: rec.cur, destination: aff.acct, transfer_group: `aff_${sid}`,
      description: 'Comisión de afiliada · TIME Better Calendar', metadata: { affiliate: aff.id, session: sid }
    }, `aff-${sid}`);
    rec.tries = (rec.tries || 0) + 1;
    if (r.data) {
      rec.status = 'paid'; rec.paidAt = now; rec.transfer = r.data.id; rec.lastError = '';
      out.paid++;
      await tryMail(deps, { to: aff.email, subject: `Te pagamos ${money(rec.amount)} por tu recomendación`, text: `¡Hola ${aff.name.split(' ')[0]}! Te enviamos ${money(rec.amount)} por la compra que llegó con tu enlace. Stripe lo deposita en tu cuenta en los próximos días.\n\nGracias por recomendar TIME.\nEyre Digital Studio` });
    } else { rec.lastError = r.error || 'error'; out.failed++; }
    await store.setJSON(`com:${sid}`, rec);
  }
  return out;
}

/* ---------------- Panel de cada afiliada ---------------- */
async function statsFor(store, aff, deps) {
  const sids = await getList(store, 'idx:com');
  const mine = [];
  for (const sid of sids) { const r = await store.get(`com:${sid}`, { type: 'json' }); if (r && r.affId === aff.id) mine.push(r); }
  mine.sort((a, b) => b.created - a.created);
  const sum = (st) => mine.filter((c) => c.status === st).reduce((t, c) => t + c.amount, 0);
  return {
    sales: mine.filter((c) => c.status === 'pending' || c.status === 'paid').length,
    pending: sum('pending'), paid: sum('paid'),
    list: mine.slice(0, 50).map((c) => ({ date: c.created, amount: c.amount, status: c.status, reason: c.reason || '', releaseAt: c.releaseAt })),
    holdDays: holdDays(deps), commission: commissionCents(deps)
  };
}
const publicAff = (aff, origin) => ({ name: aff.name, code: aff.code, link: `${origin}/r/${aff.code}`, clicks: aff.clicks || 0, hasAccount: !!aff.acct, ready: !!aff.ready, detailsSubmitted: !!aff.detailsSubmitted, paused: !!aff.paused });

/* ---------------- Entrada principal ---------------- */
export async function handleAffiliate(req, store, deps) {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const origin = new URL(req.url).origin;
  const now = deps.now ? deps.now() : Date.now();
  let b; try { b = JSON.parse(await req.text()); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String((b && b.action) || '');

  if (action === 'join') {
    if (b.hp) return json({ ok: true });                                             // trampa para robots
    if (!(await allow(store, req, 'join', 6, now))) return json({ error: 'too_many' }, 429);
    const name = clean(b.name, 80), email = clean(b.email, 160).toLowerCase(), lang = b.lang === 'en' ? 'en' : 'es';
    if (name.length < 2 || !EMAIL_OK.test(email)) return json({ error: 'bad_input' }, 400);
    if (b.terms !== true) return json({ error: 'terms' }, 400);
    if (!deps.mail || !deps.mail.configured()) return json({ error: 'mail_not_configured' }, 503);
    const ekey = `email:${await sha256(email)}`;
    const existing = await store.get(ekey, { type: 'json' });
    let aff, token = randomToken();
    if (existing) {                                                                  // ya estaba registrada: se le manda de nuevo su panel (nuevo enlace)
      aff = await store.get(`aff:${existing.id}`, { type: 'json' });
      if (!aff) return json({ error: 'server' }, 500);
      await store.delete(`tok:${aff.tokenHash}`);
    } else {
      let code = ''; for (let i = 0; i < 8; i++) { const c = randomCode(); if (!(await store.get(`code:${c}`, { type: 'json' }))) { code = c; break; } }
      if (!code) return json({ error: 'server' }, 500);
      aff = { id: code, code, name, email, created: now, clicks: 0, lang };
      await store.setJSON(`code:${code}`, { id: aff.id });
      await store.setJSON(ekey, { id: aff.id });
      await addToList(store, 'idx:aff', aff.id);
    }
    aff.tokenHash = await sha256(token); aff.lang = lang;
    await store.setJSON(`aff:${aff.id}`, aff);
    await store.setJSON(`tok:${aff.tokenHash}`, { id: aff.id });
    const sent = await tryMail(deps, { to: aff.email, ...welcomeMail(aff, token, origin, lang) });
    return sent ? json({ ok: true }) : json({ error: 'mail_failed' }, 502);
  }

  if (action === 'click') {                                                          // alguien abrió un enlace de afiliada
    const aff = await affByCode(store, b.code);
    if (aff && (await allow(store, req, `click-${aff.id}`, 5, now))) { aff.clicks = (aff.clicks || 0) + 1; await store.setJSON(`aff:${aff.id}`, aff); }
    return json({ ok: true });
  }

  if (action === 'me' || action === 'onboard') {
    if (!(await allow(store, req, 'panel', 120, now))) return json({ error: 'too_many' }, 429);
    let aff = await affByToken(store, b.k);
    if (!aff) return json({ error: 'not_found' }, 404);
    if (action === 'me') {
      if (aff.acct && !aff.ready) aff = await refreshAccount(store, aff, deps);
      return json({ ok: true, affiliate: publicAff(aff, origin), stats: await statsFor(store, aff, deps), payoutsConfigured: !!deps.env('STRIPE_CONNECT_KEY') });
    }
    if (!deps.env('STRIPE_CONNECT_KEY')) return json({ error: 'not_configured' }, 503);
    if (!aff.acct) {
      const r = await stripeCall(deps, 'POST', 'accounts', { type: 'express', email: aff.email, business_type: 'individual', capabilities: { transfers: { requested: true } }, metadata: { affiliate: aff.id } }, `acct-${aff.id}`);
      if (!r.data) return json({ error: r.error || 'stripe_error', message: r.message || '' }, 502);
      aff.acct = r.data.id; await store.setJSON(`aff:${aff.id}`, aff);
    }
    const link = await stripeCall(deps, 'POST', 'account_links', {
      account: aff.acct, type: 'account_onboarding',
      refresh_url: `${origin}/afiliados.html?k=${b.k}&refresh=1`, return_url: `${origin}/afiliados.html?k=${b.k}&done=1`
    });
    if (!link.data) return json({ error: link.error || 'stripe_error', message: link.message || '' }, 502);
    return json({ ok: true, url: link.data.url });
  }

  // ---------- Panel de la dueña (misma contraseña que el panel de licencias) ----------
  if (action === 'admin_list' || action === 'admin_pay' || action === 'admin_pause') {
    const cfg = deps.adminStore ? await deps.adminStore.get('admin-cfg', { type: 'json' }) : null;
    if (!cfg) return json({ error: 'no_admin' }, 401);
    if (!(await allow(store, req, 'adm', 30, now))) return json({ error: 'locked' }, 423);
    if ((await sha256(req.headers.get('x-admin-key') || '')) !== cfg.hash) return json({ error: 'wrong_password' }, 401);
    if (action === 'admin_pay') return json({ ok: true, ...(await payDueCommissions(store, deps, now)) });
    if (action === 'admin_pause') {
      const aff = await store.get(`aff:${String(b.id || '').toUpperCase()}`, { type: 'json' });
      if (!aff) return json({ error: 'not_found' }, 404);
      aff.paused = b.paused === true; await store.setJSON(`aff:${aff.id}`, aff);
      return json({ ok: true });
    }
    const affs = [];
    for (const id of await getList(store, 'idx:aff')) {
      const a = await store.get(`aff:${id}`, { type: 'json' }); if (!a) continue;
      const s = await statsFor(store, a, deps);
      affs.push({ id: a.id, name: a.name, email: a.email, created: a.created, clicks: a.clicks || 0, sales: s.sales, pending: s.pending, paid: s.paid, ready: !!a.ready, hasAccount: !!a.acct, paused: !!a.paused });
    }
    affs.sort((x, y) => y.created - x.created);
    return json({ ok: true, affiliates: affs, connect: !!deps.env('STRIPE_CONNECT_KEY'), mail: !!(deps.mail && deps.mail.configured()), commission: commissionCents(deps), holdDays: holdDays(deps) });
  }

  return json({ error: 'bad_action' }, 400);
}
