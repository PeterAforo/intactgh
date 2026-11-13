import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const reseller = await prisma.reseller.findUnique({
      where: { id },
      select: {
        id: true,
        storeName: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!reseller) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newPassword = randomBytes(9).toString("base64url");
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: reseller.user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    const baseUrl = (process.env.CONNECT_APP_URL || "https://www.intactconnect.com.gh").replace(/\/+$/, "");

    let emailSent = false;
    try {
      await sendEmail(
        reseller.user.email,
        "Your IntactConnect password has been reset",
        emailLayout("Password Reset", `
          <h2 style="margin:0 0 8px;color:#1a1d23;">Your password was reset</h2>
          <p style="color:#666;line-height:1.6;">Hi <strong>${reseller.user.name || "there"}</strong>, an Intact Ghana administrator reset the password for your IntactConnect account (<strong>${reseller.storeName}</strong>).</p>
          <div style="background:#f5f3ff;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
            <p style="margin:0 0 4px;color:#7c3aed;font-size:12px;font-weight:600;letter-spacing:0.05em;">TEMPORARY PASSWORD</p>
            <p style="margin:0;font-family:monospace;font-size:20px;font-weight:700;color:#1a1d23;letter-spacing:0.08em;">${newPassword}</p>
          </div>
          <p style="text-align:center;margin:24px 0;">
            <a href="${baseUrl}/login" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Log In to IntactConnect</a>
          </p>
          <p style="color:#888;font-size:13px;line-height:1.5;">Please sign in with this temporary password and change it from your account settings. If you did not expect this reset, contact Intact Ghana support immediately.</p>
        `)
      );
      emailSent = true;
    } catch (emailError) {
      console.error("[Admin Reseller Set Password] email failed:", emailError);
    }

    if (auth.user) {
      await logAudit({
        userId: auth.user.id,
        action: "set_password",
        entity: "reseller",
        entityId: id,
        details: { storeName: reseller.storeName, targetEmail: reseller.user.email, emailSent },
        request,
      });
    }

    if (!emailSent) {
      return NextResponse.json(
        { error: "Password was updated, but the credentials email could not be sent", updated: true, emailSent: false },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error) {
    console.error("Reseller set password error:", error);
    return NextResponse.json({ error: "Failed to set reseller password" }, { status: 500 });
  }
}
