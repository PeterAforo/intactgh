import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
    }

    if (user.role !== "admin") {
      return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
    }

    return { user };
  } catch {
    return { error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }) };
  }
}
