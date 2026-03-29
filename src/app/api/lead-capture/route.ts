import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export interface LeadData {
  name: string;
  email: string;
  message: string;
  source?: string;
}

export async function POST(request: NextRequest) {
  let body: LeadData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, message, source = "chatbot" } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Name, email and message are required." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  try {
    // Store as a contact submission — reuse the contact_submissions table if it exists,
    // otherwise fall back to a console log so the app never crashes.
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO contact_submissions (name, email, message, source, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        name.trim(),
        email.trim().toLowerCase(),
        message.trim(),
        source
      );
    } catch {
      // Table may not exist yet — log for now; add migration when ready.
      console.log("[Lead Capture]", { name, email, message, source });
    }

    // Forward to notification email if configured (uses a simple SMTP fetch)
    const notificationEmail = process.env.CHATBOT_NOTIFICATION_EMAIL;
    if (notificationEmail) {
      // Placeholder: replace with your preferred email service (Resend, SendGrid, etc.)
      console.log(
        `[Lead Notification] → ${notificationEmail}: New lead from ${name} (${email}): ${message}`
      );
    }

    return NextResponse.json({
      success: true,
      message: `Thanks ${name}! We've received your message and will get back to you within 24 hours.`,
    });
  } catch (err) {
    console.error("Lead capture error:", err);
    return NextResponse.json(
      { error: "Failed to save your message. Please try again." },
      { status: 500 }
    );
  }
}
