import { PrismaClient } from "@prisma/client";
import { mockCategories, mockBrands, mockProducts, mockHeroSlides } from "../src/lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

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
  console.log(`✅ ${mockCategories.length} categories seeded`);

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
  console.log(`✅ ${mockBrands.length} brands seeded`);

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
  console.log(`✅ ${mockProducts.length} products seeded`);

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
  console.log(`✅ ${mockHeroSlides.length} hero slides seeded`);

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
  console.log(`✅ ${banners.length} banners seeded`);

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
  console.log(`✅ ${promotions.length} promotions seeded`);

  // ── News Posts ──
  const newsPosts = [
    {
      title: "Intact Ghana Opens New Showroom at A&C Mall, East Legon",
      slug: "intact-ghana-opens-new-showroom-ac-mall",
      excerpt: "We are excited to announce the opening of our brand new showroom at the A&C Mall in East Legon, Accra.",
      content: "We are thrilled to announce the grand opening of our new flagship showroom at the A&C Mall in East Legon, Accra. This state-of-the-art showroom features interactive product displays, a dedicated Apple experience zone, and a Samsung Galaxy studio. Customers can experience the latest technology hands-on before making a purchase.\n\nThe showroom is open Monday to Saturday, 8:00 AM to 6:00 PM. Visit us today and enjoy exclusive opening week discounts of up to 20% off selected items.\n\nOur knowledgeable staff are ready to help you find the perfect tech solutions for your needs, whether you're looking for a new smartphone, laptop, or home entertainment system.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
      published: true,
    },
    {
      title: "Samsung Galaxy S24 Ultra Now Available in Ghana",
      slug: "samsung-galaxy-s24-ultra-available-ghana",
      excerpt: "Be among the first in Ghana to own the revolutionary Samsung Galaxy S24 Ultra with Galaxy AI.",
      content: "The wait is over! The Samsung Galaxy S24 Ultra is now officially available at Intact Ghana. This groundbreaking smartphone features Galaxy AI, the most powerful AI-driven mobile experience ever.\n\nKey features include:\n- 6.8-inch Dynamic AMOLED 2X display\n- 200MP camera system with AI-enhanced photography\n- Snapdragon 8 Gen 3 processor\n- Titanium frame for premium durability\n- Circle to Search with Google\n- Live Translate for real-time call translations\n\nVisit our showroom or order online today. Available in Titanium Black, Titanium Gray, Titanium Violet, and Titanium Yellow. Starting at GH₵15,999.",
      image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=400&fit=crop",
      published: true,
    },
    {
      title: "Why Buy Now, Pay Later is Changing Shopping in Ghana",
      slug: "buy-now-pay-later-changing-shopping-ghana",
      excerpt: "Discover how CanPay BNPL is making premium electronics accessible to more Ghanaians.",
      content: "At Intact Ghana, we believe everyone deserves access to quality technology. That's why we've partnered with CanPay to offer Buy Now, Pay Later (BNPL) on all purchases.\n\nWith CanPay BNPL, you can:\n- Split your payment into manageable monthly installments\n- Enjoy 0% interest on qualifying purchases\n- Get approved in minutes with a simple application\n- Start using your product immediately\n\nWhether you need a new laptop for work, a smartphone for staying connected, or a TV for family entertainment, BNPL makes it possible without straining your budget.\n\nVisit intactghana.com or our showroom to learn more about available BNPL options.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
      published: true,
    },
  ];
  for (const post of newsPosts) {
    await prisma.newsPost.create({ data: post });
  }
  console.log(`✅ ${newsPosts.length} news posts seeded`);

  // ── Pages ──
  const pages = [
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      content: "# Privacy Policy\n\nIntact Ghana (\"we\", \"us\", \"our\") respects your privacy and is committed to protecting your personal data.\n\n## Information We Collect\n- Personal identification (name, email, phone number)\n- Shipping address and GPS coordinates\n- Payment information (processed securely via Hubtel/CanPay)\n- Browsing behavior and preferences\n\n## How We Use Your Data\n- Process and fulfill your orders\n- Communicate order updates via email/SMS\n- Improve our products and services\n- Send promotional offers (with your consent)\n\n## Data Security\nWe implement industry-standard security measures including SSL encryption, secure payment processing, and regular security audits.\n\n## Your Rights\nYou have the right to access, correct, or delete your personal data. Contact us at info@intactghana.com.\n\nLast updated: March 2026",
      metaTitle: "Privacy Policy | Intact Ghana",
      metaDesc: "Learn how Intact Ghana collects, uses, and protects your personal information.",
      published: true,
    },
    {
      title: "Terms & Conditions",
      slug: "terms-conditions",
      content: "# Terms & Conditions\n\nBy using the Intact Ghana website and services, you agree to these terms.\n\n## Orders & Payment\n- All prices are in Ghana Cedis (GH₵) and include applicable taxes\n- We accept payment via Hubtel (MoMo, Visa, Mastercard), CanPay BNPL, cash on delivery, and in-store payment\n- Orders are confirmed upon successful payment or acceptance of COD terms\n\n## Shipping & Delivery\n- Standard delivery: 2-5 business days within Greater Accra\n- Express delivery via Yango/Bolt: same-day delivery in Accra\n- Free standard delivery on orders over GH₵3,000\n\n## Returns & Refunds\n- Products may be returned within 7 days of delivery if unused and in original packaging\n- Refunds are processed within 5-10 business days\n- Some items (opened software, earphones) are non-returnable for hygiene reasons\n\n## Warranty\n- All products come with manufacturer warranty\n- Warranty claims should be made at our showroom with proof of purchase\n\nLast updated: March 2026",
      metaTitle: "Terms & Conditions | Intact Ghana",
      metaDesc: "Read the terms and conditions for shopping with Intact Ghana.",
      published: true,
    },
    {
      title: "Return Policy",
      slug: "return-policy",
      content: "# Return Policy\n\nWe want you to be completely satisfied with your purchase.\n\n## Return Window\n- You have 7 days from delivery to initiate a return\n- Items must be unused, in original packaging with all accessories\n\n## How to Return\n1. Contact us at returns@intactghana.com or call +233 543 645 126\n2. Provide your order number and reason for return\n3. We will arrange pickup or provide drop-off instructions\n4. Refund is processed upon inspection of returned item\n\n## Non-Returnable Items\n- Opened software and digital products\n- In-ear headphones and earbuds (hygiene)\n- Customized or personalized items\n- Items damaged through misuse\n\n## Exchanges\nWe offer direct exchanges for defective products within the warranty period.\n\nLast updated: March 2026",
      metaTitle: "Return Policy | Intact Ghana",
      metaDesc: "Learn about Intact Ghana's return and exchange policies.",
      published: true,
    },
    {
      title: "Shipping Policy",
      slug: "shipping-policy",
      content: "# Shipping Policy\n\n## Delivery Options\n- **Yango Delivery**: 1-3 hours within Accra (fee based on distance)\n- **Bolt Delivery**: 1-4 hours within Accra (fee based on distance)\n- **Standard Delivery**: 2-5 business days (GH₵50, free over GH₵3,000)\n- **Store Pickup**: Free — collect from any Intact Ghana location\n\n## Delivery Areas\nWe deliver to all 16 regions in Ghana. Express delivery (Yango/Bolt) is currently available in Greater Accra only.\n\n## Order Tracking\nYou will receive SMS/email notifications at each stage:\n1. Order confirmed\n2. Order dispatched\n3. Out for delivery\n4. Delivered\n\n## Delivery Issues\nIf your order hasn't arrived within the expected timeframe, contact us at +233 543 645 126.\n\nLast updated: March 2026",
      metaTitle: "Shipping Policy | Intact Ghana",
      metaDesc: "Delivery options, costs, and timelines for Intact Ghana orders.",
      published: true,
    },
    {
      title: "Warranty Information",
      slug: "warranty-information",
      content: "# Warranty Information\n\nAll products sold by Intact Ghana come with full manufacturer warranty.\n\n## Warranty Coverage\n- **Smartphones**: 12 months manufacturer warranty\n- **Laptops**: 12-24 months depending on brand\n- **TVs**: 24 months manufacturer warranty\n- **Home Appliances**: 12-24 months\n- **Audio & Accessories**: 6-12 months\n\n## How to Claim Warranty\n1. Visit our showroom at East Legon (A&C Mall) with your product\n2. Bring your receipt or order confirmation\n3. Our technicians will assess the issue\n4. Repair or replacement within 7-14 business days\n\n## What's Not Covered\n- Physical damage from drops or water exposure\n- Unauthorized modifications or repairs\n- Normal wear and tear\n- Software issues (we offer paid support for these)\n\nLast updated: March 2026",
      metaTitle: "Warranty Information | Intact Ghana",
      metaDesc: "Warranty coverage details for products purchased from Intact Ghana.",
      published: true,
    },
  ];
  for (const page of pages) {
    await prisma.page.create({ data: page });
  }
  console.log(`✅ ${pages.length} pages seeded`);

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
  console.log(`✅ ${settings.length} site settings seeded`);

  // ── Admin User (password: admin123) ──
  // bcrypt hash for "admin123" with 10 rounds
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@intactghana.com",
      password: "$2b$10$8K1p/WEOvD7.6QVxzLqKLeYqHn5KVjZ7K6F4F4qKIEBiIGCe2kj5G",
      role: "admin",
      phone: "+233543645126",
    },
  });

  // Sample customer user (password: customer123)
  await prisma.user.create({
    data: {
      name: "Kwame Mensah",
      email: "kwame@email.com",
      password: "$2b$10$8K1p/WEOvD7.6QVxzLqKLeYqHn5KVjZ7K6F4F4qKIEBiIGCe2kj5G",
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
  console.log("✅ Users seeded (admin + sample customer)");

  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
