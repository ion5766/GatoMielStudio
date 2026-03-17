const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp }     = require("firebase-admin/app");
const { getFirestore }      = require("firebase-admin/firestore");
const { getMessaging }      = require("firebase-admin/messaging");

initializeApp();
const db  = getFirestore();
const fcm = getMessaging();

// ─── Enviar push a TODOS los dispositivos de un UID ──────────────
async function pushAUid(uid, title, body, url = "/index.html") {
  try {
    // Leer todos los devices del usuario
    const devicesSnap = await db.collection("tokens_fcm").doc(uid).collection("devices").get();
    if (devicesSnap.empty) {
      console.log("Sin devices para uid:", uid);
      return;
    }
    const tokens = devicesSnap.docs.map(d => d.data().token).filter(Boolean);
    if (tokens.length === 0) return;

    console.log(`Enviando push a ${tokens.length} dispositivo(s) de uid: ${uid}`);

    await fcm.sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        notification: {
          title, body,
          icon: "https://gato-miel-studio.vercel.app/Assets/Img/Logo.jpg",
          badge: "https://gato-miel-studio.vercel.app/Assets/Img/Logo.jpg",
          vibrate: [200, 100, 200],
          data: { url }
        },
        fcmOptions: { link: "https://gato-miel-studio.vercel.app" + url }
      }
    });

  } catch(e) {
    console.log("Push error:", e.message);
  }
}

// ─── Enviar push a TODOS los usuarios ────────────────────────────
async function pushATodos(title, body, url = "/comunidad.html") {
  const usersSnap = await db.collection("tokens_fcm").get();
  const tokens = [];
  for (const userDoc of usersSnap.docs) {
    const devSnap = await userDoc.ref.collection("devices").get();
    devSnap.docs.forEach(d => { if (d.data().token) tokens.push(d.data().token); });
  }
  if (tokens.length === 0) return;
  console.log(`Broadcast a ${tokens.length} dispositivos`);

  const chunks = [];
  for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));
  for (const chunk of chunks) {
    await fcm.sendEachForMulticast({
      tokens: chunk,
      notification: { title, body },
      webpush: {
        notification: {
          title, body,
          icon: "https://gato-miel-studio.vercel.app/Assets/Img/Logo.jpg",
          data: { url }
        },
        fcmOptions: { link: "https://gato-miel-studio.vercel.app" + url }
      }
    }).catch(e => console.log("Broadcast error:", e.message));
  }
}

// ─── TRIGGER 1: Notificación individual ──────────────────────────
exports.enviarPushIndividual = onDocumentCreated(
  { document: "notificaciones/{docId}", minInstances: 1 },
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.uid) return;
    const { uid, titulo, texto, url, tipo } = data;
    await pushAUid(uid, titulo || "Gato Miel Estudio", texto || "", url || "/index.html");
    console.log(`Push enviado [${tipo}] → uid: ${uid}`);
  }
);

// ─── TRIGGER 2: Broadcast comunidad ──────────────────────────────
exports.enviarPushBroadcast = onDocumentCreated(
  "notificaciones_broadcast/{docId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const { titulo, texto, url } = data;
    await pushATodos(
      titulo || "🌿 Nueva publicación",
      texto || "Algo nuevo en comunidad 🐾",
      url || "/comunidad.html"
    );
    console.log("Broadcast enviado");
  }
);
