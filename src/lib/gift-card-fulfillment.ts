import { prisma } from "@/lib/db";
import { sendEmail } from "./email";
import { sendSMS } from "./sms";

// Gift card category IDs — products in these categories trigger auto-generation
const GIFT_CARD_CATEGORY_IDS = ["mcat-39", "scat-384"];

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `INTGC-${seg()}-${seg()}-${seg()}`;
}

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

interface GeneratedCard {
  code: string;
  pin: string;
  amount: number;
  productName: string;
}

/**
 * After an order is placed, check if any items are gift card products.
 * For each one, auto-generate a GiftCard record and return the generated cards.
 */
export async function fulfillGiftCardProducts(
  orderId: string,
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
): Promise<GeneratedCard[]> {
  // Fetch order items with product + category info
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      product: {
        select: { id: true, name: true, price: true, categoryId: true },
      },
    },
  });

  const giftCardItems = orderItems.filter(
    (item) => item.product.categoryId && GIFT_CARD_CATEGORY_IDS.includes(item.product.categoryId)
  );

  if (giftCardItems.length === 0) return [];

  const generatedCards: GeneratedCard[] = [];

  for (const item of giftCardItems) {
    // Generate one card per quantity
    for (let i = 0; i < item.quantity; i++) {
      let code = generateCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await prisma.giftCard.findUnique({ where: { code } });
        if (!existing) break;
        code = generateCode();
        attempts++;
      }

      const pin = generatePin();
      const amount = item.price; // The product price IS the gift card value

      await prisma.giftCard.create({
        data: {
          code,
          pin,
          amount,
          balance: amount,
          status: "active",
          purchasedBy: customerName,
          purchasedAt: new Date(),
          orderId: orderNumber,
          notes: `Auto-generated from order #${orderNumber} — ${item.product.name}`,
        },
      });

      generatedCards.push({ code, pin, amount, productName: item.product.name });
    }
  }

  // Send gift card codes to customer (non-blocking)
  if (generatedCards.length > 0) {
    sendGiftCardNotifications(generatedCards, customerName, customerEmail, customerPhone, orderNumber).catch(
      (e) => console.error("[GiftCard Fulfillment] notification error:", e)
    );
  }

  return generatedCards;
}

async function sendGiftCardNotifications(
  cards: GeneratedCard[],
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  orderNumber: string,
) {
  // Email
  if (customerEmail) {
    const cardRows = cards.map((c) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #eee;font-size:14px">${c.productName}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;font-family:monospace;font-weight:bold;color:#0052cc">${c.code}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;font-family:monospace;font-weight:bold">${c.pin}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;font-size:14px;text-align:right;font-weight:bold">GH₵${c.amount.toFixed(2)}</td>
      </tr>
    `).join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#0041a8,#0052cc);padding:28px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">🎁 Your Gift Card${cards.length > 1 ? "s Are" : " Is"} Ready!</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Order #${orderNumber}</p>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #e8ecf0;border-top:0">
          <p style="font-size:16px;color:#333">Hi ${customerName},</p>
          <p style="font-size:14px;color:#666">Thank you for purchasing gift card${cards.length > 1 ? "s" : ""} from Intact Ghana! Here ${cards.length > 1 ? "are your codes" : "is your code"}:</p>
          
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <thead>
              <tr style="background:#f8f9fa">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;text-transform:uppercase">Card</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#666;text-transform:uppercase">Code</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#666;text-transform:uppercase">PIN</th>
                <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;text-transform:uppercase">Value</th>
              </tr>
            </thead>
            <tbody>${cardRows}</tbody>
          </table>

          <div style="background:#f0f7ff;border:1px solid #cce0ff;border-radius:8px;padding:16px;margin:20px 0">
            <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#333">How to use:</p>
            <ol style="margin:0;padding-left:20px;font-size:14px;color:#555;line-height:1.8">
              <li>Go to checkout on <a href="${process.env.SITE_URL || "https://intactgh.vercel.app"}" style="color:#0052cc">intactghana.com</a></li>
              <li>In the payment step, enter your <strong>gift card code</strong> and <strong>PIN</strong></li>
              <li>The balance will be applied to your order</li>
            </ol>
          </div>

          <p style="font-size:13px;color:#999;margin-top:20px">
            ⚠️ Keep your code and PIN safe. Do not share them with anyone you don't trust.
          </p>
        </div>
        <div style="background:#f8f9fc;padding:16px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e8ecf0;border-top:0">
          <p style="margin:0;color:#999;font-size:12px">Intact Ghana — East Legon, A&C Mall, Accra | +233 543 645 126</p>
        </div>
      </div>
    `;

    await sendEmail(customerEmail, `Your Intact Ghana Gift Card${cards.length > 1 ? "s" : ""} — Order #${orderNumber}`, html);
  }

  // SMS — send first card code
  if (customerPhone) {
    const first = cards[0];
    const msg = cards.length === 1
      ? `Intact Ghana: Your Gift Card is ready! Code: ${first.code} | PIN: ${first.pin} | Value: GHC${first.amount.toFixed(2)}. Use at checkout on intactghana.com`
      : `Intact Ghana: ${cards.length} Gift Cards ready! First: ${first.code} | PIN: ${first.pin} | GHC${first.amount.toFixed(2)}. Check your email for all codes.`;
    await sendSMS(customerPhone, msg);
  }
}
