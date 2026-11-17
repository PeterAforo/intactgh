import { prisma } from "@/lib/db";

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

/** Shared homepage dataset — used by /api/homepage and the server-rendered home page. */
export async function getHomepageData() {
  const now = new Date();

  const featuredCats = await prisma.category.findMany({
    where: { featured: true },
    select: { id: true, name: true, slug: true, order: true },
    orderBy: { order: "asc" },
    take: 6,
  });

  const [
    heroSlides,
    categories,
    brands,
    saleProducts,
    newProducts,
    featuredProducts,
    topProducts,
    homePromos,
    categoryProducts,
    latestReview,
    productCount,
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
    // Representative products for featured categories (homepage disc)
    prisma.product.findMany({
      where: {
        status: "active",
        categoryId: { in: featuredCats.map((c) => c.id) },
        images: { some: {} },
      },
      select: { ...productSelect, categoryId: true },
      orderBy: { rating: "desc" },
      take: 60,
    }),
    // Latest written customer review for the homepage quote
    prisma.review.findFirst({
      where: { comment: { not: null }, NOT: { comment: "" }, userId: { not: null } },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        product: {
          select: {
            name: true,
            slug: true,
            images: { orderBy: { order: "asc" as const }, take: 1, select: { url: true } },
          },
        },
      },
    }),
    prisma.product.count({ where: { status: "active" } }),
  ]);

  return {
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
    // Best-rated product per featured category
    categoryPicks: featuredCats
      .map((cat) => {
        const product = categoryProducts.find((p) => p.categoryId === cat.id);
        return product ? { ...cat, product } : null;
      })
      .filter(Boolean),
    latestReview: latestReview
      ? {
          rating: latestReview.rating,
          comment: latestReview.comment,
          author: latestReview.user?.name || "Intact customer",
          productName: latestReview.product.name,
          productSlug: latestReview.product.slug,
          image: latestReview.product.images[0]?.url || null,
        }
      : null,
    stats: { productCount, brandCount: brands.length },
  };
}
