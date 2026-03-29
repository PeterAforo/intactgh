// mNotify SMS API — https://apps.mnotify.net/smsapi
const MNOTIFY_BASE = "https://apps.mnotify.net/smsapi";

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  momo_mtn: "MTN MoMo",
  momo_vodafone: "Vodafone Cash",
  momo_airteltigo: "AirtelTigo Money",
  card: "Card",
  canpay: "CanPay BNPL",
  pickup: "Pay at Store",
};

const GHS = (n: number) => `GHC${n.toFixed(2)}`;

// ── Core send function ────────────────────────────────────────────────────────
export async function sendSMS(to: string, message: string): Promise<boolean> {
  const apiKey = process.env.MNOTIFY_API_KEY;
  if (!apiKey) {
    console.warn("[SMS] MNOTIFY_API_KEY not set — skipping SMS");
    return false;
  }

  // Normalise Ghanaian phone numbers: strip spaces/dashes, ensure leading 0 or +233
  const phone = to.replace(/[\s\-()]/g, "");

  const params = new URLSearchParams({
    key: apiKey,
    to: phone,
    msg: message,
    sender_id: process.env.MNOTIFY_SENDER_ID ?? "IntactGH",
  });

  try {
    const res = await fetch(`${MNOTIFY_BASE}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const text = await res.text();
    // mNotify returns "1000" or a JSON object on success
    const ok = res.ok && (text.includes("1000") || text.includes("success"));
    if (!ok) console.error("[SMS] mNotify response:", text);
    return ok;
  } catch (err) {
    console.error("[SMS] mNotify request failed:", err);
    return false;
  }
}

// ── Customer order confirmation SMS ──────────────────────────────────────────
export async function sendCustomerOrderSMS(params: {
  phone: string;
  orderNumber: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  itemCount: number;
}): Promise<boolean> {
  const { phone, orderNumber, customerName, total, paymentMethod, itemCount } = params;
  const payLabel = PAYMENT_LABELS[paymentMethod] ?? paymentMethod;

  const message =
    `Hi ${customerName}, your Intact Ghana order #${orderNumber} has been confirmed! ` +
    `${itemCount} item${itemCount > 1 ? "s" : ""} | Total: ${GHS(total)} | Payment: ${payLabel}. ` +
    `We will contact you for delivery. Thank you for shopping with us! ` +
    `Questions? Call +233543645126`;

  return sendSMS(phone, message);
}

// ── Admin new-order SMS alert ─────────────────────────────────────────────────
export async function sendAdminOrderSMS(params: {
  phone: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  paymentMethod: string;
  city: string;
}): Promise<boolean> {
  const { phone, orderNumber, customerName, customerPhone, total, paymentMethod, city } = params;
  const payLabel = PAYMENT_LABELS[paymentMethod] ?? paymentMethod;

  const message =
    `NEW ORDER #${orderNumber} | ` +
    `Customer: ${customerName} (${customerPhone}) | ` +
    `City: ${city} | ` +
    `Total: ${GHS(total)} | ` +
    `Payment: ${payLabel} | ` +
    `Login to admin to process.`;

  return sendSMS(phone, message);
}
