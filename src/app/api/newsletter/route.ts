import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "You're already subscribed! Watch your inbox for deals.",
      });
    }

    await prisma.subscriber.create({ data: { email } });

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing! You'll receive our latest deals and news.",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
