import { getStore } from '@netlify/blobs';
import { handleLicense } from '../lib/license-core.mjs';

export const config = { path: '/api/license' };

export default async (req) =>
  handleLicense(req, getStore({ name: 'calendar-license', consistency: 'strong' }), {
    adminStore: getStore({ name: 'calendar-leads', consistency: 'strong' }),   // misma contraseña del panel
    env: (k) => process.env[k],
    fetch: (...a) => fetch(...a)
  });
