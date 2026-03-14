/* ═══════════════════════════════════════════════
   PWA.JS — Notificaciones via OneSignal (simple)
   ═══════════════════════════════════════════════ */
import { initializeApp, getApps }      from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FC = {
  apiKey:"AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs", authDomain:"gato-miel-estudio.firebaseapp.com",
  projectId:"gato-miel-estudio", storageBucket:"gato-miel-estudio.firebasestorage.app",
  messagingSenderId:"150671559458", appId:"1:150671559458:web:6daaf4a78150706db0337b"
};
const ADMINS = ["jhonanibal576@gmail.com","gatomielstudio@gmail.com"];
const app  = getApps().length ? getApps()[0] : initializeApp(FC);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ── Enviar notificación via OneSignal REST API ── */
async function notificar(titulo, cuerpo, url) {
  try {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + window._osKey   // se setea abajo
      },
      body: JSON.stringify({
        app_id:             window._osAppId,
        included_segments:  ["All"],
        headings:           { en: titulo, es: titulo },
        contents:           { en: cuerpo, es: cuerpo },
        url:                "https://gato-miel-studio.vercel.app" + url,
        chrome_web_icon:    "https://gato-miel-studio.vercel.app/Assets/Img/Logo.jpg",
        firefox_icon:       "https://gato-miel-studio.vercel.app/Assets/Img/Logo.jpg"
      })
    });
  } catch(e) { console.warn("OneSignal error:", e); }
}

/* ── Escuchar Firestore y disparar notificaciones ── */
let _unsubs = [];
let _primerChats=true, _primerPosts=true, _primerPagos=true, _ultimoPost=null;

function limpiar() { _unsubs.forEach(u=>u()); _unsubs=[]; }

onAuthStateChanged(auth, async user => {
  limpiar();
  _primerChats=true; _primerPosts=true; _primerPagos=true;
  if (!user) return;

  const esAdmin = ADMINS.includes(user.email?.toLowerCase());

  /* ADMIN: mensajes nuevos de clientes */
  if (esAdmin) {
    _unsubs.push(onSnapshot(
      query(collection(db,"chats"), where("noLeidosAdmin","==",true)),
      snap => {
        if (_primerChats) { _primerChats=false; return; }
        snap.docChanges().forEach(ch => {
          if (ch.type==="added"||ch.type==="modified") {
            const d = ch.doc.data();
            notificar(`💬 ${d.nombreUsuario||"Cliente"}`, d.ultimoMensaje||"Te escribió", "/panel-admin.html");
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
            notificar(`💰 Nuevo pago`, `${d.nombre||"Cliente"} · S/ ${d.monto||"—"}`, "/panel-admin.html");
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
            notificar(`🎫 Nueva membresía`, `${d.usuarioNombre||"Cliente"} · ${d.tallerId||"Taller"}`, "/panel-admin.html");
          }
        });
      }
    ));
  }

  /* CLIENTE: respuesta del admin */
  if (!esAdmin) {
    let primerResp = true;
    _unsubs.push(onSnapshot(
      query(collection(db,"chats",user.uid,"mensajes"), where("rol","==","admin"), orderBy("fecha","desc"), limit(1)),
      snap => {
        if (primerResp) { primerResp=false; return; }
        snap.docChanges().forEach(ch => {
          if (ch.type==="added") {
            notificar("🐾 Gato Miel te respondió", ch.doc.data().texto||"Tienes una respuesta", "/index.html");
          }
        });
      }
    ));
  }

  /* TODOS: post nuevo en comunidad */
  _unsubs.push(onSnapshot(
    query(collection(db,"posts"), orderBy("fecha","desc"), limit(1)),
    snap => {
      if (_primerPosts) { _primerPosts=false; if(!snap.empty) _ultimoPost=snap.docs[0].id; return; }
      snap.docChanges().forEach(ch => {
        if (ch.type==="added" && ch.doc.id!==_ultimoPost) {
          _ultimoPost=ch.doc.id;
          const d=ch.doc.data();
          notificar("🏺 Nueva obra en Comunidad", `${d.nombreUsuario||"Alguien"} compartió una pieza`, "/comunidad.html");
        }
      });
    }
  ));
});
