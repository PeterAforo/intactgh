import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendResellerStatusEmail } from "@/lib/reseller-notifications";

const resellerUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  createdAt: true,
  emailVerified: true,
  loginAttempts: true,
  lockedUntil: true,
} as const;

const VALID_ID_TYPES = new Set(["ghana_card", "voter_id", "passport", "nhis", "driver_license"]);
const VALID_STATUSES = new Set(["pending", "approved", "rejected", "suspended"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;
  const { id } = await params;

  const reseller = await prisma.reseller.findUnique({
    where: { id },
    include: {
      user: { select: resellerUserSelect },
      _count: { select: { orders: true, clients: true, invoices: true, payouts: true, promotions: true, referrals: true } },
    },
  });

  if (!reseller) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(reseller);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, bio, user: userInput, reseller: resellerInput } = body as {
      status?: unknown;
      bio?: unknown;
      user?: unknown;
      reseller?: unknown;
    };

    const reseller = await prisma.reseller.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!reseller) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const userData: Prisma.UserUpdateInput = {};
    const resellerData: Prisma.ResellerUpdateInput = {};
    const changedFields: string[] = [];

    if (status !== undefined) {
      if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
        return NextResponse.json({ error: "Invalid reseller status" }, { status: 400 });
      }
      resellerData.status = status;
      changedFields.push("status");
    }

    if (bio !== undefined && resellerInput === undefined) {
      resellerData.bio = cleanString(bio) || null;
      changedFields.push("bio");
    }

    const hasProfileUpdate = userInput !== undefined || resellerInput !== undefined;

    if (userInput !== undefined) {
      if (!isRecord(userInput)) {
        return NextResponse.json({ error: "Invalid user payload" }, { status: 400 });
      }

      const name = cleanString(userInput.name);
      const email = cleanString(userInput.email).toLowerCase();
      const phone = cleanString(userInput.phone);

      if (!name) return NextResponse.json({ error: "User name is required" }, { status: 400 });
      if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Valid login email is required" }, { status: 400 });

      const existingUser = await prisma.user.findFirst({
        where: { email, NOT: { id: reseller.userId } },
        select: { id: true },
      });
      if (existingUser) {
        return NextResponse.json({ error: "A user with this login email already exists" }, { status: 409 });
      }

      userData.name = name;
      userData.email = email;
      userData.phone = phone || null;
      changedFields.push("user.name", "user.email", "user.phone");
    }

    if (resellerInput !== undefined) {
      if (!isRecord(resellerInput)) {
        return NextResponse.json({ error: "Invalid reseller payload" }, { status: 400 });
      }

      const storeName = cleanString(resellerInput.storeName);
      const storeSlug = cleanString(resellerInput.storeSlug).toLowerCase();
      const resellerEmail = cleanString(resellerInput.email).toLowerCase();
      const phone = cleanString(resellerInput.phone);
      const bioValue = cleanString(resellerInput.bio);
      const picture = cleanString(resellerInput.picture);
      const nationalIdType = cleanString(resellerInput.nationalIdType);
      const nationalIdNumber = cleanString(resellerInput.nationalIdNumber);
      const nationalIdImage = cleanString(resellerInput.nationalIdImage);

      if (!storeName) return NextResponse.json({ error: "Store name is required" }, { status: 400 });
      if (!storeSlug || !SLUG_RE.test(storeSlug)) {
        return NextResponse.json({ error: "Store slug must use lowercase letters, numbers, and hyphens" }, { status: 400 });
      }
      if (!EMAIL_RE.test(resellerEmail)) return NextResponse.json({ error: "Valid store contact email is required" }, { status: 400 });
      if (!phone) return NextResponse.json({ error: "Store contact phone is required" }, { status: 400 });
      if (!picture || !isHttpUrl(picture)) return NextResponse.json({ error: "A valid profile photo URL is required" }, { status: 400 });
      if (!VALID_ID_TYPES.has(nationalIdType)) return NextResponse.json({ error: "Invalid national ID type" }, { status: 400 });
      if (!nationalIdNumber) return NextResponse.json({ error: "National ID number is required" }, { status: 400 });
      if (!nationalIdImage || !isHttpUrl(nationalIdImage)) return NextResponse.json({ error: "A valid national ID image URL is required" }, { status: 400 });

      const existingSlug = await prisma.reseller.findFirst({
        where: { storeSlug, NOT: { id } },
        select: { id: true },
      });
      if (existingSlug) {
        return NextResponse.json({ error: "This store slug is already in use" }, { status: 409 });
      }

      resellerData.storeName = storeName;
      resellerData.storeSlug = storeSlug;
      resellerData.bio = bioValue || null;
      resellerData.phone = phone;
      resellerData.email = resellerEmail;
      resellerData.picture = picture;
      resellerData.nationalIdType = nationalIdType;
      resellerData.nationalIdNumber = nationalIdNumber;
      resellerData.nationalIdImage = nationalIdImage;
      changedFields.push(
        "reseller.storeName",
        "reseller.storeSlug",
        "reseller.bio",
        "reseller.phone",
        "reseller.email",
        "reseller.picture",
        "reseller.nationalIdType",
        "reseller.nationalIdNumber",
        "reseller.nationalIdImage",
      );
    }

    if (!hasProfileUpdate && changedFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    if (Object.keys(userData).length > 0 || Object.keys(resellerData).length > 0) {
      await prisma.$transaction(async (tx) => {
        if (Object.keys(userData).length > 0) {
          await tx.user.update({ where: { id: reseller.userId }, data: userData });
        }
        if (Object.keys(resellerData).length > 0) {
          await tx.reseller.update({ where: { id }, data: resellerData });
        }
      });
    }

    const updated = await prisma.reseller.findUnique({
      where: { id },
      include: {
        user: { select: resellerUserSelect },
        _count: { select: { orders: true, clients: true, invoices: true, payouts: true, promotions: true, referrals: true } },
      },
    });

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (auth.user && changedFields.length > 0) {
      await logAudit({
        userId: auth.user.id,
        action: "update",
        entity: "reseller",
        entityId: id,
        details: { targetStore: updated.storeName, fields: changedFields },
        request,
      });
    }

    // Preserve status-change notification emails
    if (status && status !== reseller.status && (status === "approved" || status === "rejected" || status === "suspended")) {
      try {
        await sendResellerStatusEmail({
          status,
          userName: updated.user.name,
          userEmail: updated.user.email,
          storeSlug: updated.storeSlug,
        });
      } catch (e) {
        console.error("Failed to send reseller status email:", e);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Reseller update error:", error);
    return NextResponse.json({ error: "Failed to update reseller" }, { status: 500 });
  }
}

export async function DELETE(
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
        storeSlug: true,
        userId: true,
        user: { select: { email: true } },
        _count: {
          select: {
            orders: true,
            clients: true,
            invoices: true,
            payouts: true,
            promotions: true,
            referrals: true,
          },
        },
      },
    });
    if (!reseller) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [storeEvents, userOrders, userReviews, processedPayouts] = await Promise.all([
      prisma.storeEvent.count({ where: { resellerId: id } }),
      prisma.order.count({ where: { userId: reseller.userId } }),
      prisma.review.count({ where: { userId: reseller.userId } }),
      prisma.payout.count({ where: { processedById: reseller.userId } }),
    ]);

    const activity: Record<string, number> = {
      orders: reseller._count.orders,
      clients: reseller._count.clients,
      invoices: reseller._count.invoices,
      payouts: reseller._count.payouts,
      promotions: reseller._count.promotions,
      referrals: reseller._count.referrals,
      storeEvents,
      userOrders,
      userReviews,
      processedPayouts,
    };
    const totalActivity = Object.values(activity).reduce((sum, n) => sum + n, 0);

    if (totalActivity > 0) {
      return NextResponse.json(
        { error: "Cannot delete reseller with existing activity", activity },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id: reseller.userId } });

    if (auth.user) {
      await logAudit({
        userId: auth.user.id,
        action: "delete",
        entity: "reseller",
        entityId: id,
        details: { storeName: reseller.storeName, storeSlug: reseller.storeSlug, email: reseller.user.email, userId: reseller.userId },
        request,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reseller delete error:", error);
    return NextResponse.json({ error: "Failed to delete reseller" }, { status: 500 });
  }
}
