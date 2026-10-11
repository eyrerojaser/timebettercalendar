# Mi Calendario — versión de venta

Calendario instalable (PWA) que se vende con un **código único por compra**.
Funciona en tu cuenta de **GitHub → Netlify**, con **Stripe** para cobrar.

## Cómo funciona

1. La persona paga con tu **Stripe Payment Link**.
2. Stripe la manda a `tu-sitio.netlify.app/gracias.html?session_id=…`.
3. Esa página le pregunta a Stripe si el pago es real. Si lo es, crea **un código** (ejemplo `K7QF-2MXD-9RTA`) y se lo muestra.
4. La persona abre la app, escribe el código y entra. Ve un **mes de ejemplo** que puede borrar con un botón.
5. Cada código funciona en **hasta 4 dispositivos**. Tú puedes **revocarlo** o **liberar dispositivos** desde el panel.

Los datos de cada persona (calendario, fotos, notas) se quedan en **su teléfono**. Tú solo guardas nombre, correo y código de la compra.

## Paso a paso

### 1. GitHub
Repositorio nuevo (privado). Sube **el contenido** de esta carpeta (no la carpeta misma), sin la carpeta `tests`.

### 2. Netlify
**Add new project → Import from GitHub →** tu repositorio → **Deploy**. No cambies nada, todo viene en `netlify.toml`.

### 3. Stripe: la llave de lectura
En Stripe: **Developers → API keys → Create restricted key**. Dale solo permiso de **lectura** en **Checkout Sessions** y nada más. Cópiala (`rk_live_…`).

### 4. Stripe: el producto y el enlace de pago
1. **Product catalog → Add product** → nombre, precio, pago único.
2. **Payment Links → Create** con ese producto.
3. En **After payment → Don't show confirmation page → Redirect customers to your website**, pega:
   `https://TU-SITIO.netlify.app/gracias.html?session_id={CHECKOUT_SESSION_ID}`
   (deja `{CHECKOUT_SESSION_ID}` tal cual; Stripe lo reemplaza solo)
4. Copia el enlace de pago (`https://buy.stripe.com/…`) y su ID (`plink_…`, está en la URL del panel al abrir el enlace).

### 5. Netlify: variables
**Site configuration → Environment variables**, agrega:

| Nombre | Valor |
| --- | --- |
| `STRIPE_SECRET_KEY` | la llave `rk_…` del paso 3 |
| `BUY_URL` | tu enlace `https://buy.stripe.com/…` (sale en el candado como "Compra aquí") |
| `STRIPE_PAYMENT_LINK` | *(opcional)* el `plink_…`, para aceptar solo compras de este producto |

Luego **Deploys → Trigger deploy**.

### 6. Panel
Abre `https://TU-SITIO.netlify.app/admin.html`. La primera vez eliges tu contraseña. Ahí ves cada compra (nombre, correo, código, dispositivos) y puedes **Revocar**, **Restaurar** o **Liberar dispositivos**.

### 7. Prueba antes de vender
Activa el **modo de prueba** de Stripe, usa llaves de prueba (`rk_test_…`) y paga con la tarjeta `4242 4242 4242 4242`. Comprueba que `gracias.html` te muestre el código y que la app lo acepte. Luego pasa a las llaves reales.

## Reembolsos
Si devuelves un pago, entra al panel y toca **Revocar** en ese código. La app revisa el código cada pocos días cuando hay Internet.

## Actualizar la app
Cambia los archivos en GitHub y sube el número de `VERSION` en `sw.js` para que los dispositivos descarguen la versión nueva.

## Importante
- No hay que tocar `index.html` para poner tu enlace de compra: va en la variable `BUY_URL`.
- La sincronización y los avisos usan Netlify Blobs y una función que corre cada minuto. Si vendes a muchas personas, revisa el uso de tu plan.
- Cambiar el nombre del producto: busca "Mi Calendario" en `index.html`, `manifest.webmanifest` y `gracias.html`.

## Idiomas (Español / English)
La app, la pantalla del código y la página de gracias tienen un selector **ES | EN** arriba. La elección se recuerda en cada dispositivo.
Las frases en inglés están en `i18n.js` (lista `EN`): si quieres corregir o cambiar una, edítala ahí y sube el número de `VERSION` en `sw.js`.
Lo que la persona escribe (metas, notas, actividades) nunca se traduce.
