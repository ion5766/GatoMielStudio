/* ═══════════════════════════════════════════════
   SERVICE WORKER — Gato Miel Estudio
   - Cache offline
   - Notificaciones push de mensajes y posts
   ═══════════════════════════════════════════════ */

const CACHE_NAME  = "gato-miel-v1";
const CACHE_URLS  = [
  "/index.html",
  "/coleccion.html",
  "/comunidad.html",
  "/historial-De_Talleres.html",
  "/tablon-de-anuncios.html",
  "/quienes-somos.html",
  "/movil-ui.css",
  "/movil-ui.js",
  "/CSS/Styles.css"
];

/* ── Install: pre-cachear páginas principales ── */
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

/* ── Activate: limpiar caches viejos ── */
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch: servir desde cache, luego red ── */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("firebasejs") || e.request.url.includes("googleapis")) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

/* ── Push: notificaciones del servidor ── */
self.addEventListener("push", e => {
  let data = { title: "Gato Miel 🐾", body: "Tienes un nuevo mensaje", url: "/index.html" };
  try { data = { ...data, ...e.data.json() }; } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    "/Assets/Img/Logo.jpg",
      badge:   "/Assets/Img/Logo.jpg",
      tag:     data.tag || "gato-miel",
      data:    { url: data.url },
      vibrate: [200, 100, 200],
      actions: [
        { action: "open",    title: "Ver mensaje" },
        { action: "dismiss", title: "Ignorar"     }
      ]
    })
  );
});

/* ── Click en notificación ── */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  if (e.action === "dismiss") return;

  const url = e.notification.data?.url || "/index.html";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

/* ── Background Sync: enviar mensajes offline ── */
self.addEventListener("sync", e => {
  if (e.tag === "sync-messages") {
    // Podría sincronizar mensajes pendientes cuando vuelva la conexión
  }
});
