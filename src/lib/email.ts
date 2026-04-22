import nodemailer from "nodemailer";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  variantLabel?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  createdAt: Date | string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPhone: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderEmailItem[];
  notes?: string | null;
}

// ── SMTP Transporter (lazy-init) ──────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── Generic send helper (used by gift-card fulfillment, etc.) ────────────
export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Email] SMTP not configured, skipping email to:", to);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Intact Ghana" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────
const GHS = (n: number) => `GH₵${n.toFixed(2)}`;

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  momo_mtn: "MTN Mobile Money",
  momo_vodafone: "Vodafone Cash",
  momo_airteltigo: "AirtelTigo Money",
  card: "Visa / Mastercard",
  canpay: "CanPay BNPL",
  pickup: "Pay at Store (Pickup)",
};

// ── HTML Base Layout ──────────────────────────────────────────────────────────
export function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#0041a8,#0052cc);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
        🛒 Intact Ghana
      </h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Racing with Technology</p>
    </td>
  </tr>
  <!-- Body -->
  <tr><td style="padding:32px;">${body}</td></tr>
  <!-- Footer -->
  <tr>
    <td style="background:#f8f9fc;padding:20px 32px;text-align:center;border-top:1px solid #e8ecf0;">
      <p style="margin:0;color:#7a8499;font-size:12px;">
        Intact Ghana &bull; East Legon, A&amp;C Mall, Accra &bull;
        <a href="tel:+233543645126" style="color:#0052cc;text-decoration:none;">+233 543 645 126</a>
      </p>
      <p style="margin:6px 0 0;color:#b0b8c9;font-size:11px;">
        © ${new Date().getFullYear()} Intact Ghana. All rights reserved.
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Items Table HTML ──────────────────────────────────────────────────────────
function itemsTable(items: OrderEmailItem[]): string {
  const rows = items.map((item) => `
  <tr>
    <td style="padding:12px 8px;border-bottom:1px solid #f0f2f5;vertical-align:middle;">
      ${item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.name}" width="56" height="56"
             style="object-fit:cover;border-radius:8px;border:1px solid #e8ecf0;display:block;"/>`
        : `<div style="width:56px;height:56px;background:#f0f2f5;border-radius:8px;"></div>`}
    </td>
    <td style="padding:12px 8px;border-bottom:1px solid #f0f2f5;vertical-align:middle;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#1a1d23;">${item.name}</p>
      ${item.variantLabel ? `<p style="margin:2px 0 0;font-size:12px;color:#7a8499;">${item.variantLabel}</p>` : ''}
    </td>
    <td style="padding:12px 8px;border-bottom:1px solid #f0f2f5;text-align:center;vertical-align:middle;">
      <span style="font-size:14px;color:#4a5568;">${item.quantity}</span>
    </td>
    <td style="padding:12px 8px;border-bottom:1px solid #f0f2f5;text-align:right;vertical-align:middle;">
      <span style="font-size:14px;color:#4a5568;">${GHS(item.price)}</span>
    </td>
    <td style="padding:12px 8px;border-bottom:1px solid #f0f2f5;text-align:right;vertical-align:middle;">
      <span style="font-size:14px;font-weight:600;color:#1a1d23;">${GHS(item.price * item.quantity)}</span>
    </td>
  </tr>`).join("");

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <thead>
      <tr style="background:#f8f9fc;">
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#7a8499;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8ecf0;width:64px;">Image</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#7a8499;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8ecf0;">Product</th>
        <th style="padding:10px 8px;text-align:center;font-size:11px;color:#7a8499;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8ecf0;">Qty</th>
        <th style="padding:10px 8px;text-align:right;font-size:11px;color:#7a8499;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8ecf0;">Unit Price</th>
        <th style="padding:10px 8px;text-align:right;font-size:11px;color:#7a8499;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8ecf0;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ── Totals Block ──────────────────────────────────────────────────────────────
function totalsBlock(order: OrderEmailData): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
    <tr>
      <td width="60%"></td>
      <td>
        <table width="100%" cellpadding="6" cellspacing="0">
          <tr>
            <td style="font-size:14px;color:#4a5568;">Subtotal</td>
            <td style="font-size:14px;color:#1a1d23;text-align:right;">${GHS(order.subtotal)}</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#4a5568;">Delivery</td>
            <td style="font-size:14px;color:#1a1d23;text-align:right;">
              ${order.deliveryFee === 0 ? '<span style="color:#10b981;font-weight:600;">FREE</span>' : GHS(order.deliveryFee)}
            </td>
          </tr>
          <tr style="border-top:2px solid #e8ecf0;">
            <td style="font-size:16px;font-weight:700;color:#1a1d23;padding-top:8px;">Grand Total</td>
            <td style="font-size:16px;font-weight:700;color:#0052cc;text-align:right;padding-top:8px;">${GHS(order.total)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

// ── Customer Confirmation Email ───────────────────────────────────────────────
export async function sendCustomerOrderEmail(order: OrderEmailData): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const payLabel = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-GH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const body = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#1a1d23;">Thank you for your order! 🎉</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#7a8499;">
      Hi <strong>${order.customerName}</strong>, your order has been confirmed and is being processed.
    </p>

    <!-- Order Meta -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8f9fc;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e8ecf0;">
      <tr>
        <td style="font-size:13px;color:#7a8499;">Order Number</td>
        <td style="font-size:14px;font-weight:700;color:#0052cc;text-align:right;">#${order.orderNumber}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#7a8499;padding-top:6px;">Date</td>
        <td style="font-size:13px;color:#1a1d23;text-align:right;padding-top:6px;">${dateStr}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#7a8499;padding-top:6px;">Payment Method</td>
        <td style="font-size:13px;color:#1a1d23;text-align:right;padding-top:6px;">${payLabel}</td>
      </tr>
    </table>

    <!-- Items -->
    <h3 style="margin:0 0 12px;font-size:15px;color:#1a1d23;">Order Items</h3>
    ${itemsTable(order.items)}
    ${totalsBlock(order)}

    <!-- Delivery Details -->
    <h3 style="margin:24px 0 12px;font-size:15px;color:#1a1d23;">Delivery Details</h3>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8f9fc;border-radius:8px;padding:16px;border:1px solid #e8ecf0;">
      <tr>
        <td style="font-size:13px;color:#7a8499;padding-bottom:4px;">Name</td>
        <td style="font-size:13px;color:#1a1d23;text-align:right;padding-bottom:4px;">${order.customerName}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#7a8499;padding-bottom:4px;">Phone</td>
        <td style="font-size:13px;color:#1a1d23;text-align:right;padding-bottom:4px;">${order.shippingPhone}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#7a8499;padding-bottom:4px;">Address</td>
        <td style="font-size:13px;color:#1a1d23;text-align:right;padding-bottom:4px;">${order.shippingAddress}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#7a8499;">City / Region</td>
        <td style="font-size:13px;color:#1a1d23;text-align:right;">${order.shippingCity}${order.shippingRegion ? `, ${order.shippingRegion}` : ""}</td>
      </tr>
      ${order.notes ? `<tr><td style="font-size:13px;color:#7a8499;padding-top:4px;">Notes</td><td style="font-size:13px;color:#1a1d23;text-align:right;padding-top:4px;">${order.notes}</td></tr>` : ""}
    </table>

    <p style="margin:24px 0 8px;font-size:14px;color:#4a5568;">
      Questions? Contact us at
      <a href="mailto:support@intactghana.com" style="color:#0052cc;text-decoration:none;">support@intactghana.com</a>
      or call <a href="tel:+233543645126" style="color:#0052cc;text-decoration:none;">+233 543 645 126</a>.
    </p>`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Intact Ghana" <${process.env.SMTP_USER}>`,
    to: order.customerEmail,
    subject: `Order Confirmed – #${order.orderNumber} | Intact Ghana`,
    html: emailLayout(`Order Confirmed #${order.orderNumber}`, body),
  });
}

