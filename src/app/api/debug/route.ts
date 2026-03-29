import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const ENV_KEYS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "MNOTIFY_API_KEY",
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_BASE_URL",
];

export async function GET() {
  // DB check
  let dbOk = false;
  let dbError = "";
  let users: { id: string; email: string; role: string; createdAt: Date }[] = [];

  try {
    users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    dbOk = true;
  } catch (e: any) {
    dbError = e.message ?? "Unknown DB error";
  }

  const envStatus: Record<string, boolean> = {};
  for (const key of ENV_KEYS) {
    envStatus[key] = !!process.env[key];
  }

  return NextResponse.json({ dbOk, dbError, users, envStatus });
}

export async function POST(request: NextRequest) {
  const { action, email, password, name } = await request.json();

  if (action === "create_admin") {
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        // Promote existing user to admin and reset password
        const hashed = await bcrypt.hash(password, 12);
        const updated = await prisma.user.update({
          where: { email },
          data: { role: "admin", password: hashed, name: name || existing.name },
          select: { id: true, email: true, role: true },
        });
        return NextResponse.json({ success: true, action: "promoted", user: updated });
      }
      const hashed = await bcrypt.hash(password, 12);
      const created = await prisma.user.create({
        data: { email, password: hashed, name: name || "Admin", role: "admin" },
        select: { id: true, email: true, role: true },
      });
      return NextResponse.json({ success: true, action: "created", user: created });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === "test_login") {
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return NextResponse.json({ success: false, reason: "No user found with that email" });
      if (!user.password) return NextResponse.json({ success: false, reason: "User has no password set (OAuth-only account)" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return NextResponse.json({ success: false, reason: "Password does not match" });
      return NextResponse.json({ success: true, reason: "Credentials are valid", role: user.role });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
