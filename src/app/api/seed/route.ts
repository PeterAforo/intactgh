import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";
import { mockCategories, mockBrands, mockProducts, mockHeroSlides } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {

    // Clear existing data (order matters for foreign keys)
    await prisma.contactMessage.deleteMany();
    await prisma.subscriber.deleteMany();
    await prisma.siteSetting.deleteMany();
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.heroSlide.deleteMany();
    await prisma.banner.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.newsPost.deleteMany();
    await prisma.page.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();

    // ── Categories ──
    for (const cat of mockCategories) {
      await prisma.category.create({
        data: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image,
          icon: cat.icon,
          featured: cat.featured,
        },
      });
    }

    // ── Brands ──
    for (const brand of mockBrands) {
      await prisma.brand.create({
        data: {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo,
        },
      });
    }

    // ── Products ──
    for (const product of mockProducts) {
      await prisma.product.create({
        data: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          comparePrice: product.comparePrice,
          sku: product.sku,
          stock: product.stock,
          categoryId: product.categoryId,
          brandId: product.brandId,
          featured: product.featured,
          isNew: product.isNew,
          onSale: product.onSale,
          rating: product.rating,
          reviewCount: product.reviewCount,
          tags: product.tags,
          images: {
            create: product.images.map((img, idx) => ({
              id: img.id,
              url: img.url,
              alt: img.alt,
              order: idx,
            })),
          },
        },
      });
    }

    // ── Hero Slides ──
    for (let i = 0; i < mockHeroSlides.length; i++) {
      const slide = mockHeroSlides[i];
      await prisma.heroSlide.create({
        data: {
          title: slide.title,
          subtitle: slide.subtitle,
          description: slide.description,
          image: slide.image,
          buttonText: slide.buttonText,
          buttonLink: slide.buttonLink,
          order: i,
          active: true,
        },
      });
    }

    // ── Banners ──
    const banners = [
      {
        title: "Free Delivery on Orders Over GH₵3,000",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=300&fit=crop",
        link: "/shop",
        position: "top",
        active: true,
        order: 0,
      },
      {
        title: "Samsung Galaxy Week — Up to 25% Off",
        image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=400&fit=crop",
        link: "/shop?brand=samsung",
        position: "sidebar",
        active: true,
        order: 1,
      },
      {
        title: "New MacBook Pro M3 — Now Available",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop",
        link: "/product/macbook-pro-14-m3-pro-512gb",
        position: "sidebar",
        active: true,
        order: 2,
      },
    ];
    for (const banner of banners) {
      await prisma.banner.create({ data: banner });
    }

    // ── Promotions ──
    const now = new Date();
    const promotions = [
      {
        title: "New Customer Discount",
        description: "Get 10% off your first order when you create an account.",
        code: "WELCOME10",
        discount: 10,
        type: "percentage",
        startDate: now,
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        active: true,
      },
      {
        title: "Free Delivery Week",
        description: "Free delivery on all orders this week — no minimum!",
        code: "FREEDELIVERY",
        discount: 100,
        type: "fixed_shipping",
        startDate: now,
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        active: true,
      },
      {
        title: "Samsung Galaxy Week",
        description: "Up to 25% off all Samsung smartphones, tablets, and accessories.",
        code: "SAMSUNG25",
        discount: 25,
        type: "percentage",
        startDate: now,
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        active: true,
      },
      {
        title: "Back to School",
        description: "Special prices on laptops and accessories for students.",
        code: "SCHOOL15",
        discount: 15,
        type: "percentage",
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        active: true,
      },
    ];
    for (const promo of promotions) {
      await prisma.promotion.create({ data: promo });
    }

    // ── News Posts ──
    const newsPosts = [
      {
        title: "Intact Ghana Opens New Showroom at A&C Mall, East Legon",
        slug: "intact-ghana-opens-new-showroom-ac-mall",
        excerpt: "We are excited to announce the opening of our brand new showroom at the A&C Mall in East Legon, Accra.",
        content: "We are thrilled to announce the grand opening of our new flagship showroom at the A&C Mall in East Legon, Accra. This state-of-the-art showroom features interactive product displays, a dedicated Apple experience zone, and a Samsung Galaxy studio.\n\nThe showroom is open Monday to Saturday, 8:00 AM to 6:00 PM. Visit us today and enjoy exclusive opening week discounts of up to 20% off selected items.",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
        published: true,
      },
      {
        title: "Samsung Galaxy S24 Ultra Now Available in Ghana",
        slug: "samsung-galaxy-s24-ultra-available-ghana",
        excerpt: "Be among the first in Ghana to own the revolutionary Samsung Galaxy S24 Ultra with Galaxy AI.",
        content: "The wait is over! The Samsung Galaxy S24 Ultra is now officially available at Intact Ghana. Features Galaxy AI, 200MP camera, Snapdragon 8 Gen 3, and titanium frame.\n\nAvailable in Titanium Black, Gray, Violet, and Yellow. Starting at GH₵15,999.",
        image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=400&fit=crop",
        published: true,
      },
      {
        title: "Why Buy Now, Pay Later is Changing Shopping in Ghana",
        slug: "buy-now-pay-later-changing-shopping-ghana",
        excerpt: "Discover how CanPay BNPL is making premium electronics accessible to more Ghanaians.",
        content: "At Intact Ghana, we believe everyone deserves access to quality technology. That's why we've partnered with CanPay to offer Buy Now, Pay Later (BNPL) on all purchases.\n\nSplit payments into monthly installments, enjoy 0% interest on qualifying purchases, get approved in minutes.",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
        published: true,
      },
    ];
    for (const post of newsPosts) {
      await prisma.newsPost.create({ data: post });
    }

    // ── Pages ──
    const pages = [
      {
        title: "Privacy Policy",
        slug: "privacy-policy",
        content: "# Privacy Policy\n\nIntact Ghana respects your privacy and is committed to protecting your personal data.\n\n## Information We Collect\n- Personal identification (name, email, phone)\n- Shipping address and GPS coordinates\n- Payment information (via Hubtel/CanPay)\n\n## How We Use Your Data\n- Process and fulfill orders\n- Communicate order updates\n- Improve our services\n\n## Your Rights\nContact us at info@intactghana.com to access, correct, or delete your data.\n\nLast updated: March 2026",
        metaTitle: "Privacy Policy | Intact Ghana",
        metaDesc: "How Intact Ghana collects, uses, and protects your personal information.",
        published: true,
      },
      {
        title: "Terms & Conditions",
        slug: "terms-conditions",
        content: "# Terms & Conditions\n\n## Orders & Payment\n- Prices in Ghana Cedis (GH₵)\n- Payment via Hubtel, CanPay BNPL, COD, or in-store\n\n## Shipping & Delivery\n- Standard: 2-5 business days\n- Express (Yango/Bolt): same-day in Accra\n- Free delivery over GH₵3,000\n\n## Returns\n- 7-day return window, unused and original packaging\n- Refunds within 5-10 business days\n\nLast updated: March 2026",
        metaTitle: "Terms & Conditions | Intact Ghana",
        metaDesc: "Terms and conditions for shopping with Intact Ghana.",
        published: true,
      },
      {
        title: "Return Policy",
        slug: "return-policy",
        content: "# Return Policy\n\n## Return Window\n- 7 days from delivery\n- Items must be unused, in original packaging\n\n## How to Return\n1. Contact returns@intactghana.com or call +233 543 645 126\n2. Provide order number and reason\n3. We arrange pickup or drop-off\n\n## Non-Returnable\n- Opened software, in-ear headphones, customized items\n\nLast updated: March 2026",
        metaTitle: "Return Policy | Intact Ghana",
        metaDesc: "Return and exchange policies for Intact Ghana.",
        published: true,
      },
      {
        title: "Shipping Policy",
        slug: "shipping-policy",
        content: "# Shipping Policy\n\n## Options\n- **Yango**: 1-3 hours (Accra)\n- **Bolt**: 1-4 hours (Accra)\n- **Standard**: 2-5 days (GH₵50, free over GH₵3,000)\n- **Pickup**: Free at any location\n\n## Tracking\nSMS/email at each stage: confirmed, dispatched, out for delivery, delivered.\n\nLast updated: March 2026",
        metaTitle: "Shipping Policy | Intact Ghana",
        metaDesc: "Delivery options and timelines for Intact Ghana orders.",
        published: true,
      },
      {
        title: "Warranty Information",
        slug: "warranty-information",
        content: "# Warranty Information\n\n## Coverage\n- Smartphones: 12 months\n- Laptops: 12-24 months\n- TVs: 24 months\n- Appliances: 12-24 months\n\n## How to Claim\n1. Visit East Legon (A&C Mall) showroom\n2. Bring receipt/order confirmation\n3. Assessment and repair/replacement within 7-14 days\n\nLast updated: March 2026",
        metaTitle: "Warranty Information | Intact Ghana",
        metaDesc: "Warranty coverage for products from Intact Ghana.",
        published: true,
      },
    ];
    for (const page of pages) {
      await prisma.page.create({ data: page });
    }

    // ── Site Settings ──
    const settings = [
      { key: "store_name", value: "Intact Ghana" },
      { key: "tagline", value: "Racing with Technology" },
      { key: "email", value: "info@intactghana.com" },
      { key: "phone", value: "+233 543 645 126" },
      { key: "address", value: "East Legon, A&C Mall, Greater Accra, Ghana" },
      { key: "currency", value: "GHS" },
      { key: "currency_symbol", value: "GH₵" },
      { key: "free_shipping_min", value: "3000" },
      { key: "store_lat", value: "5.6416602" },
      { key: "store_lng", value: "-0.1520491" },
      { key: "google_maps_url", value: "https://maps.app.goo.gl/SouvPoRFKoaqTtaW7" },
      { key: "facebook_url", value: "https://facebook.com/intactghana" },
      { key: "instagram_url", value: "https://instagram.com/intactghana" },
      { key: "twitter_url", value: "https://twitter.com/intactghana" },
      { key: "whatsapp", value: "+233543645126" },
    ];
    for (const s of settings) {
      await prisma.siteSetting.create({ data: s });
    }

    // ── Users ──
    // bcrypt hash placeholder for "admin123"
    const adminHash = "$2b$10$8K1p/WEOvD7.6QVxzLqKLeYqHn5KVjZ7K6F4F4qKIEBiIGCe2kj5G";
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@intactghana.com",
        password: adminHash,
        role: "admin",
        phone: "+233543645126",
      },
    });

    await prisma.user.create({
      data: {
        name: "Kwame Mensah",
        email: "kwame@email.com",
        password: adminHash,
        role: "customer",
        phone: "+233241234567",
        addresses: {
          create: {
            name: "Kwame Mensah",
            phone: "+233241234567",
            street: "12 Independence Avenue",
            city: "Accra",
            region: "Greater Accra",
            isDefault: true,
          },
        },
      },
    });

    const counts = {
      categories: mockCategories.length,
      brands: mockBrands.length,
      products: mockProducts.length,
      heroSlides: mockHeroSlides.length,
      banners: banners.length,
      promotions: promotions.length,
      newsPosts: newsPosts.length,
      pages: pages.length,
      settings: settings.length,
      users: 2,
    };

    console.log("🎉 Database seeding complete!", counts);
    return NextResponse.json({ success: true, counts });
  } catch (error) {
    console.error("❌ Seed error:", error);
    return NextResponse.json(
      { error: "Seed failed", details: String(error) },
      { status: 500 }
    );
  }
}
