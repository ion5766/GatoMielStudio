const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp }     = require("firebase-admin/app");
const { getFirestore }      = require("firebase-admin/firestore");
const { getMessaging }      = require("firebase-admin/messaging");

initializeApp();
const db  = getFirestore();
const fcm = getMessaging();

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
    if (e.code === "messaging/registration-token-not-registered") {
      await db.collection("tokens_fcm").doc(uid).delete().catch(() => {});
    }
  }
}

async function pushATodos(title, body, url = "/comunidad.html") {
  const snap = await db.collection("tokens_fcm").get();
  const tokens = snap.docs.map(d => d.data().token).filter(Boolean);
  if (tokens.length === 0) return;

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
