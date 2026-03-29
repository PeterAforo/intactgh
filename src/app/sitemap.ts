import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://intactghana.com";

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/brands`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/promotions`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${baseUrl}/careers`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${baseUrl}/store-locations`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/ai-solutions`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  // Dynamic product pages
  const products = await prisma.product.findMany({ select: { slug: true, updatedAt: true } });
  const productPages = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic category pages
  const categories = await prisma.category.findMany({ select: { slug: true, updatedAt: true } });
  const categoryPages = categories.map((c) => ({
    url: `${baseUrl}/shop/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamic CMS pages
  const pages = await prisma.page.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } });
  const cmsPages = pages.map((p) => ({
    url: `${baseUrl}/pages/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  // News posts
  const posts = await prisma.newsPost.findMany({ where: { published: true }, select: { id: true, updatedAt: true } });
  const newsPages = posts.map((p) => ({
    url: `${baseUrl}/news/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...cmsPages, ...newsPages];
}
