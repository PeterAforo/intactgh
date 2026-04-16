import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

interface AuditParams {
  userId: string;
  action: string;       // "create" | "update" | "delete" | "login" | etc.
  entity: string;       // "order" | "product" | "promotion" | "user" | etc.
  entityId?: string;
  details?: Record<string, unknown>;
  request?: NextRequest;
}

export async function logAudit({ userId, action, entity, entityId, details, request }: AuditParams) {
  try {
    const ipAddress = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request?.headers.get("x-real-ip")
      || null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
