import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { verifyToken: token } });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "Email already verified. You can sign in." });
    }

    if (user.verifyTokenExpiry && user.verifyTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Verification link has expired. Please register again or request a new link." }, { status: 410 });
    }

    // Mark email as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    // Auto-login after verification
    const jwt = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, message: "Email verified successfully!" });
    response.cookies.set("auth-token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