// ── Admin New-Order Alert Email ───────────────────────────────────────────────
export async function sendAdminOrderEmail(
  order: OrderEmailData,
  adminEmail: string
): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const payLabel = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;

  const body = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#1a1d23;">🔔 New Order Received</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#7a8499;">
      A new order has just been placed on the store.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#fff3cd;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #ffc107;">
      <tr>
        <td style="font-size:13px;color:#856404;">Order Number</td>
        <td style="font-size:16px;font-weight:700;color:#0052cc;text-align:right;">#${order.orderNumber}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#856404;padding-top:6px;">Customer</td>
        <td style="font-size:13px;color:#1a1d23;text-align:right;padding-top:6px;">${order.customerName}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#856404;padding-top:6px;">Email</td>
        <td style="font-size:13px;color:#1a1d23;text-align:right;padding-top:6px;">${order.customerEmail}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#856404;padding-top:6px;">Phone</td>
        <td style="font-size:13px;color:#1a1d23;text-align:right;padding-top:6px;">${order.shippingPhone}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#856404;padding-top:6px;">Payment</td>
        <td style="font-size:13px;color:#1a1d23;text-align:right;padding-top:6px;">${payLabel}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#856404;padding-top:6px;">Grand Total</td>
        <td style="font-size:16px;font-weight:700;color:#0052cc;text-align:right;padding-top:6px;">${GHS(order.total)}</td>
      </tr>
    </table>

    <h3 style="margin:0 0 12px;font-size:15px;color:#1a1d23;">Order Items</h3>
    ${itemsTable(order.items)}
    ${totalsBlock(order)}

    <h3 style="margin:24px 0 12px;font-size:15px;color:#1a1d23;">Delivery Address</h3>
    <p style="margin:0;font-size:14px;color:#4a5568;line-height:1.6;">
      ${order.shippingAddress}, ${order.shippingCity}${order.shippingRegion ? `, ${order.shippingRegion}` : ""}
      ${order.notes ? `<br/><em>Notes: ${order.notes}</em>` : ""}
    </p>

    <div style="margin-top:24px;text-align:center;">
      <a href="${process.env.SITE_URL ?? "https://intactghana.com"}/admin/orders"
        style="display:inline-block;background:#0052cc;color:#ffffff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
        View Order in Admin →
      </a>
    </div>`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Intact Ghana" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `New Order #${order.orderNumber} – ${GHS(order.total)} | Intact Ghana`,
    html: emailLayout(`New Order #${order.orderNumber}`, body),
  });
}
