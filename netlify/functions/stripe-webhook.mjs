import { getStore } from '@netlify/blobs';
import { handleWebhook } from '../lib/license-core.mjs';

export const config = { path: '/api/stripe-webhook' };

export default async (req) =>
  handleWebhook(req, getStore({ name: 'calendar-license', consistency: 'strong' }), {
    env: (k) => process.env[k]
  });
