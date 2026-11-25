import { getStore } from '@netlify/blobs';
import { payDueCommissions } from '../lib/affiliate-core.mjs';
import { mailConfigured, sendMail } from '../lib/mail.mjs';

// Corre sola cada día: paga las comisiones que ya cumplieron los días de garantía.
export const config = { schedule: '@daily' };

const env = (k) => process.env[k];

export default async () => {
  const res = await payDueCommissions(getStore({ name: 'calendar-affiliates', consistency: 'strong' }), {
    env,
    fetch: (...a) => fetch(...a),
    licenseStore: getStore({ name: 'calendar-license', consistency: 'strong' }),
    mail: { configured: () => mailConfigured(env), send: (msg) => sendMail(env, (...a) => fetch(...a), msg) }
  }, Date.now());
  console.log('affiliate-payout', JSON.stringify(res));
};
