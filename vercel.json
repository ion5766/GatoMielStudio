/* ═══════════════════════════════════════════════
   ENDPOINT DE DIAGNÓSTICO — /api/test
   Visita https://gato-miel-studio.vercel.app/api/test
   para ver qué está fallando
   ═══════════════════════════════════════════════ */

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore }                 = require("firebase-admin/firestore");
const { getMessaging }                 = require("firebase-admin/messaging");

module.exports = async function handler(req, res) {
  const resultado = {
    timestamp: new Date().toISOString(),
    pasos: {}
  };

  // Paso 1: Variables de entorno
  resultado.pasos["1_env_NOTIFY_SECRET"]          = process.env.NOTIFY_SECRET ? "✓ existe" : "✗ FALTA";
  resultado.pasos["2_env_FIREBASE_SERVICE_ACCOUNT"] = process.env.FIREBASE_SERVICE_ACCOUNT ? "✓ existe" : "✗ FALTA";

  // Paso 2: Parsear Service Account
  let sa;
  try {
    sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    resultado.pasos["3_parse_json"] = `✓ OK — project: ${sa.project_id || "?"}, email: ${sa.client_email?.slice(0,30) || "?"}`;
  } catch(e) {
    resultado.pasos["3_parse_json"] = "✗ ERROR al parsear JSON: " + e.message;
    return res.status(200).json(resultado);
  }

  // Paso 3: Inicializar Firebase Admin
  try {
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(sa) });
    resultado.pasos["4_firebase_admin"] = "✓ inicializado";

    // Paso 4: Leer usuarios con fcmToken de Firestore
    const db   = getFirestore(app);
    const snap = await db.collection("users").limit(5).get();
    const users = [];
    snap.forEach(d => {
      const u = d.data();
      users.push({
        email:    u.email || "?",
        tieneToken: u.fcmToken ? `✓ (${u.fcmToken.slice(0,20)}...)` : "✗ SIN TOKEN",
        esAdmin:  u.esAdmin || false
      });
    });
    resultado.pasos["5_usuarios_firestore"] = users.length > 0 ? users : "✗ Sin usuarios en /users — nadie ha abierto la web aún";

    // Paso 5: Intentar enviar un push de prueba al admin
    const adminSnap = await db.collection("users")
      .where("esAdmin", "==", true).limit(1).get();
    
    if (adminSnap.empty) {
      resultado.pasos["6_push_prueba"] = "✗ No hay admin con token. Abre la web como admin primero.";
    } else {
      const adminData = adminSnap.docs[0].data();
      if (!adminData.fcmToken) {
        resultado.pasos["6_push_prueba"] = "✗ Admin encontrado pero sin fcmToken. Acepta notificaciones en la web.";
      } else {
        try {
          const messaging = getMessaging(app);
          const msgId = await messaging.send({
            token: adminData.fcmToken,
            notification: { title: "🐾 Test Gato Miel", body: "Si ves esto, las notificaciones funcionan!" },
            data: { url: "/panel-admin.html" },
            webpush: {
              notification: { icon: "https://gato-miel-studio.vercel.app/Assets/Img/Logo.jpg" },
              fcmOptions:   { link: "https://gato-miel-studio.vercel.app/panel-admin.html" }
            }
          });
          resultado.pasos["6_push_prueba"] = `✓ Push enviado a ${adminData.email} — ID: ${msgId}`;
        } catch(pushErr) {
          resultado.pasos["6_push_prueba"] = "✗ Error enviando push: " + pushErr.message;
        }
      }
    }

  } catch(e) {
    resultado.pasos["4_firebase_admin"] = "✗ ERROR: " + e.message;
  }

  res.status(200).json(resultado);
};
