/* ═══════════════════════════════════════════
   PWA.JS — Gato Miel · Notificaciones push
   · Admin → nuevo mensaje de cliente
   · Cliente → respuesta del admin
   · Todos → post nuevo en comunidad
   · Admin → pago realizado (coleccion/taller)
   ═══════════════════════════════════════════ */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FC = { apiKey:"AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs", authDomain:"gato-miel-estudio.firebaseapp.com", projectId:"gato-miel-estudio", storageBucket:"gato-miel-estudio.firebasestorage.app", messagingSenderId:"150671559458", appId:"1:150671559458:web:6daaf4a78150706db0337b" };
const ADMINS = ["jhonanibal576@gmail.com","gatomielstudio@gmail.com"];
const app  = getApps().length ? getApps()[0] : initializeApp(FC);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ── Registrar SW ── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(r => { window._swReg = r; })
      .catch(() => {});
  });
}

/* ── Pedir permiso ── */
async function pedirPermiso() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied")  return false;
  return (await Notification.requestPermission()) === "granted";
}

/* ── Notificar ── */
function notificar(titulo, cuerpo, url, tag) {
  if (Notification.permission !== "granted") return;
  const opts = { body:cuerpo, icon:"/Assets/Img/Logo.jpg", badge:"/Assets/Img/Logo.jpg", tag:tag||"gm", data:{url}, vibrate:[200,100,200] };
  if (window._swReg) window._swReg.showNotification(titulo, opts);
  else new Notification(titulo, opts);
}

/* ── Listeners por usuario ── */
let _unsubs = [];
let _primerasChatAdmin = true;
let _primerasChatUser  = true;
let _primerasPosts     = true;
let _primerasPagos     = true;
let _ultimoPost = null;

function limpiar() { _unsubs.forEach(u => u()); _unsubs = []; }

onAuthStateChanged(auth, async user => {
  limpiar();
  _primerasChatAdmin = true;
  _primerasChatUser  = true;
  _primerasPosts     = true;
  _primerasPagos     = true;
  if (!user) return;

  await pedirPermiso();
  const esAdmin = ADMINS.includes(user.email?.toLowerCase());

  /* ── 1. ADMIN: mensajes no leídos de clientes ── */
  if (esAdmin) {
    const q1 = query(collection(db,"chats"), where("noLeidosAdmin","==",true));
    _unsubs.push(onSnapshot(q1, snap => {
      if (_primerasChatAdmin) { _primerasChatAdmin = false; return; }
      snap.docChanges().forEach(ch => {
        if (ch.type==="added"||ch.type==="modified") {
          const d = ch.doc.data();
          notificar(`💬 Mensaje de ${d.nombreUsuario||"cliente"}`, d.ultimoMensaje||"Te escribió", "/panel-admin.html", "chat-"+ch.doc.id);
        }
      });
    }));

    /* ── 2. ADMIN: pagos nuevos (pedidos + membresías) ── */
    const q2 = query(collection(db,"pedidos"), where("estado","==","pendiente"), orderBy("fecha","desc"), limit(5));
    _unsubs.push(onSnapshot(q2, snap => {
      if (_primerasPagos) { _primerasPagos = false; return; }
      snap.docChanges().forEach(ch => {
        if (ch.type==="added") {
          const d = ch.doc.data();
          notificar(`💰 Nuevo pago — ${d.producto||"Colección"}`, `${d.nombre||d.email||"Cliente"} · S/ ${d.monto||"—"} via ${d.metodo||"—"}`, "/panel-admin.html", "pago-"+ch.doc.id);
        }
      });
    }));

    const q3 = query(collection(db,"membresias"), where("estado","==","pendiente"), orderBy("fecha","desc"), limit(5));
    _unsubs.push(onSnapshot(q3, snap => {
      snap.docChanges().forEach(ch => {
        if (ch.type==="added") {
          const d = ch.doc.data();
          notificar(`🎫 Nueva membresía — ${d.tallerId||"Taller"}`, `${d.usuarioNombre||d.usuarioEmail||"Cliente"} · S/ ${d.precio||"—"}`, "/panel-admin.html", "memb-"+ch.doc.id);
        }
      });
    }));
  }

  /* ── 3. CLIENTE: respuestas del admin en su chat ── */
  if (!esAdmin) {
    const qUser = query(collection(db,"chats",user.uid,"mensajes"), where("rol","==","admin"), orderBy("fecha","desc"), limit(1));
    _unsubs.push(onSnapshot(qUser, snap => {
      if (_primerasChatUser) { _primerasChatUser = false; return; }
      snap.docChanges().forEach(ch => {
        if (ch.type==="added") {
          const d = ch.doc.data();
          notificar("🐾 Respuesta de Gato Miel", d.texto||"Te respondieron", "/index.html", "resp-"+ch.doc.id);
        }
      });
    }));
  }

  /* ── 4. TODOS: post nuevo en comunidad ── */
  const qPosts = query(collection(db,"posts"), orderBy("fecha","desc"), limit(1));
  _unsubs.push(onSnapshot(qPosts, snap => {
    if (_primerasPosts) {
      _primerasPosts = false;
      if (!snap.empty) _ultimoPost = snap.docs[0].id;
      return;
    }
    snap.docChanges().forEach(ch => {
      if (ch.type==="added" && ch.doc.id !== _ultimoPost) {
        _ultimoPost = ch.doc.id;
        const d = ch.doc.data();
        notificar("🏺 Nueva obra en Comunidad", `${d.nombreUsuario||"Alguien"} compartió una pieza`, "/comunidad.html", "post-"+ch.doc.id);
      }
    });
  }));
});
