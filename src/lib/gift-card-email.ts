import nodemailer from "nodemailer";

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

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[GiftCard Email] SMTP not configured, skipping email to:", to);
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"Intact Ghana" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("[GiftCard Email] Sent to:", to);
  } catch (err) {
    console.error("[GiftCard Email] Failed:", err);
  }
}
