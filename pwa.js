import { initializeApp, getApps }     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, orderBy, limit, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

const FC = {
  apiKey:"AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs", authDomain:"gato-miel-estudio.firebaseapp.com",
  projectId:"gato-miel-estudio", storageBucket:"gato-miel-estudio.firebasestorage.app",
  messagingSenderId:"150671559458", appId:"1:150671559458:web:6daaf4a78150706db0337b"
};
const VAPID_KEY  = "BOXc74eAxBMYQpwrWThCtU8Db7du05d8p3Js2rrEEwsF_-wkol0qbdwE9iMq7RIYrRKT4_r3T8bN_hHJpYL8bns";
const ADMINS     = ["jhonanibal576@gmail.com","gatomielstudio@gmail.com"];
const NOTIFY_URL = "/api/notify";
const SECRET     = "gatomiel2026secret";  /* mismo valor que en Vercel env NOTIFY_SECRET */

const app  = getApps().length ? getApps()[0] : initializeApp(FC);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ── Llamar al endpoint de Vercel para enviar push ── */
async function notificar(tipo, datos) {
  try {
    await fetch(NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type":"application/json", "x-notify-secret": SECRET },
      body: JSON.stringify({ tipo, datos })
    });
  } catch(e) { console.warn("notify fetch error:", e); }
}

/* ── Registrar SW ── */
async function registrarSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;
    return reg;
  } catch(e) { return null; }
}

/* ── Iniciar FCM ── */
async function iniciarFCM(user) {
  try {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;

    const reg = await registrarSW();
    if (!reg) return;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return;

    /* Guardar token en Firestore */
    await setDoc(doc(db, "users", user.uid), {
      fcmToken:  token,
      email:     user.email || "",
      nombre:    user.displayName || user.email?.split("@")[0] || "",
      esAdmin:   ADMINS.includes(user.email?.toLowerCase()),
      updatedAt: new Date()
    }, { merge: true });

    /* Mensajes en primer plano */
    onMessage(messaging, payload => {
      const n = payload.notification || {};
      const d = payload.data || {};
      const notif = new Notification(n.title||"Gato Miel 🐾", {
        body: n.body||d.body||"", icon:"/Assets/Img/Logo.jpg", badge:"/Assets/Img/Logo.jpg"
      });
      notif.onclick = () => { window.focus(); window.location.href = d.url||"/index.html"; notif.close(); };
    });

  } catch(err) { console.warn("FCM error:", err.message); }
}

/* ── Escuchar Firestore y disparar push via /api/notify ── */
let _unsubs = [];
let _primerChats=true, _primerPosts=true, _primerPagos=true, _ultimoPost=null;

function limpiar() { _unsubs.forEach(u=>u()); _unsubs=[]; }

onAuthStateChanged(auth, async user => {
  limpiar();
  _primerChats=true; _primerPosts=true; _primerPagos=true;
  if (!user) return;

  await iniciarFCM(user);
  const esAdmin = ADMINS.includes(user.email?.toLowerCase());

  /* ADMIN: mensajes de clientes no leídos */
  if (esAdmin) {
    _unsubs.push(onSnapshot(
      query(collection(db,"chats"), where("noLeidosAdmin","==",true)),
      snap => {
        if (_primerChats) { _primerChats=false; return; }
        snap.docChanges().forEach(ch => {
          if (ch.type==="added"||ch.type==="modified") {
            const d = ch.doc.data();
            notificar("chat_cliente", { uid:ch.doc.id, nombre:d.nombreUsuario||d.email, texto:d.ultimoMensaje });
          }
        });
      }
    ));

    /* ADMIN: pagos nuevos */
    _unsubs.push(onSnapshot(
      query(collection(db,"pedidos"), where("estado","==","pendiente"), orderBy("fecha","desc"), limit(10)),
      snap => {
        if (_primerPagos) { _primerPagos=false; return; }
        snap.docChanges().forEach(ch => {
          if (ch.type==="added") {
            const d = ch.doc.data();
            notificar("nuevo_pago", { id:ch.doc.id, producto:d.producto, nombre:d.nombre||d.email, monto:d.monto, metodo:d.metodo });
          }
        });
      }
    ));

    _unsubs.push(onSnapshot(
      query(collection(db,"membresias"), where("estado","==","pendiente"), orderBy("fecha","desc"), limit(10)),
      snap => {
        snap.docChanges().forEach(ch => {
          if (ch.type==="added") {
            const d = ch.doc.data();
            notificar("nueva_membresia", { id:ch.doc.id, taller:d.tallerId, nombre:d.usuarioNombre||d.usuarioEmail, precio:d.precio||d.monto });
          }
        });
      }
    ));
  }

  /* CLIENTE: respuestas del admin */
  if (!esAdmin) {
    _unsubs.push(onSnapshot(
      query(collection(db,"chats",user.uid,"mensajes"), where("rol","==","admin"), orderBy("fecha","desc"), limit(1)),
      snap => {
        if (_primerChats) { _primerChats=false; return; }
        snap.docChanges().forEach(ch => {
          if (ch.type==="added") {
            const d = ch.doc.data();
            notificar("chat_admin", { uid:user.uid, texto:d.texto });
          }
        });
      }
    ));
  }

  /* TODOS: posts nuevos en comunidad */
  _unsubs.push(onSnapshot(
    query(collection(db,"posts"), orderBy("fecha","desc"), limit(1)),
    snap => {
      if (_primerPosts) { _primerPosts=false; if(!snap.empty) _ultimoPost=snap.docs[0].id; return; }
      snap.docChanges().forEach(ch => {
        if (ch.type==="added" && ch.doc.id!==_ultimoPost) {
          _ultimoPost = ch.doc.id;
          const d = ch.doc.data();
          notificar("nuevo_post", { postId:ch.doc.id, autor:d.nombreUsuario||d.autor });
        }
      });
    }
  ));
});
