/* ═══════════════════════════════════════════════════
   VERCEL SERVERLESS FUNCTION — /api/notify
   Recibe eventos del frontend y envía push via OneSignal
   ═══════════════════════════════════════════════════ */

const OS_APP_ID  = "0bd6234e-b932-43b7-bb66-4606557f79be";
const OS_API_KEY = process.env.ONESIGNAL_API_KEY;
const BASE_URL   = "https://gato-miel-studio.vercel.app";

async function enviar(payload) {
  const resp = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": "Basic " + OS_API_KEY
    },
    body: JSON.stringify({
      app_id: OS_APP_ID,
      chrome_web_icon: BASE_URL + "/Assets/Img/Logo.jpg",
      firefox_icon:    BASE_URL + "/Assets/Img/Logo.jpg",
      ...payload
    })
  });
  return resp.json();
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  /* Verificar secret */
  if (req.headers["x-notify-secret"] !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { tipo, datos } = req.body || {};
  if (!tipo) return res.status(400).json({ error: "Falta tipo" });

  try {
    let result;

    switch(tipo) {

      case "chat_cliente":
        /* Cliente escribió → notificar SOLO a admins (por segmento o tag) */
        result = await enviar({
          included_segments: ["All"],
          filters: [{ field:"tag", key:"esAdmin", relation:"=", value:"true" }],
          headings: { en: `💬 ${datos.nombre||"Cliente"} te escribió` },
          contents: { en: datos.texto||"Nuevo mensaje" },
          url: BASE_URL + "/panel-admin.html"
        });
        break;

      case "chat_admin":
        /* Admin respondió → notificar al cliente específico */
        result = await enviar({
          include_aliases:  { external_id: [datos.uid] },
          target_channel:   "push",
          headings: { en: "🐾 Gato Miel te respondió" },
          contents: { en: datos.texto||"Tienes una respuesta" },
          url: BASE_URL + "/index.html"
        });
        break;

      case "nuevo_post":
        /* Post nuevo → notificar a TODOS */
        result = await enviar({
          included_segments: ["All"],
          headings: { en: "🏺 Nueva obra en Comunidad" },
          contents: { en: `${datos.autor||"Alguien"} compartió una nueva pieza` },
          url: BASE_URL + "/comunidad.html"
        });
        break;

      case "nuevo_pago":
        /* Pago nuevo → notificar admins */
        result = await enviar({
          included_segments: ["All"],
          filters: [{ field:"tag", key:"esAdmin", relation:"=", value:"true" }],
          headings: { en: `💰 Nuevo pago — ${datos.producto||"Colección"}` },
          contents: { en: `${datos.nombre||"Cliente"} · S/ ${datos.monto||"—"} via ${datos.metodo||"—"}` },
          url: BASE_URL + "/panel-admin.html"
        });
        break;

      case "nueva_membresia":
        /* Membresía nueva → notificar admins */
        result = await enviar({
          included_segments: ["All"],
          filters: [{ field:"tag", key:"esAdmin", relation:"=", value:"true" }],
          headings: { en: `🎫 Nueva membresía — ${datos.taller||"Taller"}` },
          contents: { en: `${datos.nombre||"Cliente"} · S/ ${datos.precio||"—"}` },
          url: BASE_URL + "/panel-admin.html"
        });
        break;

      default:
        return res.status(400).json({ error: "tipo desconocido: " + tipo });
    }

    return res.status(200).json({ ok: true, result });

  } catch(err) {
    console.error("notify error:", err);
    return res.status(500).json({ error: err.message });
  }
};
