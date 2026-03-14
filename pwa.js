/* ═══════════════════════════════════════════════
   PWA.JS — Gato Miel Estudio
   - Registrar Service Worker
   - Pedir permiso de notificaciones
   - Escuchar Firestore para notificaciones locales:
     · Mensajes de chat (para admin)
     · Posts nuevos en comunidad (para todos)
   ═══════════════════════════════════════════════ */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FC = {
  apiKey:            "AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs",
  authDomain:        "gato-miel-estudio.firebaseapp.com",
  projectId:         "gato-miel-estudio",
  storageBucket:     "gato-miel-estudio.firebasestorage.app",
  messagingSenderId: "150671559458",
  appId:             "1:150671559458:web:6daaf4a78150706db0337b"
};

const ADMIN_EMAILS = ["jhonanibal576@gmail.com", "gatomielstudio@gmail.com"];

const app  = getApps().length ? getApps()[0] : initializeApp(FC);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ── 1. Registrar Service Worker ── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(reg => {
        console.log("SW registrado:", reg.scope);
        window._swReg = reg;
      })
      .catch(err => console.log("SW error:", err));
  });
}

/* ── 2. Pedir permiso de notificaciones ── */
async function pedirPermiso() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied")  return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

/* ── 3. Mostrar notificación local ── */
function notificar(titulo, cuerpo, url = "/index.html", tag = "gm") {
  if (Notification.permission !== "granted") return;
  // Si la página está visible, no notificar
  if (!document.hidden) return;

  if (window._swReg) {
    window._swReg.showNotification(titulo, {
      body:    cuerpo,
      icon:    "/Assets/Img/Logo.jpg",
      badge:   "/Assets/Img/Logo.jpg",
      tag,
      data:    { url },
      vibrate: [200, 100, 200]
    });
  } else {
    new Notification(titulo, { body: cuerpo, icon: "/Assets/Img/Logo.jpg" });
  }
}

/* ── 4. Escuchar según usuario ── */
let _unsubChat  = null;
let _unsubPosts = null;
let _primeraCargaChat  = true;
let _primeraCargaPosts = true;
let _ultimoPostId = null;

onAuthStateChanged(auth, async user => {
  // Cancelar listeners anteriores
  if (_unsubChat)  { _unsubChat();  _unsubChat  = null; }
  if (_unsubPosts) { _unsubPosts(); _unsubPosts = null; }
  _primeraCargaChat  = true;
  _primeraCargaPosts = true;

  if (!user) return;

  await pedirPermiso();

  const esAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase());

  /* ── ADMIN: escuchar mensajes no leídos ── */
  if (esAdmin) {
    const q = query(collection(db, "chats"), where("noLeidosAdmin", "==", true));
    _unsubChat = onSnapshot(q, snap => {
      if (_primeraCargaChat) { _primeraCargaChat = false; return; }
      snap.docChanges().forEach(change => {
        if (change.type === "added" || change.type === "modified") {
          const d = change.doc.data();
          notificar(
            `💬 Nuevo mensaje de ${d.nombreUsuario || "alguien"}`,
            d.ultimoMensaje || "Te escribió",
            "/panel-admin.html",
            "chat-" + change.doc.id
          );
        }
      });
    });
  }

  /* ── TODOS: escuchar posts nuevos en comunidad ── */
  const qPosts = query(
    collection(db, "posts"),
    orderBy("fecha", "desc"),
    limit(1)
  );
  _unsubPosts = onSnapshot(qPosts, snap => {
    if (_primeraCargaPosts) {
      _primeraCargaPosts = false;
      if (!snap.empty) _ultimoPostId = snap.docs[0].id;
      return;
    }
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const d = change.doc.data();
        if (change.doc.id === _ultimoPostId) return;
        _ultimoPostId = change.doc.id;
        const autor = d.nombreUsuario || d.autor || "Alguien";
        notificar(
          `🏺 Nueva obra en Comunidad`,
          `${autor} compartió una nueva pieza`,
          "/comunidad.html",
          "post-" + change.doc.id
        );
      }
    });
  });
});
