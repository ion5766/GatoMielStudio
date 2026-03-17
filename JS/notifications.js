// ═══════════════════════════════════════════════════════════════════
// JS/notifications.js  —  MÓDULO DE NOTIFICACIONES FCM
// Gato Miel Estudio
//
// USO EN CADA PÁGINA:
//   <script type="module" src="JS/notifications.js"></script>
//
// Funciones globales disponibles:
//   window.notif.pedirPermiso()
//   window.notif.enviarNotif(tipo, datos)
// ═══════════════════════════════════════════════════════════════════

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─────────────────────────────────────────────────────────────────
// CONFIGURACIÓN — REEMPLAZA ESTO:
// Ve a Firebase Console → Project Settings → Cloud Messaging
// → Web Push certificates → copia la "Key pair" (VAPID Key)
// ─────────────────────────────────────────────────────────────────
const VAPID_KEY = "TU_VAPID_KEY_AQUI"; // 🔑 VER INSTRUCCIONES ABAJO

// Email del admin (el que recibe notificaciones de compras/reservas)
const ADMIN_EMAIL = "gatomieltaller@gmail.com";

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
let messaging;
try { messaging = getMessaging(app); } catch(e) {}

// ─── UI de notificaciones in-app ────────────────────────────────
function crearUI() {
  if (document.getElementById("gm-notif-panel")) return;
  const css = `
    #gm-notif-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9000;
      width: 46px; height: 46px; border-radius: 50%;
      background: #c48a3a; border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(196,138,58,0.45);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, background .2s;
      font-size: 20px;
    }
    #gm-notif-btn:hover { transform: scale(1.1); background: #a8742f; }
    #gm-notif-badge {
      position: absolute; top: -3px; right: -3px;
      background: #e63946; color: white; font-size: 10px; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%;
      display: none; align-items: center; justify-content: center;
      font-family: 'Inter', sans-serif; border: 2px solid white;
    }
    #gm-notif-panel {
      position: fixed; bottom: 80px; right: 20px; z-index: 9001;
      width: 320px; max-height: 420px;
      background: #1a1714; border: 1px solid rgba(196,138,58,0.25);
      border-radius: 18px; overflow: hidden;
      box-shadow: 0 16px 50px rgba(0,0,0,0.5);
      display: none; flex-direction: column;
      font-family: 'Inter', sans-serif;
    }
    #gm-notif-panel.visible { display: flex; animation: slideUp .25s ease; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .gm-notif-header {
      padding: 16px 20px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex; align-items: center; justify-content: space-between;
    }
    .gm-notif-header h4 {
      color: #c48a3a; font-size: 13px; font-weight: 600;
      letter-spacing: .06em; text-transform: uppercase; margin: 0;
    }
    .gm-notif-header button {
      background: none; border: none; color: rgba(255,255,255,0.3);
      cursor: pointer; font-size: 16px; padding: 2px 6px;
      border-radius: 6px; transition: .15s;
    }
    .gm-notif-header button:hover { color: white; background: rgba(255,255,255,0.08); }
    #gm-notif-lista {
      overflow-y: auto; flex: 1;
      scrollbar-width: thin; scrollbar-color: rgba(196,138,58,0.3) transparent;
    }
    .gm-notif-item {
      padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05);
      cursor: pointer; transition: background .15s;
      display: flex; gap: 12px; align-items: flex-start;
    }
    .gm-notif-item:hover { background: rgba(255,255,255,0.04); }
    .gm-notif-item.no-leida { background: rgba(196,138,58,0.06); }
    .gm-notif-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
    .gm-notif-body { flex: 1; }
    .gm-notif-titulo {
      color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 500;
      margin: 0 0 3px; line-height: 1.3;
    }
    .gm-notif-texto {
      color: rgba(255,255,255,0.45); font-size: 12px; line-height: 1.4; margin: 0;
    }
    .gm-notif-tiempo {
      color: rgba(196,138,58,0.6); font-size: 10px; margin-top: 5px;
    }
    .gm-notif-empty {
      padding: 40px 20px; text-align: center;
      color: rgba(255,255,255,0.2); font-size: 13px;
    }
    .gm-toast {
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: #1a1714; border: 1px solid rgba(196,138,58,0.4);
      border-radius: 14px; padding: 14px 18px;
      max-width: 300px; display: flex; gap: 12px; align-items: flex-start;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      animation: toastIn .3s ease;
      font-family: 'Inter', sans-serif;
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .gm-toast-icon { font-size: 22px; flex-shrink: 0; }
    .gm-toast-content { flex: 1; }
    .gm-toast-title { color: #c48a3a; font-size: 13px; font-weight: 600; margin: 0 0 3px; }
    .gm-toast-msg { color: rgba(255,255,255,0.7); font-size: 12px; margin: 0; line-height: 1.4; }
    .gm-toast-close {
      background: none; border: none; color: rgba(255,255,255,0.3);
      cursor: pointer; font-size: 14px; padding: 0; align-self: flex-start;
    }
    #gm-pedir-permiso {
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      z-index: 9002; background: #1a1714;
      border: 1px solid rgba(196,138,58,0.4); border-radius: 16px;
      padding: 18px 22px; max-width: 320px; width: 90%;
      text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      font-family: 'Inter', sans-serif; display: none;
    }
    #gm-pedir-permiso p { color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 14px; line-height: 1.5; }
    #gm-pedir-permiso .btn-si {
      background: #c48a3a; color: white; border: none; border-radius: 10px;
      padding: 10px 24px; font-size: 13px; font-weight: 600; cursor: pointer;
      margin-right: 8px; font-family: 'Inter', sans-serif; transition: .2s;
    }
    #gm-pedir-permiso .btn-si:hover { background: #a8742f; }
    #gm-pedir-permiso .btn-no {
      background: transparent; color: rgba(255,255,255,0.35);
      border: 1px solid rgba(255,255,255,0.15); border-radius: 10px;
      padding: 10px 18px; font-size: 13px; cursor: pointer;
      font-family: 'Inter', sans-serif; transition: .2s;
    }
    #gm-pedir-permiso .btn-no:hover { color: rgba(255,255,255,0.6); }
    @media (max-width: 480px) {
      #gm-notif-btn { bottom: 85px; right: 16px; }
      #gm-notif-panel { right: 10px; left: 10px; width: auto; bottom: 138px; }
    }
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // Botón flotante
  const btn = document.createElement("div");
  btn.id = "gm-notif-btn";
  btn.innerHTML = `🔔<span id="gm-notif-badge"></span>`;
  btn.onclick = togglePanel;
  document.body.appendChild(btn);

  // Panel
  const panel = document.createElement("div");
  panel.id = "gm-notif-panel";
  panel.innerHTML = `
    <div class="gm-notif-header">
      <h4>🐾 Notificaciones</h4>
      <button onclick="document.getElementById('gm-notif-panel').classList.remove('visible')">✕</button>
    </div>
    <div id="gm-notif-lista"><div class="gm-notif-empty">No hay notificaciones aún</div></div>
  `;
  document.body.appendChild(panel);

  // Prompt permiso
  const prompt = document.createElement("div");
  prompt.id = "gm-pedir-permiso";
  prompt.innerHTML = `
    <p>🔔 ¿Activar notificaciones para reservas, pedidos y comunidad?</p>
    <button class="btn-si" onclick="window.notif.pedirPermiso(true)">Activar</button>
    <button class="btn-no" onclick="this.parentElement.style.display='none'; localStorage.setItem('gm-notif-denied','1')">Ahora no</button>
  `;
  document.body.appendChild(prompt);
}

function togglePanel() {
  const panel = document.getElementById("gm-notif-panel");
  panel.classList.toggle("visible");
  if (panel.classList.contains("visible")) marcarLeidas();
}

function mostrarToast(icon, title, msg, url) {
  const toast = document.createElement("div");
  toast.className = "gm-toast";
  toast.innerHTML = `
    <span class="gm-toast-icon">${icon}</span>
    <div class="gm-toast-content">
      <p class="gm-toast-title">${title}</p>
      <p class="gm-toast-msg">${msg}</p>
    </div>
    <button class="gm-toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  if (url) toast.style.cursor = "pointer";
  toast.onclick = (e) => { if (!e.target.classList.contains("gm-toast-close") && url) window.location.href = url; };
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}

