// Licencias de Mi Calendario: un código único por compra.
//
// Flujo:
//  1) La persona paga con un Stripe Payment Link. Stripe la manda a /gracias.html?session_id=...
//  2) gracias.html llama a /api/license?a=redeem. Aquí se le pregunta a Stripe si esa sesión
//     está PAGADA; si lo está, se crea (una sola vez por compra) un código tipo ABCD-EFGH-JKLM.
//  3) En la app, la persona escribe el código → /api/license?a=activate. Cada código funciona
//     en un máximo de MAX_DEVICES dispositivos.
//  4) Desde el panel puedes revocar un código (por ejemplo, si devuelves el dinero).
//
// La llave de Stripe (STRIPE_SECRET_KEY) vive solo en las variables de Netlify.

const MAX_DEVICES = 4;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';      // sin 0/O/1/I para no confundir al escribir
const SESSION_OK = /^cs_(live|test)_[A-Za-z0-9]{10,250}$/;
const DEVICE_OK = /^[A-Za-z0-9_-]{8,64}$/;
const CODE_OK = /^[A-Z2-9]{12}$/;
const MAX_FAILS = 10;
const LOCK_MS = 15 * 60 * 1000;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const ipOf = (req) => req.headers.get('x-nf-client-connection-ip') || req.headers.get('client-ip') || 'sin-ip';
const clean = (s, n) => String(s || '').trim().slice(0, n);

export function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
export const prettyCode = (c) => c.replace(/(.{4})(?=.)/g, '$1-');
export const normalizeCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '').replace(/0/g, '').replace(/1/g, '').replace(/I/g, '');

// Cuenta intentos fallidos por IP; devuelve false si ya se pasó del límite.
async function failGate(store, req, now, bucket, add) {
  const key = `rl:${bucket}:${await sha256(ipOf(req))}`;
  const rec = (await store.get(key, { type: 'json' })) || { fails: 0, until: 0 };
  if (rec.until > now) return false;
  if (add) {
    rec.fails++;
    if (rec.fails >= MAX_FAILS) { rec.until = now + LOCK_MS; rec.fails = 0; }
    await store.setJSON(key, rec);
  }
  return true;
}

async function stripeSession(id, deps) {
  const key = deps.env('STRIPE_SECRET_KEY');
  if (!key) return { error: 'not_configured' };
  const res = await deps.fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${key}` }
  });
  if (res.status === 404 || res.status === 400) return { error: 'unknown_session' };
  if (!res.ok) return { error: 'stripe_error' };
  return { session: await res.json() };
}

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
    const idx = (await store.get('index', { type: 'json' })) || { codes: [] };
    if (req.method === 'GET') {
      const list = [];
      for (const c of idx.codes) {
        const r = await store.get(`code:${c}`, { type: 'json' });
        if (r) list.push({ code: prettyCode(c), name: r.name, email: r.email, created: r.created, devices: (r.devices || []).length, revoked: !!r.revoked, amount: r.amount, currency: r.currency });
      }
      list.sort((x, y) => y.created - x.created);
      return json({ ok: true, purchases: list });
    }
    if (req.method === 'POST') {
      let body; try { body = JSON.parse(await req.text()); } catch { return json({ error: 'bad_json' }, 400); }
      const code = normalizeCode(body && body.code);
      const rec = CODE_OK.test(code) ? await store.get(`code:${code}`, { type: 'json' }) : null;
      if (!rec) return json({ error: 'not_found' }, 404);
      if (body.action === 'revoke') rec.revoked = true;
      else if (body.action === 'restore') rec.revoked = false;
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
      const r = await store.get(`code:${existing.code}`, { type: 'json' });
      return json({ ok: true, code: prettyCode(existing.code), name: r && r.name, email: r && r.email });
    }
    const { session, error } = await stripeSession(sid, deps);
    if (error === 'not_configured') return json({ error }, 503);
    if (error === 'unknown_session') { await failGate(store, req, now, 'red', true); return json({ error }, 404); }
    if (error) return json({ error }, 502);
    if (session.mode !== 'payment' || session.payment_status !== 'paid') return json({ error: 'not_paid' }, 402);
    const plink = deps.env('STRIPE_PAYMENT_LINK');                       // opcional: solo aceptar compras de ESTE producto
    if (plink && session.payment_link !== plink) return json({ error: 'wrong_product' }, 403);

    const code = makeCode();
    const cd = session.customer_details || {};
    const rec = {
      code, session: sid, name: clean(cd.name, 100), email: clean(cd.email, 160).toLowerCase(),
      amount: session.amount_total, currency: session.currency, created: now, devices: [], revoked: false
    };
    // "onlyIfNew" evita que dos aperturas a la vez creen dos códigos para la misma compra.
    const claim = await store.setJSON(`sess:${sid}`, { code }, { onlyIfNew: true });
    if (claim && claim.modified === false) {
      const again = await store.get(`sess:${sid}`, { type: 'json' });
      return json({ ok: true, code: prettyCode(again.code), name: rec.name, email: rec.email });
    }
    await store.setJSON(`code:${code}`, rec);
    const idx = (await store.get('index', { type: 'json' })) || { codes: [] };
    idx.codes.push(code);
    await store.setJSON('index', idx);
    return json({ ok: true, code: prettyCode(code), name: rec.name, email: rec.email });
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

  return json({ error: 'bad_action' }, 400);
}
