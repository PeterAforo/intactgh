import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true, message: "If the email exists, a verification link has been sent." });
    }

    // Rate-limit: don't resend if token was generated less than 2 minutes ago
    if (user.verifyTokenExpiry) {
      const tokenAge = Date.now() - (user.verifyTokenExpiry.getTime() - 24 * 60 * 60 * 1000);
      if (tokenAge < 2 * 60 * 1000) {
        return NextResponse.json({ success: true, message: "If the email exists, a verification link has been sent." });
      }
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExpiry },
    });

    const verifyUrl = `${BASE_URL}/verify-email?token=${verifyToken}`;
    sendEmail(
      email,
      "Verify your Intact Ghana account",
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <img src="${BASE_URL}/logo.png" alt="Intact Ghana" style="height:40px;margin-bottom:24px" />
        <h2 style="color:#1a1a1a;margin-bottom:8px">Verify your email</h2>
        <p style="color:#666;line-height:1.6">Click the button below to verify your email address and activate your Intact Ghana account.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0">
          Verify My Email
        </a>
        <p style="color:#999;font-size:13px;margin-top:24px">This link expires in 24 hours.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="color:#bbb;font-size:12px">Intact Ghana — East Legon, A&C Mall, Accra</p>
      </div>`,
    ).catch((e) => console.error("[Resend Verification] email error:", e));

    return NextResponse.json({ success: true, message: "If the email exists, a verification link has been sent." });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Failed to resend verification" }, { status: 500 });
  }
}
