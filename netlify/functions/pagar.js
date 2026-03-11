const ACCESS_TOKEN = "APP_USR-5689465558713400-031012-48ea0212316d3076a98965d502640995-3021614843";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  try {
    const body = JSON.parse(event.body);

    const payload = {
      transaction_amount: Number(body.transaction_amount),
      description: body.description || "Gato Miel Estudio",
      payment_method_id: body.payment_method_id,
      payer: {
        email: body.payer?.email || "cliente@gatomieles.com",
      }
    };

    if (body.payer?.identification?.type && body.payer?.identification?.number) {
      payload.payer.identification = body.payer.identification;
    }

    if (body.token) {
      payload.token = body.token;
      payload.installments = body.installments || 1;
    }

    if (body.issuer_id) payload.issuer_id = body.issuer_id;
    if (body.callback_url) payload.callback_url = body.callback_url;
    if (body.payer?.first_name) payload.payer.first_name = body.payer.first_name;
    if (body.payer?.last_name) payload.payer.last_name = body.payer.last_name;

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${Date.now()}-${Math.random().toString(36).slice(2)}`
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
        point_of_interaction: data.point_of_interaction || null,
        transaction_details: data.transaction_details || null,
        external_resource_url: data.transaction_details?.external_resource_url || null
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
