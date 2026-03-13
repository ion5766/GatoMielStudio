const ACCESS_TOKEN = "APP_USR-5689465558713400-031012-48ea0212316d3076a98965d502640995-3021614843";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const payload = {
      transaction_amount: Number(body.transaction_amount),
      description:        body.description || "Gato Miel Estudio",
      payment_method_id:  body.payment_method_id,
      payer: {
        email: body.payer?.email || "cliente@gatomieles.com"
      }
    };

    if (body.token)        { payload.token = body.token; payload.installments = body.installments || 1; }
    if (body.issuer_id)    payload.issuer_id = body.issuer_id;
    if (body.payer?.identification?.type) payload.payer.identification = body.payer.identification;
    if (body.payer?.first_name) payload.payer.first_name = body.payer.first_name;
    if (body.payer?.last_name)  payload.payer.last_name  = body.payer.last_name;

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization":     `Bearer ${ACCESS_TOKEN}`,
        "Content-Type":      "application/json",
        "X-Idempotency-Key": `${Date.now()}-${Math.random().toString(36).slice(2)}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Error al procesar", detail: data });
    }

    return res.status(200).json({
      id:                 data.id,
      status:             data.status,
      status_detail:      data.status_detail,
      payment_method_id:  data.payment_method_id,
      transaction_amount: data.transaction_amount
    });

  } catch (err) {
    return res.status(500).json({ error: "Error interno", detail: err.message });
  }
}
