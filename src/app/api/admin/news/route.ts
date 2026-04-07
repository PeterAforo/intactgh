import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  const posts = await prisma.newsPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const { title, slug, excerpt, content, image, published } = await request.json();
    if (!title || !slug || !content) {
      return NextResponse.json({ error: "Title, slug, and content required" }, { status: 400 });
    }
    const post = await prisma.newsPost.create({
      data: { title, slug, excerpt, content, image, published: published !== false },
    });
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("News create error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
