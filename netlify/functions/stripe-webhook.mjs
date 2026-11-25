import { getStore } from '@netlify/blobs';
import { handleWebhook } from '../lib/license-core.mjs';
import { mailConfigured, sendMail } from '../lib/mail.mjs';

export const config = { path: '/api/stripe-webhook' };

const env = (k) => process.env[k];

export default async (req) =>
  handleWebhook(req, getStore({ name: 'calendar-license', consistency: 'strong' }), {
    env,
    fetch: (...a) => fetch(...a),
    affStore: getStore({ name: 'calendar-affiliates', consistency: 'strong' }),     // programa de afiliadas
    mail: { configured: () => mailConfigured(env), send: (msg) => sendMail(env, (...a) => fetch(...a), msg) }
  });
