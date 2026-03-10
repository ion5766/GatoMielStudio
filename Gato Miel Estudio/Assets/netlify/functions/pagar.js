const ACCESS_TOKEN = "APP_USR-5689465558713400-031012-48ea0212316d3076a98965d502640995-3021614843";

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  try {
    const body = JSON.parse(event.body);

    // Construir payload para MP
    const payload = {
      transaction_amount: body.transaction_amount,
      description: body.description,
      payment_method_id: body.payment_method_id,
      payer: {
        email: body.payer.email,
        identification: body.payer.identification || undefined
      },
      // Para tarjetas
      token: body.token || undefined,
      installments: body.installments || 1,
      issuer_id: body.issuer_id || undefined,
    };

    // Limpiar campos undefined
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    if (payload.payer) Object.keys(payload.payer).forEach(k => payload.payer[k] === undefined && delete payload.payer[k]);

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${Date.now()}-${Math.random()}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.message || "Error al procesar el pago", detail: data })
      };
    }

    // Respuesta limpia al frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: data.id,
        status: data.status,
        status_detail: data.status_detail,
        payment_method_id: data.payment_method_id,
        transaction_amount: data.transaction_amount,
        description: data.description,
        // Para Yape/Plin — datos del QR si aplica
        point_of_interaction: data.point_of_interaction || null
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error interno del servidor", detail: err.message })
    };
  }
};