function actualizarBadge(n) {
  const badge = document.getElementById("gm-notif-badge");
  if (!badge) return;
  if (n > 0) { badge.style.display = "flex"; badge.textContent = n > 9 ? "9+" : n; }
  else badge.style.display = "none";
}

function tiempoRelativo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return Math.floor(diff / 60) + " min";
  if (diff < 86400) return Math.floor(diff / 3600) + " h";
  return Math.floor(diff / 86400) + " d";
}

// ─── Guardar token FCM en Firestore ─────────────────────────────
async function guardarToken(user) {
  if (!messaging || !user) return;
  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;
    const isAdmin = user.email === ADMIN_EMAIL;
    await setDoc(doc(db, "tokens_fcm", user.uid), {
      token,
      email: user.email,
      uid: user.uid,
      isAdmin,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn("[Notif] No se pudo guardar token:", e.message);
  }
}

// ─── Escuchar notificaciones en Firestore (in-app) ──────────────
function escucharNotificaciones(uid) {
  const q = query(
    collection(db, "notificaciones"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(30)
  );
  onSnapshot(q, (snap) => {
    const lista = document.getElementById("gm-notif-lista");
    if (!lista) return;
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const noLeidas = items.filter(i => !i.leida).length;
    actualizarBadge(noLeidas);
    if (items.length === 0) {
      lista.innerHTML = `<div class="gm-notif-empty">No hay notificaciones aún 🐾</div>`;
      return;
    }
    lista.innerHTML = items.map(item => `
      <div class="gm-notif-item ${item.leida ? "" : "no-leida"}" onclick="window._irNotif('${item.id}','${item.url || ""}')">
        <span class="gm-notif-icon">${item.icon || "🔔"}</span>
        <div class="gm-notif-body">
          <p class="gm-notif-titulo">${item.titulo || ""}</p>
          <p class="gm-notif-texto">${item.texto || ""}</p>
          <p class="gm-notif-tiempo">${tiempoRelativo(item.createdAt)}</p>
        </div>
      </div>
    `).join("");
  });

  window._irNotif = async (id, url) => {
    await updateDoc(doc(db, "notificaciones", id), { leida: true }).catch(() => {});
    if (url) window.location.href = url;
  };
}

async function marcarLeidas() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  // Las marcamos como leidas cuando abren el panel
  // (el badge desaparece pero los items quedan en historial)
  actualizarBadge(0);
}

// ─── Función pública: crear notificación en Firestore ────────────
// Esta función escribe en Firestore → la Cloud Function la detecta y envía el push.
// También puedes llamarla directamente para notifs in-app sin push.
async function crearNotificacion({ uid, titulo, texto, icon, url, tipo }) {
  await addDoc(collection(db, "notificaciones"), {
    uid,
    titulo,
    texto,
    icon: icon || "🔔",
    url: url || "",
    tipo: tipo || "general",
    leida: false,
    createdAt: serverTimestamp()
  });
}

// ─── Función pública: disparar eventos de negocio ────────────────
//
//  TIPOS:
//  "chat_cliente"    → cliente escribió al admin
//  "chat_admin"      → admin respondió al cliente
//  "reserva_nueva"   → cliente reservó cupo en taller
//  "compra_nueva"    → cliente compró pieza
//  "pago_validado"   → admin validó el pago del cliente
//  "post_comunidad"  → alguien publicó en comunidad
//
async function enviarNotif(tipo, datos = {}) {
  const user = auth.currentUser;
  // Obtener UID del admin desde Firestore
  let adminUid = null;
  try {
    const snap = await getDocs(query(collection(db, "tokens_fcm"), where("isAdmin", "==", true)));
    if (!snap.empty) adminUid = snap.docs[0].data().uid;
  } catch (e) {}

  switch (tipo) {

    case "chat_cliente": {
      // Cliente escribió → notificar al admin
      if (!adminUid) break;
      await crearNotificacion({
        uid: adminUid,
        titulo: "💬 Nuevo mensaje de cliente",
        texto: `${datos.nombreCliente || "Un cliente"}: "${datos.preview || ""}"`,
        icon: "💬", url: "panel-admin.html", tipo
      });
      break;
    }

    case "chat_admin": {
      // Admin respondió → notificar al cliente
      if (!datos.clienteUid) break;
      await crearNotificacion({
        uid: datos.clienteUid,
        titulo: "💬 Tienes un mensaje de Gato Miel",
        texto: datos.preview || "Tenemos una respuesta para ti 🐾",
        icon: "💬", url: "index.html", tipo
      });
      break;
    }

    case "reserva_nueva": {
      // Cliente reservó → notificar al admin
      if (!adminUid) break;
      await crearNotificacion({
        uid: adminUid,
        titulo: "📅 Nueva reserva de taller",
        texto: `${datos.nombreCliente || "Un cliente"} reservó en ${datos.taller || "un taller"}`,
        icon: "📅", url: "panel-admin.html", tipo
      });
      break;
    }

    case "compra_nueva": {
      // Cliente compró → notificar al admin
      if (!adminUid) break;
      await crearNotificacion({
        uid: adminUid,
        titulo: "🛍 Nueva compra recibida",
        texto: `${datos.nombreCliente || "Un cliente"} compró: ${datos.pieza || "una pieza"}`,
        icon: "🛍", url: "panel-admin.html", tipo
      });
      break;
    }

    case "pago_validado": {
      // Admin validó → notificar al cliente
      if (!datos.clienteUid) break;
      await crearNotificacion({
        uid: datos.clienteUid,
        titulo: "✅ ¡Tu pago fue confirmado!",
        texto: datos.detalle || "Tu reserva / pedido ha sido aprobado 🎉",
        icon: "✅", url: datos.url || "coleccion.html", tipo
      });
      break;
    }

    case "post_comunidad": {
      // Alguien publicó → notificar a TODOS los usuarios registrados
      // Escribe una notif "broadcast" que la Cloud Function enviará a todos
      await addDoc(collection(db, "notificaciones_broadcast"), {
        titulo: "🌿 Nueva publicación en Comunidad",
        texto: `${datos.autor || "Alguien"} compartió algo nuevo`,
        icon: "🌿", url: "comunidad.html",
        tipo, createdAt: serverTimestamp()
      });
      break;
    }
  }
}

// ─── INIT ────────────────────────────────────────────────────────
crearUI();

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  // Escuchar notificaciones in-app
  escucharNotificaciones(user.uid);

  // Pedir permiso de push si no se ha dado / negado
  const permisoDado = localStorage.getItem("gm-notif-ok");
  const permisoDenegado = localStorage.getItem("gm-notif-denied");
  if (!permisoDado && !permisoDenegado && Notification.permission === "default") {
    setTimeout(() => {
      const prompt = document.getElementById("gm-pedir-permiso");
      if (prompt) prompt.style.display = "block";
    }, 3000);
  }
  if (Notification.permission === "granted" && !permisoDado) {
    await guardarToken(user);
    localStorage.setItem("gm-notif-ok", "1");
  }

  // Notificaciones en foreground (app abierta)
  if (messaging) {
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      mostrarToast("🔔", title || "Gato Miel", body || "", payload.data?.url);
    });
  }
});

// ─── Pedir permiso manualmente ────────────────────────────────────
async function pedirPermiso(fromButton = false) {
  const prompt = document.getElementById("gm-pedir-permiso");
  if (prompt) prompt.style.display = "none";
  const result = await Notification.requestPermission();
  if (result === "granted") {
    localStorage.setItem("gm-notif-ok", "1");
    const user = auth.currentUser;
    if (user) await guardarToken(user);
    if (fromButton) mostrarToast("✅", "¡Listo!", "Las notificaciones están activadas 🐾");
  } else {
    localStorage.setItem("gm-notif-denied", "1");
  }
}

// ─── API pública ──────────────────────────────────────────────────
window.notif = { pedirPermiso, enviarNotif, crearNotificacion, mostrarToast };
