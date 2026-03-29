import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// POST: Request password reset (generates a token)
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true, message: "If that email exists, a reset link has been generated." });
    }

    // Generate a short-lived reset token (15 min)
    const token = await new SignJWT({ userId: user.id, purpose: "reset" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("15m")
      .sign(JWT_SECRET);

    // In production, send this via email. For now, return in response for dev.
    return NextResponse.json({
      success: true,
      message: "If that email exists, a reset link has been generated.",
      // DEV ONLY: remove in production
      resetToken: token,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// PUT: Reset password using token
export async function PUT(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.purpose !== "reset") {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }

    const userId = payload.userId as string;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch {
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
  }
}
