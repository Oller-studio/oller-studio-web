const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error("PayPal client id/secret not configured");
  }

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function verifyPaypalWebhook(
  headers: Headers,
  webhookEvent: unknown
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const accessToken = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === "SUCCESS";
}

export type OrderDetails = {
  name: string | null;
  email: string | null;
  country: string | null;
  shippingName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
};

// The capture webhook doesn't reliably include payer/shipping details —
// fetch the full order for what's actually needed to ship the piece.
export async function getOrderDetails(orderId: string): Promise<OrderDetails> {
  const accessToken = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return {
      name: null,
      email: null,
      country: null,
      shippingName: null,
      shippingAddress: null,
      shippingCity: null,
    };
  }

  const data = (await res.json()) as {
    payer?: {
      email_address?: string;
      name?: { given_name?: string; surname?: string };
      address?: { country_code?: string };
    };
    purchase_units?: {
      shipping?: {
        name?: { full_name?: string };
        address?: {
          address_line_1?: string;
          address_line_2?: string;
          admin_area_2?: string;
          admin_area_1?: string;
          postal_code?: string;
          country_code?: string;
        };
      };
    }[];
  };

  const given = data.payer?.name?.given_name;
  const surname = data.payer?.name?.surname;
  const name = given || surname ? [given, surname].filter(Boolean).join(" ") : null;

  const shipping = data.purchase_units?.[0]?.shipping;
  const addr = shipping?.address;
  const shippingAddress = addr
    ? [addr.address_line_1, addr.address_line_2, addr.admin_area_2, addr.admin_area_1, addr.postal_code, addr.country_code]
        .filter(Boolean)
        .join(", ")
    : null;

  return {
    name,
    email: data.payer?.email_address ?? null,
    country: data.payer?.address?.country_code ?? addr?.country_code ?? null,
    shippingName: shipping?.name?.full_name ?? null,
    shippingAddress,
    shippingCity: addr?.admin_area_2 ?? null,
  };
}
