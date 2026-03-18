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

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, data } = payload.notification || {};

  // Tag único basado en el título — reemplaza notificaciones iguales
  // en lugar de apilarlas
  const tag = "gm-" + (title || "notif").toLowerCase().replace(/[^a-z0-9]/g, "-");

  // Cerrar notificaciones anteriores con el mismo tag antes de mostrar la nueva
  self.registration.getNotifications({ tag }).then(notifs => {
    notifs.forEach(n => n.close());
  });

  self.registration.showNotification(title || "Gato Miel Estudio", {
    body: body || "",
    icon: icon || "/Assets/Img/Logo.jpg",
    badge: "/Assets/Img/Logo.jpg",
    data: data || {},
    vibrate: [200, 100, 200],
    tag,              // mismo tag = reemplaza la anterior
    renotify: false   // no vibrar si reemplaza una existente
  });
});

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
