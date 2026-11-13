import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
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

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    const user = await prisma.user.update({
      where: { id: reseller.user.id },
      data: {
        resetToken,
        resetTokenExpiry,
        loginAttempts: 0,
        lockedUntil: null,
      },
      select: { id: true, name: true, email: true },
    });

    const baseUrl = (process.env.CONNECT_APP_URL || "https://www.intactconnect.com.gh").replace(/\/+$/, "");
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    let emailSent = false;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendEmail(
          user.email,
          "Reset your IntactConnect password",
          emailLayout("Password Reset", `
            <h2 style="margin:0 0 8px;color:#1a1d23;">Password reset requested</h2>
            <p style="color:#666;line-height:1.6;">Hi <strong>${user.name || "there"}</strong>, an Intact Ghana administrator unlocked your IntactConnect account and sent this password reset link.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
            </div>
            <p style="color:#888;font-size:13px;line-height:1.5;">This link expires in <strong>1 hour</strong>. If you did not request this, please contact Intact Ghana support.</p>
            <p style="color:#aaa;font-size:12px;word-break:break-all;">${resetUrl}</p>
          `)
        );
        emailSent = true;
      } catch (emailError) {
        console.error("[Admin Reseller Reset Login] email failed:", emailError);
      }
    } else {
      console.warn("[Admin Reseller Reset Login] SMTP is not configured");
    }

    if (auth.user) {
      await logAudit({
        userId: auth.user.id,
        action: "reset_login",
        entity: "reseller",
        entityId: id,
        details: { storeName: reseller.storeName, targetEmail: user.email, emailSent },
        request,
      });
    }

    if (!emailSent) {
      return NextResponse.json(
        { error: "Login was unlocked, but the reset email could not be sent", unlocked: true, emailSent: false },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, unlocked: true, emailSent: true });
  } catch (error) {
    console.error("Reseller login reset error:", error);
    return NextResponse.json({ error: "Failed to reset reseller login" }, { status: 500 });
  }
}
