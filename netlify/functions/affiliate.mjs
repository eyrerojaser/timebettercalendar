import { getStore } from '@netlify/blobs';
import { handleAffiliate } from '../lib/affiliate-core.mjs';
import { mailConfigured, sendMail } from '../lib/mail.mjs';

export const config = { path: '/api/affiliate' };

const env = (k) => process.env[k];

export default async (req) =>
  handleAffiliate(req, getStore({ name: 'calendar-affiliates', consistency: 'strong' }), {
    env,
    fetch: (...a) => fetch(...a),
    adminStore: getStore({ name: 'calendar-leads', consistency: 'strong' }),        // misma contraseña del panel
    licenseStore: getStore({ name: 'calendar-license', consistency: 'strong' }),
    mail: { configured: () => mailConfigured(env), send: (msg) => sendMail(env, (...a) => fetch(...a), msg) }
  });
