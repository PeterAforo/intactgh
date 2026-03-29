import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, subject: subject || null, message },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you within 24 hours.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
