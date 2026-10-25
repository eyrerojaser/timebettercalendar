# TIME · Better Calendar — versión de venta

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
En Stripe: **Developers → API keys → Create restricted key**. Permisos de **lectura** (Read) en: **Checkout Sessions**, **PaymentIntents**, **Charges** y **Payment Links** (este último deja que el panel compruebe tu redirección) (los dos últimos sirven para detectar reembolsos al sincronizar). Nada más. Cópiala (`rk_live_…`) y pégala directo en Netlify (paso 6), nunca en un chat.

### 4. Stripe: el producto y el enlace de pago
1. **Product catalog → Add product** → nombre, precio ($19.99), pago único.
2. **Payment Links → Create** con ese producto.
3. En **After payment → Don't show confirmation page → Redirect customers to your website**, pega:
   `https://TU-SITIO.netlify.app/gracias.html?session_id={CHECKOUT_SESSION_ID}`
   (deja `{CHECKOUT_SESSION_ID}` tal cual; Stripe lo reemplaza solo)
4. Copia el enlace de pago (`https://buy.stripe.com/…`) y su ID (`plink_…`).

### 5. Stripe: el webhook (para que las compras se guarden solas)
Así la compra aparece en el panel aunque el cliente cierre la página antes de ver su código, y un reembolso desactiva el código automáticamente.
1. **Developers → Webhooks → Add endpoint**.
2. URL: `https://TU-SITIO.netlify.app/api/stripe-webhook`
3. Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`.
4. Copia el **Signing secret** (`whsec_…`) → variable `STRIPE_WEBHOOK_SECRET`.
Modo de prueba y modo real son webhooks distintos: crea uno en cada modo.

### 6. Netlify: variables
**Site configuration → Environment variables**:

| Nombre | Valor |
| --- | --- |
| `STRIPE_SECRET_KEY` | la llave `rk_…` del paso 3 |
| `STRIPE_WEBHOOK_SECRET` | el `whsec_…` del paso 5 |
| `BUY_URL` | tu enlace `https://buy.stripe.com/…` |
| `STRIPE_PAYMENT_LINK` | *(opcional)* el `plink_…`, para aceptar solo este producto |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | correo para "Recuperar mi código". Gmail: `smtp.gmail.com`, `465`, tu correo y una **contraseña de aplicación** |
| `MAIL_FROM` | *(opcional)* remitente que verá el cliente |
| `RESEND_API_KEY` | *(alternativa a SMTP)* si usas Resend, con `MAIL_FROM` de un dominio verificado |

Sin correo configurado, el formulario de recuperación le dice al cliente que escriba a soporte. Luego **Deploys → Trigger deploy**.

### 7. Panel
Arriba verás **Estado de la conexión**: te dice con ✓ o ✗ si la llave, el webhook (y cuándo llegó su último aviso), el enlace de compra, el correo y la **redirección de tu enlace de pago a `gracias.html?session_id=…`** están bien.
Abre `https://TU-SITIO.netlify.app/admin.html`. La primera vez eliges tu contraseña. Ahí ves cada compra: cliente, correo, código, fecha, estado y dispositivos (x/4). Botones: **Desactivar**, **Restaurar**, **Liberar dispositivos**, **Exportar CSV** y **Sincronizar con Stripe**.
- Compras hechas antes de configurar el webhook (por ejemplo tu compra real): toca **Sincronizar con Stripe** y se importan.
- Las compras nuevas aparecen solas cuando Stripe avisa por el webhook.

### 8. Prueba antes de vender
Con el modo de prueba de Stripe y la tarjeta `4242 4242 4242 4242`: comprueba que `gracias.html` muestre el código, que la app lo acepte, que la compra salga en el panel, que "Recuperar mi código" llegue al correo, y haz un reembolso de prueba para ver que el código queda en "Reembolsado".

