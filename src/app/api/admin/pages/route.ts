import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  const pages = await prisma.page.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ pages });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { title, slug, content, metaTitle, metaDesc, published } = await request.json();
    if (!title || !slug || !content) {
      return NextResponse.json({ error: "Title, slug, and content required" }, { status: 400 });
    }
    const page = await prisma.page.create({
      data: { title, slug, content, metaTitle, metaDesc, published: published !== false },
    });
    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error("Page create error:", error);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
