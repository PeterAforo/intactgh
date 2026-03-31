import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export type AuthUser = { id: string; name?: string | null; email: string; role: string };

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Verify the user has one of the allowed roles.
 * verifyAdmin  = admin only
 * verifyStaff  = admin or staff
 */
async function verifyRole(request: NextRequest, allowedRoles: string[]) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
    }

    if (!allowedRoles.includes(user.role)) {
      return { error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }) };
    }

    return { user };
  } catch {
    return { error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }) };
  }
}

export async function verifyAdmin(request: NextRequest) {
  return verifyRole(request, ["admin"]);
}

export async function verifyStaff(request: NextRequest) {
  return verifyRole(request, ["admin", "staff"]);
}