## Reembolsos (garantía de 7 días)
Reembolsa el pago en Stripe (**Payments → el pago → Refund**). El webhook marca el código como **Reembolsado** y deja de funcionar: la app se bloquea la próxima vez que se conecte a Internet (revisión cada 24 h) y ya no puede reactivarse. Si el webhook no está activo, usa **Desactivar** en el panel. Los datos del cliente quedan en su teléfono.

## Políticas
`reembolsos.html`, `terminos.html` y `privacidad.html` (español/inglés) están enlazadas junto a la guía: página de gracias, Ajustes de la app, pantalla del código y pie de `/comprar`. Son plantillas, no asesoría legal; revísalas (plazo de respuesta de 3 días hábiles y ley de Florida son supuestos).

## Actualizar la app
Cambia los archivos en GitHub y sube el número de `VERSION` en `sw.js` para que los dispositivos descarguen la versión nueva.

## Importante
- No hay que tocar `index.html` para poner tu enlace de compra: va en la variable `BUY_URL`.
- La sincronización y los avisos usan Netlify Blobs y una función que corre cada minuto. Si vendes a muchas personas, revisa el uso de tu plan.
- Cambiar el nombre del producto: busca "TIME" en `index.html`, `manifest.webmanifest`, `gracias.html` y `sw.js`. El nombre de los iconos (`icons/`) también hay que cambiarlo si trae texto.
- Ojo: no cambies `mi-calendario` en `index.html` (nombre interno de la base de datos y de los respaldos), o las personas perderían sus datos al actualizar.

## Idiomas (Español / English)
La app, la pantalla del código y la página de gracias tienen un selector **ES | EN** arriba. La elección se recuerda en cada dispositivo.
Las frases en inglés están en `i18n.js` (lista `EN`): si quieres corregir o cambiar una, edítala ahí y sube el número de `VERSION` en `sw.js`.
Lo que la persona escribe (metas, notas, actividades) nunca se traduce.

## Selector de hora
Al crear o editar una actividad, la hora se elige con un selector propio de la app (hora 1–12, minutos de 5 en 5, AM/PM). Las actividades y recordatorios que ya existían no cambian. Si una actividad vieja tiene minutos que no son de 5 en 5 (por ejemplo 9:07), se conserva igual hasta que la cambies.

## Recuperar el código
El correo de recuperación ahora trae también un **enlace directo** (`/?code=…`) que activa la app solo. Si no hay correo configurado, la app lo dice y da tu correo de soporte.

## Bono (planner imprimible)

Los PDF del bono están en la carpeta `bonus/` y salen en dos lugares: en `gracias.html` (justo después de pagar) y dentro de la app, en **Configuración → Bono: planner imprimible**.
Para cambiar el bono, sube tu PDF a `bonus/` con **el mismo nombre** (`TIME-Planner-imprimible-ES-k7x9q2.pdf` y `...-EN-k7x9q2.pdf`). El código al final del nombre hace la dirección difícil de adivinar; no pongas el enlace en redes ni en la página de venta.

## Funciones nuevas (octubre 2026)

- **Actividades recurrentes y duración:** en "Nueva actividad" hay "Duración" y "Repetir" (cada día, semana, mes o días elegidos, con fecha final opcional). Marcar como hecha una repetición no afecta a las demás.
- **Hábitos:** sección nueva con hábitos diarios o semanales, días marcados y círculos de progreso con porcentaje y racha. Se guardan en la llave `habits` y entran en el respaldo y la sincronización.
- **Semana:** prioridades de la semana y horas ocupadas/disponibles (time blocking). Tocar una hora libre crea una actividad en ese horario.
- **Stickers:** en el día y en las metas, botón "Stickers". Se colocan sobre las notas y las fotos, se mueven, cambian de tamaño, giran y se borran. Se ven también en la celda del calendario y en la tarjeta de la meta. Colecciones: primavera, verano, otoño, invierno, lazos, washi tape, papel y palabras (en español y en inglés).
- **Avisos con color:** el aviso lleva el emoji del adorno y un icono del color de la actividad (`icons/n/`). Al tocarlo, la app abre el día y resalta esa tarea.
