import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPermission } from "@/lib/auth";

// GET /api/admin/roles/[id] — single role with permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyPermission(request, "roles.manage");
  if (auth.error) return auth.error;
  const { id } = await params;

  const role = await prisma.role.findUnique({
    where: { id },
    include: { permissions: { include: { permission: true } } },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  return NextResponse.json({
    role: {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission.name),
    },
  });
}

// PUT /api/admin/roles/[id] — update role description & permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyPermission(request, "roles.manage");
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { description, permissions } = await request.json();

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Update description
    await prisma.role.update({
      where: { id },
      data: { description: description ?? role.description },
    });

    // Update permissions if provided
    if (Array.isArray(permissions)) {
      // Delete all current permissions for this role
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });

      // Assign new permissions
      if (permissions.length > 0) {
        const perms = await prisma.permission.findMany({
          where: { name: { in: permissions } },
          select: { id: true },
        });
        if (perms.length > 0) {
          await prisma.rolePermission.createMany({
            data: perms.map((p) => ({ roleId: id, permissionId: p.id })),
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

// DELETE /api/admin/roles/[id] — delete a custom role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyPermission(request, "roles.manage");
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json({ error: "Cannot delete a system role" }, { status: 400 });
    }

    // Check if any users have this role
    const userCount = await prisma.user.count({ where: { role: role.name } });
    if (userCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete role "${role.name}" — ${userCount} user(s) are assigned to it. Reassign them first.` },
        { status: 400 },
      );
    }

    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Role delete error:", error);
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
