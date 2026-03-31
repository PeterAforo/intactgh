import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPermission } from "@/lib/auth";

// GET /api/admin/permissions — list all permissions grouped
export async function GET(request: NextRequest) {
  const auth = await verifyPermission(request, "roles.manage");
  if (auth.error) return auth.error;

  const permissions = await prisma.permission.findMany({
    orderBy: [{ group: "asc" }, { name: "asc" }],
  });

  // Group them
  const grouped: Record<string, typeof permissions> = {};
  for (const p of permissions) {
    if (!grouped[p.group]) grouped[p.group] = [];
    grouped[p.group].push(p);
  }

  return NextResponse.json({ permissions, grouped });
}
