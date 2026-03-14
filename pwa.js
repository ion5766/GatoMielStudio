import { initializeApp, getApps }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, orderBy, limit, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

const FC = {
  apiKey:            "AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs",
  authDomain:        "gato-miel-estudio.firebaseapp.com",
  projectId:         "gato-miel-estudio",
  storageBucket:     "gato-miel-estudio.firebasestorage.app",
  messagingSenderId: "150671559458",
  appId:             "1:150671559458:web:6daaf4a78150706db0337b"
};

const VAPID_KEY = "BOXc74eAxBMYQpwrWThCtU8Db7du05d8p3Js2rrEEwsF_-wkol0qbdwE9iMq7RIYrRKT4_r3T8bN_hHJpYL8bns";
const ADMINS   = ["jhonanibal576@gmail.com","gatomielstudio@gmail.com"];

const app  = getApps().length ? getApps()[0] : initializeApp(FC);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ── 1. Registrar el SW de Firebase Messaging ── */
async function registrarSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;
    window._swReg = reg;
    return reg;
  } catch(e) {
    console.warn("SW error:", e); return null;
  }
}

/* ── 2. Iniciar FCM y guardar token ── */
async function iniciarFCM(user) {
  try {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;

    const reg = await registrarSW();
    if (!reg) return;

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: reg
    });

    if (!token) return;

    /* Guardar token en Firestore → las Cloud Functions lo usan para enviar push */
    await setDoc(doc(db, "users", user.uid), {
      fcmToken:  token,
      email:     user.email || "",
      nombre:    user.displayName || user.email?.split("@")[0] || "",
      esAdmin:   ADMINS.includes(user.email?.toLowerCase()),
      updatedAt: new Date()
    }, { merge: true });

    console.log("✓ FCM listo — notificaciones activadas");

    /* ── 3. Mensajes en PRIMER PLANO (app abierta) ── */
    onMessage(messaging, payload => {
      const n = payload.notification || {};
      const d = payload.data || {};
      const titulo = n.title || d.title || "Gato Miel 🐾";
      const cuerpo = n.body  || d.body  || "Nueva notificación";
      const url    = d.url   || "/index.html";

      if (Notification.permission === "granted") {
        const notif = new Notification(titulo, {
          body:  cuerpo,
          icon:  "/Assets/Img/Logo.jpg",
          badge: "/Assets/Img/Logo.jpg",
          tag:   d.tag || "gm-fg"
        });
        notif.onclick = () => { window.focus(); window.location.href = url; notif.close(); };
      }
    });

  } catch(err) {
    console.warn("FCM init error:", err.message);
  }
}

/* ── 4. Arrancar cuando hay usuario logueado ── */
onAuthStateChanged(auth, user => {
  if (user) iniciarFCM(user);
});
