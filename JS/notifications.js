// ═══════════════════════════════════════════════════════════════════
// JS/notifications.js — NOTIFICACIONES PUSH GATO MIEL
// Solo hace UNA cosa: guardar el token y enviar notifs reales
// ═══════════════════════════════════════════════════════════════════

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";
import { getFirestore, doc, setDoc, collection, addDoc, getDocs, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const VAPID_KEY = "BOXc74eAxBMYQpwrWThCtU8Db7du05d8p3Js2rrEEwsF_-wkol0qbdwE9iMq7RIYrRKT4_r3T8bN_hHJpYL8bns";
const ADMIN_EMAILS = ["gatomielstudio@gmail.com", "jhonanibal576@gmail.com"];

const FC = {
  apiKey: "AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs",
  authDomain: "gato-miel-estudio.firebaseapp.com",
  projectId: "gato-miel-estudio",
  storageBucket: "gato-miel-estudio.firebasestorage.app",
  messagingSenderId: "150671559458",
  appId: "1:150671559458:web:6daaf4a78150706db0337b"
};

const app  = getApps().length ? getApps()[0] : initializeApp(FC);
const auth = getAuth(app);
const db   = getFirestore(app);
let messaging = null;

try {
  messaging = getMessaging(app);
} catch(e) {
  console.warn("[Notif] Messaging no disponible:", e.message);
}

async function iniciarFCM(user) {
  if (!messaging) return;
  try {
    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("[Notif] SW registrado:", swReg.scope);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg
    });

    if (!token) {
      console.warn("[Notif] No se obtuvo token");
      return;
    }

    console.log("[Notif] Token:", token.substring(0, 20) + "...");

    const isAdmin = ADMIN_EMAILS.includes(user.email);
    await setDoc(doc(db, "tokens_fcm", user.uid), {
      token,
      email: user.email,
      uid: user.uid,
      isAdmin,
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log("[Notif] Token guardado ✅ isAdmin:", isAdmin);

    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      mostrarToastNativo(title || "Gato Miel", body || "");
    });

  } catch(e) {
    console.error("[Notif] Error FCM:", e.message);
  }
}

function mostrarToastNativo(title, body) {
  const t = document.createElement("div");
  t.style.cssText = "position:fixed;top:20px;right:20px;z-index:99999;background:#1a1714;border:1px solid rgba(196,138,58,0.5);border-radius:14px;padding:14px 18px;max-width:300px;box-shadow:0 8px 32px rgba(0,0,0,0.5);cursor:pointer;font-family:'Inter',sans-serif;";
  t.innerHTML = `<p style="color:#c48a3a;font-size:13px;font-weight:600;margin:0 0 4px;">${title}</p><p style="color:rgba(255,255,255,.7);font-size:12px;margin:0;">${body}</p>`;
  t.onclick = () => t.remove();
  document.body.appendChild(t);
  setTimeout(() => t?.remove(), 6000);
}

async function getAdminUid() {
  try {
    const snap = await getDocs(query(collection(db, "tokens_fcm"), where("isAdmin", "==", true)));
    if (!snap.empty) return snap.docs[0].data().uid;
  } catch(e) {}
  return null;
}

async function crearNotif({ uid, titulo, texto, icon, url, tipo }) {
  await addDoc(collection(db, "notificaciones"), {
    uid, titulo, texto,
    icon: icon || "🔔",
    url: url || "/index.html",
    tipo: tipo || "general",
    leida: false,
    createdAt: serverTimestamp()
  });
  console.log("[Notif] Creada para uid:", uid, "→", titulo);
}

async function enviarNotif(tipo, datos = {}) {
  const adminUid = await getAdminUid();

  switch(tipo) {
    case "chat_cliente":
      if (!adminUid) { console.warn("[Notif] Admin no encontrado en tokens_fcm"); break; }
      await crearNotif({ uid: adminUid, titulo: "💬 Nuevo mensaje", texto: `${datos.nombreCliente || "Cliente"}: "${datos.preview || ""}"`, icon: "💬", url: "/panel-admin.html", tipo });
      break;
    case "chat_admin":
      if (!datos.clienteUid) break;
      await crearNotif({ uid: datos.clienteUid, titulo: "💬 Gato Miel te respondió", texto: datos.preview || "Tienes un nuevo mensaje 🐾", icon: "💬", url: "/index.html", tipo });
      break;
    case "reserva_nueva":
      if (!adminUid) break;
      await crearNotif({ uid: adminUid, titulo: "📅 Nueva reserva", texto: `${datos.nombreCliente || "Cliente"} reservó: ${datos.taller || "un taller"}`, icon: "📅", url: "/panel-admin.html", tipo });
      break;
    case "compra_nueva":
      if (!adminUid) break;
      await crearNotif({ uid: adminUid, titulo: "🛍 Nueva compra", texto: `${datos.nombreCliente || "Cliente"} compró: ${datos.pieza || "una pieza"}`, icon: "🛍", url: "/panel-admin.html", tipo });
      break;
    case "pago_validado":
      if (!datos.clienteUid) break;
      await crearNotif({ uid: datos.clienteUid, titulo: "✅ Pago confirmado", texto: datos.detalle || "Tu pedido fue aprobado 🎉", icon: "✅", url: datos.url || "/coleccion.html", tipo });
      break;
    case "post_comunidad":
      await addDoc(collection(db, "notificaciones_broadcast"), {
        titulo: "🌿 Nueva publicación",
        texto: `${datos.autor || "Alguien"} publicó en comunidad`,
        icon: "🌿", url: "/comunidad.html",
        tipo, createdAt: serverTimestamp()
      });
      console.log("[Notif] Broadcast creado");
      break;
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission === "granted") {
    await iniciarFCM(user);
  } else {
    console.warn("[Notif] Permiso denegado");
  }
});

window.notif = { enviarNotif, mostrarToastNativo };
