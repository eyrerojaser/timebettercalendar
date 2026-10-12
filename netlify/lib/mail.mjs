// Envío de correos de TIME (solo para recuperar el código de compra).
//
// Dos opciones, según las variables de Netlify que pongas:
//  · Resend:  RESEND_API_KEY + MAIL_FROM (necesita un dominio verificado en Resend para enviar a cualquier persona)
//  · SMTP:    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (+ MAIL_FROM opcional). Sirve Gmail con "contraseña de aplicación".
// Si no hay ninguna configurada, la recuperación por correo avisa que no está disponible.

export function mailConfigured(env) {
  return !!(env('RESEND_API_KEY') || (env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS')));
}

export async function sendMail(env, fetchFn, msg) {
  const from = env('MAIL_FROM') || env('SMTP_USER');
  if (env('RESEND_API_KEY')) {
    const res = await fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env('RESEND_API_KEY')}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html })
    });
    if (!res.ok) throw new Error('resend_' + res.status);
    return;
  }
  const { default: nodemailer } = await import('nodemailer');
  const port = Number(env('SMTP_PORT') || 587);
  const transport = nodemailer.createTransport({
    host: env('SMTP_HOST'), port, secure: port === 465,
    auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') }
  });
  await transport.sendMail({ from: `TIME · Better Calendar <${from}>`, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
}
