/* ═══════════════════════════════════════════════════
   FIREBASE MESSAGING SERVICE WORKER
   Este archivo DEBE estar en la raíz del proyecto
   ═══════════════════════════════════════════════════ */

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs",
  authDomain:        "gato-miel-estudio.firebaseapp.com",
  projectId:         "gato-miel-estudio",
  storageBucket:     "gato-miel-estudio.firebasestorage.app",
  messagingSenderId: "150671559458",
  appId:             "1:150671559458:web:6daaf4a78150706db0337b"
});

const messaging = firebase.messaging();

/* ── Notificaciones en background (app cerrada/minimizada) ── */
messaging.onBackgroundMessage(function(payload) {
  console.log("📩 Mensaje en background:", payload);

  const data  = payload.data || {};
  const notif = payload.notification || {};

  const titulo  = notif.title  || data.title  || "Gato Miel 🐾";
  const cuerpo  = notif.body   || data.body   || "Tienes una notificación";
  const url     = data.url     || "/index.html";
  const icono   = notif.icon   || data.icon   || "/Assets/Img/Logo.jpg";
  const tag     = data.tag     || "gato-miel";

  self.registration.showNotification(titulo, {
    body:    cuerpo,
    icon:    icono,
    badge:   "/Assets/Img/Logo.jpg",
    tag:     tag,
    data:    { url },
    vibrate: [200, 100, 200],
    actions: [
      { action: "abrir",   title: "Ver" },
      { action: "cerrar",  title: "Ignorar" }
    ]
  });
});

/* ── Click en notificación ── */
self.addEventListener("notificationclick", function(e) {
  e.notification.close();
  if (e.action === "cerrar") return;

  const url = e.notification.data?.url || "/index.html";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.includes(self.location.origin)) {
          list[i].focus();
          list[i].navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
