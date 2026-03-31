import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate a secure verification token (expires in 24 hours)
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: "customer",
        emailVerified: false,
        verifyToken,
        verifyTokenExpiry,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    // Send verification email (non-blocking)
    const verifyUrl = `${BASE_URL}/verify-email?token=${verifyToken}`;
    sendEmail(
      email,
      "Verify your Intact Ghana account",
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <img src="${BASE_URL}/logo.png" alt="Intact Ghana" style="height:40px;margin-bottom:24px" />
        <h2 style="color:#1a1a1a;margin-bottom:8px">Welcome, ${name}!</h2>
        <p style="color:#666;line-height:1.6">Thanks for creating an account with Intact Ghana. Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0">
          Verify My Email
        </a>
        <p style="color:#999;font-size:13px;margin-top:24px">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="color:#bbb;font-size:12px">Intact Ghana — East Legon, A&C Mall, Accra</p>
      </div>`,
    ).catch((e) => console.error("[Register] Verification email error:", e));

    return NextResponse.json({
      success: true,
      needsVerification: true,
      message: "Account created! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
