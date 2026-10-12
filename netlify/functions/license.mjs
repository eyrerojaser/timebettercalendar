import { getStore } from '@netlify/blobs';
import { handleLicense } from '../lib/license-core.mjs';
import { mailConfigured, sendMail } from '../lib/mail.mjs';

export const config = { path: '/api/license' };

const env = (k) => process.env[k];

export default async (req) =>
  handleLicense(req, getStore({ name: 'calendar-license', consistency: 'strong' }), {
    adminStore: getStore({ name: 'calendar-leads', consistency: 'strong' }),   // misma contraseña del panel
    env,
    fetch: (...a) => fetch(...a),
    mailConfigured: () => mailConfigured(env),
    sendMail: (msg) => sendMail(env, (...a) => fetch(...a), msg)
  });
