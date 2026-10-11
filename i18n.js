/* TIME · idiomas (Español / English)
   Traduce la pantalla al vuelo: cada texto en español se cambia por su versión en inglés
   (y se restaura al volver a español). Lo que la persona escribe (metas, notas…) nunca se traduce.
   Para agregar o corregir una frase en inglés, edita la lista EN de abajo. */
(function () {
  'use strict';
  var EN = {
    // ---- Pantalla de código y marca ----
    'Ej. Crecer en tecnología': 'e.g. Grow in tech',
    'Todavía no hay fotos aquí. Las fotos que agregues en tus días y en My Vision van a aparecer en esta galería.': 'No photos here yet. The photos you add to your days and to My Vision will appear in this gallery.',
    '¡Bienvenida!': 'Welcome!',
    'Tu espacio para planear tus metas, cuidar tus días y soñar en grande.': 'Your space to plan your goals, take care of your days and dream big.',
    'Escribe el código de compra que te aparece al pagar para empezar.': 'Enter the purchase code you got after paying to get started.',
    'Código de compra': 'Purchase code',
    'Activar mi calendario': 'Activate my calendar',
    '¿Aún no tienes código?': "Don't have a code yet?",
    'Compra tu calendario aquí': 'Get your calendar here',
    'Idioma': 'Language',
    'Escribe tu código completo (12 letras y números).': 'Enter your full code (12 letters and numbers).',
    'Ese código no es válido. Revísalo y vuelve a escribirlo.': "That code isn't valid. Check it and type it again.",
    'Este código ya no está activo. Escríbenos y lo resolvemos.': 'This code is no longer active. Write to us and we will sort it out.',
    'Este código ya se usó en el máximo de dispositivos. Escríbenos y lo resolvemos.': 'This code has already been used on the maximum number of devices. Write to us and we will sort it out.',
    'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.': 'Too many attempts. Wait a few minutes and try again.',
    'No se pudo activar. Revisa tu conexión e inténtalo de nuevo.': 'Could not activate. Check your connection and try again.',
    'Sin conexión. Conéctate a Internet para activarlo la primera vez.': 'No connection. Connect to the Internet to activate it the first time.',
    // ---- Navegación y encabezado ----
    'Metas': 'Goals', 'Calendario': 'Calendar', 'Galería': 'Gallery', 'My Vision': 'My Vision',
    'Mi perfil': 'My profile', 'Configuración': 'Settings', 'Agregar': 'Add',
    'Secciones': 'Sections', 'Estación del año': 'Season', 'Automático': 'Auto', 'Automático, según el mes': 'Auto, based on the month',
    'Instalar app en este dispositivo': 'Install app on this device',
    'Mes anterior': 'Previous month', 'Mes siguiente': 'Next month',
    'Portada': 'Cover', 'Portada del mes': 'Cover of the month',
    'Mis metas': 'My goals', 'Mis metas de este mes': 'My goals this month', 'Meta del mes': 'Goal of the month',
    'Lo que imaginas hoy, lo construyes mañana.': 'What you imagine today, you build tomorrow.',
    'Sueña · Planifica · Hazlo': 'Dream · Plan · Do it',
    'Disciplina hoy, la vida que amo mañana': 'Discipline today, the life I love tomorrow',
    'Disciplina hoy, la vida que amo mañana.': 'Discipline today, the life I love tomorrow.',
    // ---- Meses y días ----
    'enero': 'January', 'febrero': 'February', 'marzo': 'March', 'abril': 'April', 'mayo': 'May', 'junio': 'June',
    'julio': 'July', 'agosto': 'August', 'septiembre': 'September', 'octubre': 'October', 'noviembre': 'November', 'diciembre': 'December',
    'domingo': 'Sunday', 'lunes': 'Monday', 'martes': 'Tuesday', 'miércoles': 'Wednesday', 'jueves': 'Thursday', 'viernes': 'Friday', 'sábado': 'Saturday',
    'dom': 'sun', 'lun': 'mon', 'mar': 'tue', 'mié': 'wed', 'jue': 'thu', 'vie': 'fri', 'sáb': 'sat',
    'Domingo': 'Sunday', 'Lunes': 'Monday', 'La semana empieza el': 'The week starts on', 'Primer día de la semana': 'First day of the week',
    // ---- Estaciones ----
    'Primavera': 'Spring', 'Verano': 'Summer', 'Otoño': 'Autumn', 'Invierno': 'Winter',
    'Lo que siembras hoy florece mañana: un mes lleno de ganas nuevas.': 'What you plant today blooms tomorrow: a month full of fresh energy.',
    'Días largos, energía de sobra y un verano lleno de luz.': 'Long days, plenty of energy and a summer full of light.',
    'Nuevos hábitos, nuevas oportunidades, un otoño lleno de posibilidades.': 'New habits, new opportunities, an autumn full of possibilities.',
    'Calma, enfoque y calor de hogar: un invierno para crecer hacia adentro.': 'Calm, focus and the warmth of home: a winter to grow inward.',
    'La primavera me recuerda que siempre se puede volver a empezar.': 'Spring reminds me that I can always start again.',
    'El verano me recuerda que la alegría también es una meta.': 'Summer reminds me that joy is also a goal.',
    'El otoño me recuerda que soltar también es crecer.': 'Autumn reminds me that letting go is also growing.',
    'El invierno me recuerda que descansar también es avanzar.': 'Winter reminds me that resting is also moving forward.',
    // ---- Metas ----
    'Agrega tu primera meta': 'Add your first goal', 'Nueva meta': 'New goal', 'Escribe tu meta': 'Write your goal',
    'Ya tienes el máximo de metas este mes': "You've reached the goal limit for this month",
    'Foto de la meta': 'Goal photo', 'Eliminar meta': 'Delete goal', 'Marcar como cumplida': 'Mark as done', 'Meta cumplida': 'Goal done',
    '¿Qué quieres lograr?': 'What do you want to achieve?', 'Escribe lo que quieres lograr. Una cosa por línea.': 'Write what you want to achieve. One thing per line.',
    'sin título': 'untitled',
    // ---- Día ----
    'Mis propósitos del día': "My day's intentions", 'Enfoque de hoy': "Today's focus", 'Foto del día': 'Photo of the day',
    'Marcar como completado': 'Mark as completed', 'Día completado': 'Day completed', 'Completado': 'Completed', 'completado': 'completed', 'hoy': 'today',
    'Categoría': 'Category', 'Categorías': 'Categories', 'Tus categorías': 'Your categories', 'Agregar categoría': 'Add category', 'Nueva categoría': 'New category',
    'Ej. Familia, Salud, Viajes': 'e.g. Family, Health, Travel', 'Escribe un nombre para la categoría': 'Enter a name for the category',
    'Sin color': 'No color', 'Quitar': 'Remove', 'Quitar foto': 'Remove photo', 'Foto': 'Photo', 'Fotos': 'Photos', 'Agregar fotos': 'Add photos', 'Agregar una foto': 'Add a photo', 'Cambiar': 'Change',
    'Listo': 'Done', 'Guardar': 'Save', 'Cerrar': 'Close', 'Color': 'Color', 'Todo': 'All',
    'Alguna foto no se pudo leer.': 'Some photo could not be read.', 'No se pudo leer esa foto. Prueba con otra.': 'Could not read that photo. Try another one.',
    // ---- Categorías por defecto ----
    'Tecnología': 'Technology', 'Negocios': 'Business', 'Contenido': 'Content', 'Casa': 'Home', 'Personal': 'Personal', 'Estudio': 'Study',
    // ---- Actividades ----
    'Actividades con hora': 'Timed activities', 'Agregar actividad': 'Add activity', 'Nueva actividad': 'New activity', 'Editar actividad': 'Edit activity',
    'Actividad': 'Activity', 'Guardar actividad': 'Save activity', 'Eliminar actividad': 'Delete activity', 'Actividad guardada': 'Activity saved', 'Actividad eliminada': 'Activity deleted',
    'Actividad guardada. Activa las notificaciones para recibir el aviso.': 'Activity saved. Turn on notifications to receive the alert.',
    '¿Qué vas a hacer?': 'What are you going to do?', 'Ej. Reunión con clienta': 'e.g. Meeting with a client', 'Escribe qué vas a hacer': 'Enter what you are going to do', 'Elige una fecha': 'Pick a date',
    'Fecha': 'Date', 'Hora': 'Time', 'Color de la cita': 'Event color', 'Todo el día': 'All day', 'Recordatorio': 'Reminder', 'Recordatorios': 'Reminders',
    'Marcar actividad como hecha': 'Mark activity as done',
    'Sin recordatorio': 'No reminder', 'A la hora': 'At the time', 'a la hora': 'at the time', '15 minutos antes': '15 minutes before', '30 minutos antes': '30 minutes before', '1 hora antes': '1 hour before',
    '15 min antes': '15 min before', '30 min antes': '30 min before', '1 h antes': '1 h before',
    'Elige una hora para poder activar un recordatorio.': 'Pick a time to turn on a reminder.',
    'Azul': 'Blue', 'Lila': 'Lilac', 'Rosa': 'Pink', 'Verde': 'Green', 'Amarillo': 'Yellow', 'Naranja': 'Orange',
    'Toca de nuevo para eliminar': 'Tap again to delete', 'Toca otra vez para confirmar': 'Tap again to confirm',
    // ---- Fechas importantes ----
    'Fechas importantes': 'Important dates', 'Fecha importante': 'Important date', 'Agregar fecha importante': 'Add important date', 'Fecha importante guardada': 'Important date saved',
    '¿Qué se celebra?': 'What are we celebrating?', 'Ej. Cumpleaños de mamá': "e.g. Mom's birthday", 'Escribe qué se celebra': 'Enter what is being celebrated',
    'Tipo': 'Type', 'Cumpleaños': 'Birthday', 'Aniversario': 'Anniversary', 'Otro': 'Other', 'Se repite cada año': 'Repeats every year', 'Nombre': 'Name',
    'Año Nuevo': "New Year's Day", 'Día de Martin Luther King Jr.': 'Martin Luther King Jr. Day', 'Día de San Valentín': "Valentine's Day", 'Día de los Presidentes': "Presidents' Day",
    'Día de San Patricio': "St. Patrick's Day", 'Domingo de Pascua': 'Easter Sunday', 'Día de las Madres': "Mother's Day", 'Día de los Caídos': 'Memorial Day', 'Día del Padre': "Father's Day",
    'Juneteenth': 'Juneteenth', 'Día de la Independencia': 'Independence Day', 'Día del Trabajo': 'Labor Day', 'Halloween': 'Halloween', 'Día de los Veteranos': "Veterans Day",
    'Día de Acción de Gracias': 'Thanksgiving', 'Nochebuena': 'Christmas Eve', 'Navidad': 'Christmas Day', 'Fin de Año': "New Year's Eve",
    // ---- My Vision ----
    'Metas futuras': 'Future goals', 'Viajes': 'Travel', 'Ingresos': 'Income', 'Proyectos': 'Projects', 'Ideas': 'Ideas', 'Inspiración': 'Inspiration',
    'Nueva nota': 'New note', 'Mi nota': 'My note', 'Mis notas': 'My notes', 'Nota sin título': 'Untitled note', 'Título': 'Title', 'Eliminar nota': 'Delete note', 'Lograda': 'Achieved', 'Marcar como lograda': 'Mark as achieved',
    'Filtrar por tema': 'Filter by topic', 'Filtrar galería': 'Filter gallery', 'Tema': 'Topic', 'Nota eliminada': 'Note deleted', 'No hay notas en este tema todavía.': 'No notes in this topic yet.',
    'Ej. Viaje a Japón': 'e.g. Trip to Japan', 'Escribe tu meta o tu idea: qué quieres lograr, cuánto, para cuándo…': 'Write your goal or idea: what you want to achieve, how much, by when…',
    'Aquí guardas tus metas futuras, viajes, ideas de ingresos, proyectos e inspiración. Toca “Nueva nota” para empezar y agrega fotos desde tu teléfono.': 'Here you keep your future goals, trips, income ideas, projects and inspiration. Tap “New note” to start and add photos from your phone.',
    'Ver foto': 'View photo',
    // ---- Configuración ----
    'Tu nombre': 'Your name', 'Tu frase de portada': 'Your cover phrase',
    'Activar recordatorios': 'Turn on reminders', 'Probar aviso': 'Test alert', 'Desactivar': 'Turn off',
    'Recibe un aviso antes de cada actividad, a la hora que elijas.': 'Get an alert before each activity, at the time you choose.',
    'Al guardar te pediremos permiso para enviarte notificaciones.': 'When you save, we will ask for permission to send you notifications.',
    'Activos. Los avisos llegan a este dispositivo aunque la app esté cerrada.': 'On. Alerts reach this device even when the app is closed.',
    'Activos solo con la app abierta. Para recibirlos con la app cerrada, la app debe publicarse con GitHub y Netlify (ver README).': 'On only while the app is open.',
    'Recordatorios desactivados en este dispositivo': 'Reminders are off on this device',
    'Este navegador no permite notificaciones': 'This browser does not allow notifications', 'Este navegador no permite notificaciones.': 'This browser does not allow notifications.',
    'Las notificaciones están bloqueadas para esta app. Actívalas en los ajustes del navegador o del teléfono y vuelve aquí.': 'Notifications are blocked for this app. Turn them on in your browser or phone settings and come back here.',
    'Las notificaciones están bloqueadas para esta app. Actívalas en los ajustes del navegador o del teléfono.': 'Notifications are blocked for this app. Turn them on in your browser or phone settings.',
    'En iPhone o iPad, primero instala la app (Compartir → Agregar a pantalla de inicio) y activa los recordatorios desde ahí.': 'On iPhone or iPad, first install the app (Share → Add to Home Screen) and turn on reminders from there.',
    'No se pudo activar el aviso con la app cerrada en este dispositivo. Con la app abierta, los recordatorios sí funcionan.': 'Could not turn on closed-app alerts on this device. Reminders still work while the app is open.',
    'Sin conexión con el servicio de avisos. Se reintentará.': 'No connection to the alert service. It will retry.',
    'Aviso de prueba': 'Test alert', 'Así se verá un recordatorio.': 'This is how a reminder will look.', 'No se pudo mostrar el aviso': 'Could not show the alert',
    'Cierra la app. En 1 minuto debe llegar un aviso.': 'Close the app. An alert should arrive in 1 minute.',
    '¡Funciona! Este aviso llegó con la app cerrada.': 'It works! This alert arrived with the app closed.',
    'Sincronizar mis dispositivos': 'Sync my devices', 'Activar sincronización': 'Turn on sync', 'Ya tengo un código': 'I already have a code', 'Pega tu código': 'Paste your code',
    'Conectar': 'Connect', 'Copiar': 'Copy', 'Sincronizar ahora': 'Sync now', 'Código copiado': 'Code copied', 'Selecciona el código y cópialo': 'Select the code and copy it',
    'Ten tu calendario igual en la computadora y en el teléfono. Actívalo primero en el dispositivo que ya tiene tus datos.': 'Keep your calendar the same on your computer and your phone. Turn it on first on the device that already has your data.',
    'Esta función se activa al publicar la app con GitHub o con la terminal de Netlify (no arrastrando la carpeta). Mientras tanto, usa el respaldo.': 'This feature is not available yet. In the meantime, use the backup.',
    'Sincronización activa': 'Sync is on', 'Sincronización activada': 'Sync turned on', 'Sincronización desactivada en este dispositivo': 'Sync is off on this device',
    'Sincronizando…': 'Syncing…', 'Activando…': 'Turning on…', 'Conectando…': 'Connecting…', 'Guardando…': 'Saving…', 'Guardado automáticamente': 'Saved automatically',
    'Sin conexión. Se sincroniza al volver.': 'Offline. It will sync when you are back online.',
    'No se pudo sincronizar. Se reintentará en un momento.': 'Could not sync. It will retry in a moment.',
    'El código tiene 24 letras y números': 'The code has 24 letters and numbers',
    'Este navegador no permite guardar: tus cambios se perderán al cerrar': 'This browser does not allow saving: your changes will be lost when you close it',
    'Guía': 'Guide', 'Guía rápida (PDF)': 'Quick guide (PDF)',
    'Respaldo': 'Backup', 'Descargar respaldo': 'Download backup', 'Importar respaldo': 'Import backup', 'Respaldo descargado': 'Backup downloaded',
    'Descarga una copia de todo (metas, días y fotos) o pasa tu calendario a otro dispositivo. Al importar, se reemplazan los meses que vengan en el archivo.': 'Download a copy of everything (goals, days and photos) or move your calendar to another device. When you import, the months in the file are replaced.',
    'Ese archivo no es un respaldo de TIME': 'That file is not a TIME backup', 'Ese archivo no es un respaldo válido': 'That file is not a valid backup',
    'Instalar app': 'Install app', 'Instalar en este dispositivo': 'Install on this device', '¡App instalada!': 'App installed!',
    'Ábrela como una app, con su propio ícono y sin la barra del navegador.': 'Open it like an app, with its own icon and no browser bar.',
    'En iPhone o iPad: toca el botón Compartir de Safari y elige “Agregar a pantalla de inicio”.': 'On iPhone or iPad: tap Safari’s Share button and choose “Add to Home Screen”.',
    'En tu navegador abre el menú y elige “Instalar app” (o “Agregar a pantalla de inicio” en el celular).': 'In your browser, open the menu and choose “Install app” (or “Add to Home Screen” on your phone).',
    'Mes de ejemplo': 'Sample month', 'Borrar el ejemplo y empezar': 'Delete the sample and start',
    'Llenamos este mes con datos de ejemplo para que veas cómo funciona. Cuando quieras, bórralo: se borran solo los datos de ejemplo, no lo que tú agregues nuevo.': 'We filled this month with sample data so you can see how it works. Delete it whenever you like: only the sample data is removed, not what you add yourself.',
    'Listo: tu calendario está en blanco': 'Done: your calendar is now blank',
    // ---- Datos de ejemplo ----
    'Revisar mis metas del mes': 'Review my goals for the month', 'Planear mi semana y mis prioridades': 'Plan my week and my priorities', 'Cita con el dentista': 'Dentist appointment',
    'Grabar contenido nuevo': 'Record new content', 'Limpiar y organizar la casa': 'Clean and organize the house', 'Clase en línea: 1 hora': 'Online class: 1 hour',
    'Reunión con mi equipo': 'Meeting with my team', 'Día de descanso y spa en casa': 'Rest day and spa at home', 'Hacer la compra del mes': 'Do the monthly grocery shopping',
    'Terminar mi proyecto principal': 'Finish my main project', 'Cena con mi familia': 'Dinner with my family', 'Revisar mis finanzas': 'Review my finances', 'Escribir mis logros del mes': 'Write my wins of the month',
    'Ahorrar para mis vacaciones': 'Save for my vacation', 'Ejercicio 3 veces por semana': 'Exercise 3 times a week', 'Leer un libro este mes': 'Read a book this month',
    'Llamada con proveedor': 'Call with supplier', 'Cita de uñas': 'Nail appointment', 'Clase en línea': 'Online class', 'Reunión de equipo': 'Team meeting', 'Entrega del proyecto': 'Project deadline', 'Cena en familia': 'Family dinner',
    'Viaje soñado': 'Dream trip', 'Una semana frente al mar. Ahorrar un poco cada mes y reservar con tiempo.': 'A week by the sea. Save a little each month and book early.',
    'Mi proyecto': 'My project', 'Lanzar mi proyecto personal y tener mis primeros clientes.': 'Launch my personal project and get my first clients.',
    'Idea de ingreso extra': 'Extra income idea', 'Crear una guía digital con lo que ya sé y venderla.': 'Create a digital guide with what I already know and sell it.',
    'Frase que me inspira': 'A phrase that inspires me'
  };

  var MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var lang = 'es';
  try { var saved = localStorage.getItem('mc-lang'); if (saved === 'en' || saved === 'es') lang = saved; } catch (e) {}
  var listeners = [];

  function lookup(k) { return Object.prototype.hasOwnProperty.call(EN, k) ? EN[k] : undefined; }
  function monthEn(m) { return EN[m] || m; }

  // Frases con partes variables (números, nombres, horas…)
  var RULES = [
    [/^(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/, function (m) { return monthEn(m[2]) + ' ' + m[1]; }],
    [/^(\d+) actividad(es)?$/, function (m) { return m[1] + (m[1] === '1' ? ' activity' : ' activities'); }],
    [/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) (\d{4})$/, function (m) { return monthEn(m[1]) + ' ' + m[2]; }],
    [/^TIME · (\S+) (\d{4})$/, function (m) { return 'TIME · ' + monthEn(m[1]) + ' ' + m[2]; }],
    [/^Meta (\d+): (.*)$/, function (m) { return 'Goal ' + m[1] + ': ' + tr(m[2]); }],
    [/^Quitar categoría (.*)$/, function (m) { return 'Remove category ' + m[1]; }],
    [/^Editar actividad (.*)$/, function (m) { return 'Edit activity ' + m[1]; }],
    [/^Ver foto de (.*)$/, function (m) { return 'View photo of ' + tr(m[1]); }],
    [/^Foto (\d+)$/, function (m) { return 'Photo ' + m[1]; }],
    [/^Color (.*)$/, function (m) { return 'Color ' + tr(m[1]); }],
    [/^Recordatorio: (.*)$/, function (m) { return 'Reminder: ' + m[1]; }],
    [/^Sincronizado a las (.*)$/, function (m) { return 'Synced at ' + m[1]; }],
    [/^Es ahora · (.*)$/, function (m) { return "It's now · " + m[1]; }],
    [/^En 1 hora · (.*)$/, function (m) { return 'In 1 hour · ' + m[1]; }],
    [/^En (\d+) minutos · (.*)$/, function (m) { return 'In ' + m[1] + ' minutes · ' + m[2]; }],
    [/^“(.*)”$/, function (m) { return '“' + tr(m[1]) + '”'; }],
    [/^(.*)\. Usa este mismo código en tus otros dispositivos\.$/, function (m) { return tr(m[1]) + '. Use this same code on your other devices.'; }],
    [/^El servicio de avisos respondió con un error \((\d+)\)\. Se reintentará\.$/, function (m) { return 'The alert service returned an error (' + m[1] + '). It will retry.'; }]
  ];

  function tr(s) {
    if (typeof s !== 'string') return s;
    var t = s.trim();
    if (!t) return s;
    var lead = s.slice(0, s.indexOf(t)), trail = s.slice(s.indexOf(t) + t.length);
    var hit = lookup(t);
    if (hit !== undefined) return lead + hit + trail;
    for (var i = 0; i < RULES.length; i++) {
      var m = RULES[i][0].exec(t);
      if (m) return lead + RULES[i][1](m) + trail;
    }
    if (t.indexOf(', ') > 0) {                               // etiquetas de accesibilidad: "5 de octubre, hoy, 2 actividades"
      var parts = t.split(', '), changed = false;
      var out = parts.map(function (p) { var q = tr(p); if (q !== p) changed = true; return q; });
      if (changed) return lead + out.join(', ') + trail;
    }
    return s;
  }
  function T(s) { return lang === 'en' ? tr(s) : s; }

  /* ---- Traducción de la pantalla ---- */
  var ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1 };

  function procText(n) {
    var cur = n.nodeValue;
    if (n.__en !== undefined && cur === n.__en) {            // lo escribimos nosotros
      if (lang === 'es') { n.nodeValue = n.__es; n.__en = undefined; }
      return;
    }
    n.__es = cur; n.__en = undefined;
    if (lang === 'en') { var t = tr(cur); if (t !== cur) { n.__en = t; n.nodeValue = t; } }
  }
  function procAttr(el, name) {
    var cur = el.getAttribute(name); if (cur == null) return;
    var rec = el.__a && el.__a[name];
    if (rec && rec.en !== undefined && cur === rec.en) {
      if (lang === 'es') { el.setAttribute(name, rec.es); rec.en = undefined; }
      return;
    }
    el.__a = el.__a || {}; el.__a[name] = { es: cur, en: undefined };
    if (lang === 'en') { var t = tr(cur); if (t !== cur) { el.__a[name].en = t; el.setAttribute(name, t); } }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (!(root.parentNode && SKIP[root.parentNode.nodeName])) procText(root); return; }
    if (root.nodeType !== 1) return;
    for (var i = 0; i < ATTRS.length; i++) if (root.hasAttribute(ATTRS[i])) procAttr(root, ATTRS[i]);
    if (SKIP[root.nodeName]) return;
    for (var c = root.firstChild; c; c = c.nextSibling) walk(c);
  }
  var obs = null;
  function start() {
    walk(document.documentElement);
    obs = new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        if (r.type === 'characterData') { if (!(r.target.parentNode && SKIP[r.target.parentNode.nodeName])) procText(r.target); }
        else if (r.type === 'attributes') procAttr(r.target, r.attributeName);
        else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function syncSwitches() {
    document.documentElement.setAttribute('lang', lang);
    var bs = document.querySelectorAll('.langsw [data-lang]');
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-pressed', String(bs[i].getAttribute('data-lang') === lang));
  }
  function setLang(l) {
    if (l !== 'en' && l !== 'es') return;
    lang = l;
    try { localStorage.setItem('mc-lang', l); } catch (e) {}
    walk(document.documentElement);
    syncSwitches();
    listeners.forEach(function (f) { try { f(lang); } catch (e) {} });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.langsw [data-lang]');
    if (b) setLang(b.getAttribute('data-lang'));
  });

  window.I18N = {
    t: T,
    lang: function () { return lang; },
    locale: function () { return lang === 'en' ? 'en-US' : 'es'; },
    set: setLang,
    add: function (dict) { for (var k in dict) EN[k] = dict[k]; walk(document.documentElement); },
    onChange: function (f) { listeners.push(f); }
  };

  function boot() { syncSwitches(); start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
