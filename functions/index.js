// ═══════════════════════════════════════════════════════════════════
// functions/index.js  —  CLOUD FUNCTIONS DE FIREBASE
// Gato Miel Estudio
//
// SETUP (ejecutar en terminal una sola vez):
//   npm install -g firebase-tools
//   firebase login
//   firebase init functions   (elige tu proyecto: gato-miel-estudio)
//   cd functions && npm install
//   firebase deploy --only functions
//
// ═══════════════════════════════════════════════════════════════════

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp }     = require("firebase-admin/app");
const { getFirestore }      = require("firebase-admin/firestore");
const { getMessaging }      = require("firebase-admin/messaging");

initializeApp();
const db  = getFirestore();
const fcm = getMessaging();

// ─── Función auxiliar: enviar push a un UID ──────────────────────
async function pushAUid(uid, title, body, url = "/index.html") {
  try {
    const tokenDoc = await db.collection("tokens_fcm").doc(uid).get();
    if (!tokenDoc.exists) return;
    const token = tokenDoc.data().token;
    if (!token) return;

    await fcm.send({
      token,
      notification: { title, body },
      webpush: {
        notification: {
          title, body,
          icon: "https://gato-miel-estudio.web.app/Assets/Img/Logo.jpg",
          badge: "https://gato-miel-estudio.web.app/Assets/Img/Logo.jpg",
          vibrate: [200, 100, 200],
          data: { url }
        },
        fcmOptions: { link: "https://gato-miel-estudio.web.app" + url }
      }
    });
  } catch (e) {
    console.log("Push error:", e.message);
    // Si el token expiró, eliminarlo
    if (e.code === "messaging/registration-token-not-registered") {
      await db.collection("tokens_fcm").doc(uid).delete().catch(() => {});
    }
  }
}

// ─── Función auxiliar: enviar push a TODOS los usuarios ──────────
async function pushATodos(title, body, url = "/comunidad.html") {
  const snap = await db.collection("tokens_fcm").get();
  const tokens = snap.docs.map(d => d.data().token).filter(Boolean);
  if (tokens.length === 0) return;

  // Multicast en lotes de 500 (límite FCM)
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));
  for (const chunk of chunks) {
    await fcm.sendEachForMulticast({
      tokens: chunk,
      notification: { title, body },
      webpush: {
        notification: {
          title, body,
          icon: "https://gato-miel-estudio.web.app/Assets/Img/Logo.jpg",
          data: { url }
        },
        fcmOptions: { link: "https://gato-miel-estudio.web.app" + url }
      }
    }).catch(e => console.log("Multicast error:", e.message));
  }
}

// ═══════════════════════════════════════════════════════════════════
// TRIGGER 1: Nueva notificación individual → enviar push
// Cuando notifications.js crea un doc en /notificaciones
// ═══════════════════════════════════════════════════════════════════
exports.enviarPushIndividual = onDocumentCreated(
  "notificaciones/{docId}",
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.uid) return;

    const { uid, titulo, texto, url, tipo } = data;
    await pushAUid(uid, titulo || "Gato Miel Estudio", texto || "", url || "/index.html");
    console.log(`Push enviado [${tipo}] → uid: ${uid}`);
  }
);

// ═══════════════════════════════════════════════════════════════════
// TRIGGER 2: Broadcast de comunidad → enviar push a TODOS
// ═══════════════════════════════════════════════════════════════════
exports.enviarPushBroadcast = onDocumentCreated(
  "notificaciones_broadcast/{docId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { titulo, texto, url } = data;
    await pushATodos(
      titulo || "🌿 Nueva publicación",
      texto || "Algo nuevo en la comunidad de Gato Miel 🐾",
      url || "/comunidad.html"
    );
    console.log("Push broadcast enviado a todos los usuarios");
  }
);

// ═══════════════════════════════════════════════════════════════════
// functions/package.json  (pégalo en functions/package.json)
// ═══════════════════════════════════════════════════════════════════
/*
{
  "name": "functions",
  "description": "Gato Miel Cloud Functions",
  "scripts": { "deploy": "firebase deploy --only functions" },
  "engines": { "node": "20" },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  }
}
*/
