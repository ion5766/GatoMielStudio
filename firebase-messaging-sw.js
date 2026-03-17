// ═══════════════════════════════════════════════════════════════════
// firebase-messaging-sw.js  —  SERVICE WORKER DE NOTIFICACIONES
// Gato Miel Estudio
// Ubicación: RAÍZ del proyecto (mismo nivel que index.html)
// ═══════════════════════════════════════════════════════════════════

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs",
  authDomain: "gato-miel-estudio.firebaseapp.com",
  projectId: "gato-miel-estudio",
  storageBucket: "gato-miel-estudio.firebasestorage.app",
  messagingSenderId: "150671559458",
  appId: "1:150671559458:web:6daaf4a78150706db0337b"
});

const messaging = firebase.messaging();

// ─── Notificaciones en background (app cerrada o en otra pestaña) ────
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, data } = payload.notification || {};
  self.registration.showNotification(title || "Gato Miel Estudio", {
    body: body || "",
    icon: icon || "/Assets/Img/Logo.jpg",
    badge: "/Assets/Img/Logo.jpg",
    data: data || {},
    vibrate: [200, 100, 200],
    tag: "gato-miel-" + Date.now()
  });
});

// ─── Clic en notificación → abrir la app ────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/index.html";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
