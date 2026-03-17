import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const VAPID_KEY = "BOXc74eAxBMYQpwrWThCtU8Db7du05d8p3Js2rrEEwsF_-wkol0qbdwE9iMq7RIYrRKT4_r3T8bN_hHJpYL8bns";
const ADMIN_EMAIL = "gatomielstudio@gmail.com";

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

function crearUI() {
  if (document.getElementById("gm-notif-panel")) return;
  const css = `
    #gm-notif-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9000;
      width: 46px; height: 46px; border-radius: 50%;
      background: #c48a3a; border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(196,138,58,0.45);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, background .2s; font-size: 20px;
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
    .gm-notif-tiempo { color: rgba(196,138,58,0.6); font-size: 10px; margin-top: 5px; }
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
      animation: toastIn .3s ease; font-family: 'Inter', sans-serif;
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

  const btn = document.createElement("div");
  btn.id = "gm-notif-btn";
  btn.innerHTML = `🔔<span id="gm-notif-badge"></span>`;
  btn.onclick = togglePanel;
  document.body.appendChild(btn);

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
  if (panel.classList.contains("visible")) actualizarBadge(0);
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

async function guardarToken(user) {
  if (!messaging || !user) return;
  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;
    const isAdmin = user.email === ADMIN_EMAIL;
    await setDoc(doc(db, "tokens_fcm", user.uid), {
      token, email: user.email, uid: user.uid, isAdmin,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn("[Notif] No se pudo guardar token:", e.message);
  }
}

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
    const items = snap.docs.map(d
