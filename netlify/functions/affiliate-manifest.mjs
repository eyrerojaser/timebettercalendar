// Manifiesto propio del panel de afiliada: así se instala como una app aparte ("Afiliada"), no como TIME.
// La dirección de inicio lleva la llave de la afiliada (solo si tiene el formato correcto), para que la app abra directo su panel.
export const config = { path: '/afiliados.webmanifest' };

export default async (req) => {
  const u = new URL(req.url);
  const k = u.searchParams.get('k') || '';
  const en = u.searchParams.get('l') === 'en';
  const start = /^[a-f0-9]{48}$/.test(k) ? `/afiliados.html?k=${k}&app=1` : '/afiliados.html?app=1';
  const m = {
    id: '/afiliados.html',
    name: en ? 'TIME Affiliate Panel' : 'Panel de afiliada TIME',
    short_name: en ? 'Affiliate' : 'Afiliada',
    description: en ? 'Your TIME affiliate link, sales and earnings.' : 'Tu enlace de afiliada de TIME, tus ventas y tus ganancias.',
    lang: en ? 'en' : 'es', dir: 'ltr',
    start_url: start, scope: '/afiliados.html', display: 'standalone',
    background_color: '#FCF3EC', theme_color: '#8C3520',
    categories: ['business', 'finance'],
    icons: [
      { src: '/icons/aff-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/aff-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/aff-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
  return new Response(JSON.stringify(m), { headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'no-store' } });
};
