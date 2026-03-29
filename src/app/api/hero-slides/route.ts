import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json({ slides });
  } catch {
    return NextResponse.json({ slides: [] });
  }
}
