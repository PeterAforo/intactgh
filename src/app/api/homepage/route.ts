import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const productSelect = {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      stock: true,
      rating: true,
      reviewCount: true,
      isNew: true,
      onSale: true,
      featured: true,
      images: { orderBy: { order: "asc" as const }, take: 1, select: { id: true, url: true, alt: true } },
      brand: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
    };

    const now = new Date();

    const [
      heroSlides,
      categories,
      brands,
      saleProducts,
      newProducts,
      featuredProducts,
      topProducts,
      homePromos,
    ] = await Promise.all([
      prisma.heroSlide.findMany({ orderBy: { order: "asc" } }),
      prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { order: "asc" },
      }),
      prisma.brand.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { status: "active", onSale: true },
        select: productSelect,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "active", isNew: true },
        select: productSelect,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "active", featured: true },
        select: productSelect,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "active" },
        select: productSelect,
        orderBy: { rating: "desc" },
        take: 8,
      }),
      // Active homepage promotions with their products
      prisma.promotion.findMany({
        where: {
          active: true,
          showOnHome: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { createdAt: "desc" },
        include: {
          products: {
            include: {
              product: {
                select: productSelect,
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      heroSlides,
      categories,
      brands,
      homePromos: homePromos.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        discount: p.discount,
        type: p.type,
        endDate: p.endDate,
        products: p.products.map((pp) => pp.product),
      })),
      productSections: {
        sale: saleProducts,
        new: newProducts,
        featured: featuredProducts,
        top: topProducts,
      },
    });
  } catch (error) {
    console.error("Homepage data error:", error);
    return NextResponse.json({ error: "Failed to load homepage" }, { status: 500 });
  }
}
