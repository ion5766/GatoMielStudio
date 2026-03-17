// ═══════════════════════════════════════════════════════════════════
// JS/notifications.js — NOTIFICACIONES PUSH GATO MIEL
// Guarda token por dispositivo, notifica a todos los devices del user
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

// ─── Genera un ID único por dispositivo ──────────────────────────
function getDeviceId() {
  let id = localStorage.getItem("gm_device_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("gm_device_id", id);
  }
  return id;
}

// ─── Registrar token de ESTE dispositivo ─────────────────────────
async function iniciarFCM(user) {
  if (!messaging) return;
  try {
    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("[Notif] SW registrado");

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg
    });

    if (!token) {
      console.warn("[Notif] No se obtuvo token — revisa permisos");
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email);
    const deviceId = getDeviceId();

    // Guardamos en tokens_fcm/{uid}/devices/{deviceId}
    // Así cada usuario puede tener múltiples dispositivos
    await setDoc(doc(db, "tokens_fcm", user.uid, "devices", deviceId), {
      token,
      deviceId,
      email: user.email,
      uid: user.uid,
      isAdmin,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // También guardamos en el doc principal para que las queries funcionen
    await setDoc(doc(db, "tokens_fcm", user.uid), {
      email: user.email,
      uid: user.uid,
      isAdmin,
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log("[Notif] Token guardado ✅ isAdmin:", isAdmin, "device:", deviceId.substring(0,8));

    // Notificaciones con app ABIERTA
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      mostrarToastNativo(title || "Gato Miel", body || "");
    });

  } catch(e) {
    console.error("[Notif] Error FCM:", e.message);
  }
}

// ─── Toast cuando la app está abierta ────────────────────────────
function mostrarToastNativo(title, body) {
  const t = document.createElement("div");
  t.style.cssText = "position:fixed;top:20px;right:20px;z-index:99999;background:#1a1714;border:1px solid rgba(196,138,58,0.5);border-radius:14px;padding:14px 18px;max-width:300px;box-shadow:0 8px 32px rgba(0,0,0,0.5);cursor:pointer;font-family:'Inter',sans-serif;";
  t.innerHTML = `<p style="color:#c48a3a;font-size:13px;font-weight:600;margin:0 0 4px;">${title}</p><p style="color:rgba(255,255,255,.7);font-size:12px;margin:0;">${body}</p>`;
  t.onclick = () => t.remove();
  document.body.appendChild(t);
  setTimeout(() => t?.remove(), 6000);
}

// ─── Obtener todos los UIDs de admins ────────────────────────────
async function getAdminUids() {
  try {
    const snap = await getDocs(query(collection(db, "tokens_fcm"), where("isAdmin", "==", true)));
    return snap.docs.map(d => d.data().uid).filter(Boolean);
  } catch(e) { return []; }
}

// ─── Crear notificación → Cloud Function la detecta y envía push ─
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

// ─── API pública ──────────────────────────────────────────────────
async function enviarNotif(tipo, datos = {}) {
  const adminUids = await getAdminUids();
  const primerAdmin = adminUids[0] || null;

  switch(tipo) {
    case "chat_cliente":
      if (!primerAdmin) { console.warn("[Notif] Admin no encontrado en tokens_fcm"); break; }
      // Notificar a TODOS los admins
      for (const uid of adminUids) {
        await crearNotif({ uid, titulo: "💬 Nuevo mensaje", texto: `${datos.nombreCliente || "Cliente"}: "${datos.preview || ""}"`, icon: "💬", url: "/panel-admin.html", tipo });
      }
      break;
    case "chat_admin":
      if (!datos.clienteUid) break;
      await crearNotif({ uid: datos.clienteUid, titulo: "💬 Gato Miel te respondió", texto: datos.preview || "Tienes un nuevo mensaje 🐾", icon: "💬", url: "/index.html", tipo });
      break;
    case "reserva_nueva":
      for (const uid of adminUids) {
        await crearNotif({ uid, titulo: "📅 Nueva reserva", texto: `${datos.nombreCliente || "Cliente"} reservó: ${datos.taller || "un taller"}`, icon: "📅", url: "/panel-admin.html", tipo });
      }
      break;
    case "compra_nueva":
      for (const uid of adminUids) {
        await crearNotif({ uid, titulo: "🛍 Nueva compra", texto: `${datos.nombreCliente || "Cliente"} compró: ${datos.pieza || "una pieza"}`, icon: "🛍", url: "/panel-admin.html", tipo });
      }
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

// ─── INIT ─────────────────────────────────────────────────────────
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
