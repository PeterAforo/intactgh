import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPermission } from "@/lib/auth";

// GET /api/admin/roles — list all roles with permission counts
export async function GET(request: NextRequest) {
  const auth = await verifyPermission(request, "roles.manage");
  if (auth.error) return auth.error;

  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Count users per role
  const userCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });
  const countMap = Object.fromEntries(userCounts.map((u) => [u.role, u._count]));

  const result = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    userCount: countMap[r.name] || 0,
    permissions: r.permissions.map((rp) => rp.permission.name),
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ roles: result });
}

// POST /api/admin/roles — create a new role
export async function POST(request: NextRequest) {
  const auth = await verifyPermission(request, "roles.manage");
  if (auth.error) return auth.error;

  try {
    const { name, description, permissions } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Role name must be at least 2 characters" }, { status: 400 });
    }

    const slug = name.trim().toLowerCase().replace(/\s+/g, "_");

    const existing = await prisma.role.findUnique({ where: { name: slug } });
    if (existing) {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });
    }

    const role = await prisma.role.create({
      data: { name: slug, description: description || null },
    });

    // Assign permissions
    if (Array.isArray(permissions) && permissions.length > 0) {
      const perms = await prisma.permission.findMany({
        where: { name: { in: permissions } },
        select: { id: true },
      });
      if (perms.length > 0) {
        await prisma.rolePermission.createMany({
          data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        });
      }
    }

    return NextResponse.json({ role: { ...role, permissions: permissions || [] } }, { status: 201 });
  } catch (error) {
    console.error("Role create error:", error);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
