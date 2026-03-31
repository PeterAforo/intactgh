import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // ── Account lockout check ─────────────────────────────────────────
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account temporarily locked. Try again in ${minutesLeft} minute(s).` },
        { status: 423 },
      );
    }

    // ── Password verification ─────────────────────────────────────────
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const update: Record<string, unknown> = { loginAttempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        update.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        update.loginAttempts = 0;
      }
      await prisma.user.update({ where: { id: user.id }, data: update });

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` },
          { status: 423 },
        );
      }
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // ── Email verification check ──────────────────────────────────────
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before signing in. Check your inbox for the verification link.", needsVerification: true },
        { status: 403 },
      );
    }

    // ── Success — reset attempts & issue token ────────────────────────
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });

    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const { password: _, verifyToken: _vt, verifyTokenExpiry: _vte, ...safeUser } = user;

    const response = NextResponse.json({ success: true, user: safeUser, token });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
