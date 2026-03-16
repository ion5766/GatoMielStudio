/* ═══════════════════════════════════════════════
   PWA.JS — Notificaciones via /api/notify
   ═══════════════════════════════════════════════ */
import { initializeApp, getApps }     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FC = {
  apiKey:"AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs",
  authDomain:"gato-miel-estudio.firebaseapp.com",
  projectId:"gato-miel-estudio",
  storageBucket:"gato-miel-estudio.firebasestorage.app",
  messagingSenderId:"150671559458",
  appId:"1:150671559458:web:6daaf4a78150706db0337b"
};

const ADMINS  = ["jhonanibal576@gmail.com","gatomielstudio@gmail.com"];
const SECRET  = "gatomiel2026secret";

const app = getApps().length ? getApps()[0] : initializeApp(FC);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ── Llamar al endpoint seguro de Vercel ── */
async function notificar(tipo, datos) {
  try {
    const r = await fetch("/api/notify", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-notify-secret":   SECRET
      },
      body: JSON.stringify({ tipo, datos })
    });
    const json = await r.json();
    console.log("notify:", tipo, json);
  } catch(e) {
    console.warn("notify error:", e.message);
  }
}

/* ── Registrar usuario en OneSignal con su uid ── */
function tagUsuario(user) {
  const esAdmin = ADMINS.includes(user.email?.toLowerCase());
  if (!window.OneSignal) return;
  try {
    OneSignal.login(user.uid);
    OneSignal.User.addTag("esAdmin", esAdmin ? "true" : "false");
    OneSignal.User.addTag("email", user.email || "");
  } catch(e) {}
}

/* ── Escuchar Firestore ── */
let _unsubs = [];
let _primerChats=true, _primerPosts=true, _primerPagosP=true, _primerPagosM=true;
let _ultimoPost = null;

function limpiar() { _unsubs.forEach(u=>u()); _unsubs=[]; }

onAuthStateChanged(auth, async user => {
  limpiar();
  _primerChats=true; _primerPosts=true; _primerPagosP=true; _primerPagosM=true;
  if (!user) return;

  tagUsuario(user);
  const esAdmin = ADMINS.includes(user.email?.toLowerCase());

  /* ADMIN: cliente envía mensaje */
  if (esAdmin) {
    _unsubs.push(onSnapshot(
      query(collection(db,"chats"), where("noLeidosAdmin","==",true)),
      snap => {
        if (_primerChats) { _primerChats=false; return; }
        snap.docChanges().forEach(ch => {
          if (ch.type==="added"||ch.type==="modified") {
            const d = ch.doc.data();
            notificar("chat_cliente", {
              uid:    ch.doc.id,
              nombre: d.nombreUsuario||d.email||"Cliente",
              texto:  d.ultimoMensaje||"Nuevo mensaje"
            });
          }
        });
      }
    ));

    /* ADMIN: pago nuevo colección */
    _unsubs.push(onSnapshot(
      query(collection(db,"pedidos"), where("estado","==","pendiente"), orderBy("fecha","desc"), limit(20)),
      snap => {
        if (_primerPagosP) { _primerPagosP=false; return; }
        snap.docChanges().forEach(ch => {
          if (ch.type==="added") {
            const d = ch.doc.data();
            notificar("nuevo_pago", {
              producto: d.producto||"Colección",
              nombre:   d.nombre||d.email||"Cliente",
              monto:    d.monto||"—",
              metodo:   d.metodo||"—"
            });
          }
        });
      }
    ));

    /* ADMIN: membresía nueva */
    _unsubs.push(onSnapshot(
      query(collection(db,"membresias"), where("estado","==","pendiente"), orderBy("fecha","desc"), limit(20)),
      snap => {
        if (_primerPagosM) { _primerPagosM=false; return; }
        snap.docChanges().forEach(ch => {
          if (ch.type==="added") {
            const d = ch.doc.data();
            notificar("nueva_membresia", {
              taller: d.tallerId||"Taller",
              nombre: d.usuarioNombre||d.usuarioEmail||"Cliente",
              precio: d.precio||d.monto||"—"
            });
          }
        });
      }
    ));
  }

  /* CLIENTE: admin responde */
  if (!esAdmin) {
    let primerResp = true;
    _unsubs.push(onSnapshot(
      query(collection(db,"chats",user.uid,"mensajes"), where("rol","==","admin"), orderBy("fecha","desc"), limit(1)),
      snap => {
        if (primerResp) { primerResp=false; return; }
        snap.docChanges().forEach(ch => {
          if (ch.type==="added") {
            notificar("chat_admin", {
              uid:   user.uid,
              texto: ch.doc.data().texto||"Tienes una respuesta"
            });
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
          notificar("nuevo_post", {
            postId: ch.doc.id,
            autor:  d.nombreUsuario||d.autor||"Alguien"
          });
        }
      });
    }
  ));
});
