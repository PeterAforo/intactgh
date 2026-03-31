import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PUBLIC_KEYS = ["store_name", "tagline", "phone", "email", "address", "whatsapp", "facebook_url", "instagram_url", "twitter_url"];

export async function GET() {
  const settings = await prisma.siteSetting.findMany({ where: { key: { in: PUBLIC_KEYS } } });
  const mapped: Record<string, string> = {};
  for (const s of settings) mapped[s.key] = s.value;
  return NextResponse.json({ settings: mapped });
}
