/* ═══════════════════════════════════════════════════
   VERCEL SERVERLESS FUNCTION — /api/notify
   Archivo: api/notify.js  (en la raíz del proyecto)
   ═══════════════════════════════════════════════════ */

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging }                 = require("firebase-admin/messaging");
const { getFirestore }                 = require("firebase-admin/firestore");

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return initializeApp({ credential: cert(sa) });
}

const BASE_URL = "https://gato-miel-studio.vercel.app";
const ADMINS   = ["jhonanibal576@gmail.com","gatomielstudio@gmail.com"];

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (req.headers["x-notify-secret"] !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const app       = getAdminApp();
    const messaging = getMessaging(app);
    const db        = getFirestore(app);
    const { tipo, datos } = req.body;

    async function getTokens(emails) {
      const tokens = [];
      for (const email of emails) {
        const snap = await db.collection("users").where("email","==",email).limit(1).get();
        snap.forEach(d => { if (d.data().fcmToken) tokens.push(d.data().fcmToken); });
      }
      return tokens;
    }

    async function getAllTokens() {
      const snap = await db.collection("users").get();
      const tokens = [];
      snap.forEach(d => { if (d.data().fcmToken) tokens.push(d.data().fcmToken); });
      return tokens;
    }

    async function push(tokens, title, body, url, tag) {
      if (!tokens.length) return { sent:0 };
      const r = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data:         { title, body, url, tag: tag||"gm" },
        webpush: {
          notification: { icon: BASE_URL+"/Assets/Img/Logo.jpg", badge: BASE_URL+"/Assets/Img/Logo.jpg", vibrate:[200,100,200] },
          fcmOptions:   { link: BASE_URL + url }
        },
        android: { notification: { color:"#c48a3a" } }
      });
      return { sent: r.successCount, failed: r.failureCount };
    }

    let result;
    switch(tipo) {
      case "chat_cliente":
        result = await push(await getTokens(ADMINS), `💬 ${datos.nombre||"Cliente"}`, datos.texto||"Te escribió", "/panel-admin.html", "chat-"+datos.uid);
        break;
      case "chat_admin": {
        const snap = await db.collection("users").doc(datos.uid).get();
        const token = snap.data()?.fcmToken;
        result = token ? await push([token], "🐾 Gato Miel te respondió", datos.texto||"Tienes una respuesta", "/index.html", "resp-"+datos.uid) : {sent:0};
        break;
      }
      case "nuevo_post":
        result = await push(await getAllTokens(), "🏺 Nueva obra en Comunidad", `${datos.autor||"Alguien"} compartió una nueva pieza`, "/comunidad.html", "post-"+datos.postId);
        break;
      case "nuevo_pago":
        result = await push(await getTokens(ADMINS), `💰 Nuevo pago — ${datos.producto||"Colección"}`, `${datos.nombre||"Cliente"} · S/ ${datos.monto||"—"} via ${datos.metodo||"—"}`, "/panel-admin.html", "pago-"+datos.id);
        break;
      case "nueva_membresia":
        result = await push(await getTokens(ADMINS), `🎫 Nueva membresía — ${datos.taller||"Taller"}`, `${datos.nombre||"Cliente"} · S/ ${datos.precio||"—"}`, "/panel-admin.html", "memb-"+datos.id);
        break;
      default:
        return res.status(400).json({ error: "tipo desconocido" });
    }

    return res.status(200).json({ ok:true, result });
  } catch(err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
