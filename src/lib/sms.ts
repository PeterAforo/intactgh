// mNotify SMS API v2.0 — https://api.mnotify.com/api/sms/quick
const MNOTIFY_BASE = "https://api.mnotify.com/api/sms/quick";

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

// ── Normalise Ghanaian phone numbers ──────────────────────────────────────────
function normalizePhone(phone: string): string {
  // Strip spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, "");
  // Convert +233 to 0 prefix for mNotify
  if (cleaned.startsWith("+233")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("233")) {
    cleaned = "0" + cleaned.slice(3);
  }
  return cleaned;
}

// ── Core send function (mNotify API v2.0) ─────────────────────────────────────
export async function sendSMS(to: string, message: string): Promise<boolean> {
  const apiKey = process.env.MNOTIFY_API_KEY;
  if (!apiKey) {
    console.warn("[SMS] MNOTIFY_API_KEY not set — skipping SMS");
    return false;
  }

  const phone = normalizePhone(to);
  const sender = process.env.MNOTIFY_SENDER_ID ?? "IntactGH";

  try {
    const res = await fetch(`${MNOTIFY_BASE}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: [phone],
        sender,
        message,
        is_schedule: false,
        schedule_date: "",
      }),
    });

    const data = await res.json();
    // v2.0 returns { status: "success", code: "2000", ... } on success
    const ok = res.ok && (data.status === "success" || data.code === "2000");
    if (!ok) console.error("[SMS] mNotify response:", data);
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
    `Hi ${customerName}, thank you for your order #${orderNumber} on Intact Ghana. ` +
    `${itemCount} item${itemCount > 1 ? "s" : ""}, Total: ${GHS(total)}. ` +
    `A representative will contact you shortly to arrange delivery.`;

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
    `Order #${orderNumber} received. ` +
    `${customerName}, ${city}. ` +
    `Amount: ${GHS(total)}. ` +
    `Check admin panel for details.`;

  return sendSMS(phone, message);
}
