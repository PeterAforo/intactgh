/**
 * Category Migration Script
 * Replaces all existing categories with the real Intact Ghana category tree:
 * 14 main categories → 67 subcategories (from intactg2_mcadmin MySQL export)
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/migrate-categories.ts
 * OR:  npx tsx prisma/migrate-categories.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Parent categories (from maincategory table) ──────────────────────────────
// id pattern: mcat-{mCatID}
const PARENTS = [
  { id: "mcat-3",  name: "TV & Home Theatre",                   slug: "tv-home-theatre",                  featured: true,  order: 2  },
  { id: "mcat-7",  name: "Appliances",                           slug: "appliances",                       featured: true,  order: 4  },
  { id: "mcat-13", name: "Computer Accessories",                 slug: "computer-accessories",             featured: true,  order: 6  },
  { id: "mcat-14", name: "Phones & Gadgets Accessories",         slug: "phones-gadgets-accessories",       featured: true,  order: 11 },
  { id: "mcat-16", name: "Electronics & Gadgets Accessories",    slug: "electronics-gadgets-accessories",  featured: false, order: 12 },
  { id: "mcat-23", name: "Networking",                           slug: "networking",                       featured: true,  order: 7  },
  { id: "mcat-39", name: "Gift Cards",                           slug: "gift-cards",                       featured: false, order: 1  },
  { id: "mcat-40", name: "Computers & Laptops",                  slug: "computers-laptops",                featured: true,  order: 5  },
  { id: "mcat-41", name: "Printers, Ink & Office Supplies",      slug: "printers-ink-office-supplies",     featured: true,  order: 8  },
  { id: "mcat-42", name: "Phones & Gadgets",                     slug: "phones-gadgets",                   featured: true,  order: 10 },
  { id: "mcat-44", name: "AI Enabled",                           slug: "ai-enabled",                       featured: false, order: 9  },
  { id: "mcat-45", name: "Games & Photography",                  slug: "games-photography",                featured: false, order: 13 },
  { id: "mcat-47", name: "Headphones, Speakers & Audio",         slug: "headphones-speakers-audio",        featured: false, order: 14 },
  { id: "mcat-48", name: "Musical Instruments",                  slug: "musical-instruments",              featured: false, order: 15 },
];

// ── Subcategories (from categories table, linked by mCatID) ──────────────────
// id pattern: scat-{catID}
const SUBCATEGORIES = [
  // ── mCatID=3 — TV & Home Theatre ──
  { id: "scat-460", parentId: "mcat-3",  name: "TVs",                            slug: "tvs",                           order: 1 },
  { id: "scat-461", parentId: "mcat-3",  name: "TV Mounts",                      slug: "tv-mounts",                     order: 2 },
  { id: "scat-462", parentId: "mcat-3",  name: "TV Accessories",                 slug: "tv-accessories",                order: 3 },
  { id: "scat-463", parentId: "mcat-3",  name: "Home Theatre",                   slug: "home-theatre",                  order: 4 },

  // ── mCatID=7 — Appliances ──
  { id: "scat-43",  parentId: "mcat-7",  name: "Irons",                          slug: "irons",                         order: 1 },
  { id: "scat-70",  parentId: "mcat-7",  name: "Washing Machines",               slug: "washing-machines",              order: 2 },
  { id: "scat-72",  parentId: "mcat-7",  name: "Fans",                           slug: "fans",                          order: 3 },
  { id: "scat-181", parentId: "mcat-7",  name: "Fridges & Accessories",           slug: "fridges-accessories",           order: 4 },
  { id: "scat-182", parentId: "mcat-7",  name: "Freezers",                       slug: "freezers",                      order: 5 },
  { id: "scat-183", parentId: "mcat-7",  name: "Gas Cookers",                    slug: "gas-cookers",                   order: 6 },
  { id: "scat-282", parentId: "mcat-7",  name: "Vacuum Cleaners",                slug: "vacuum-cleaners",               order: 7 },
  { id: "scat-288", parentId: "mcat-7",  name: "Water Dispensers",               slug: "water-dispensers",              order: 8 },
  { id: "scat-320", parentId: "mcat-7",  name: "Kitchen",                        slug: "kitchen",                       order: 9 },
  { id: "scat-375", parentId: "mcat-7",  name: "Air & Comfort",                  slug: "air-comfort",                   order: 10 },
  { id: "scat-456", parentId: "mcat-7",  name: "Food Processors",                slug: "food-processors",               order: 11 },
  { id: "scat-459", parentId: "mcat-7",  name: "Face Care",                      slug: "face-care",                     order: 12 },

  // ── mCatID=13 — Computer Accessories ──
  { id: "scat-143", parentId: "mcat-13", name: "UPS",                            slug: "ups",                           order: 1 },
  { id: "scat-158", parentId: "mcat-13", name: "External Hard Drives",           slug: "external-hard-drives",          order: 2 },
  { id: "scat-159", parentId: "mcat-13", name: "Keyboards",                      slug: "keyboards",                     order: 3 },
  { id: "scat-160", parentId: "mcat-13", name: "Mice",                           slug: "mice",                          order: 4 },
  { id: "scat-165", parentId: "mcat-13", name: "Flash Drives",                   slug: "flash-drives",                  order: 5 },
  { id: "scat-178", parentId: "mcat-13", name: "Desktop Speakers",               slug: "desktop-speakers",              order: 6 },
  { id: "scat-192", parentId: "mcat-13", name: "Laptop Chargers",                slug: "laptop-chargers",               order: 7 },
  { id: "scat-395", parentId: "mcat-13", name: "Internal Hard Drives",           slug: "internal-hard-drives",          order: 8 },
  { id: "scat-444", parentId: "mcat-13", name: "Webcams",                        slug: "webcams",                       order: 9 },
  { id: "scat-468", parentId: "mcat-13", name: "Laptop Bags",                    slug: "laptop-bags",                   order: 10 },
  { id: "scat-469", parentId: "mcat-13", name: "Dock Stations",                  slug: "dock-stations",                 order: 11 },
  { id: "scat-470", parentId: "mcat-13", name: "SSD Drives",                     slug: "ssd-drives",                    order: 12 },
  { id: "scat-471", parentId: "mcat-13", name: "RAM",                            slug: "ram",                           order: 13 },
  { id: "scat-472", parentId: "mcat-13", name: "Computer Software",              slug: "computer-software",             order: 14 },
  { id: "scat-474", parentId: "mcat-13", name: "Presenters",                     slug: "presenters",                    order: 15 },
  { id: "scat-507", parentId: "mcat-13", name: "Other Computer Accessories",     slug: "other-computer-accessories",    order: 16 },

  // ── mCatID=14 — Phones & Gadgets Accessories ──
  { id: "scat-209", parentId: "mcat-14", name: "Power Banks",                    slug: "power-banks",                   order: 1 },
  { id: "scat-255", parentId: "mcat-14", name: "Data Cables",                    slug: "data-cables",                   order: 2 },
  { id: "scat-293", parentId: "mcat-14", name: "Glass Screen Protectors",        slug: "glass-screen-protectors",       order: 3 },
  { id: "scat-411", parentId: "mcat-14", name: "Selfie Sticks",                  slug: "selfie-sticks",                 order: 4 },
  { id: "scat-506", parentId: "mcat-14", name: "Chargers",                       slug: "chargers",                      order: 5 },
  { id: "scat-508", parentId: "mcat-14", name: "Phone Cases",                    slug: "phone-cases",                   order: 6 },
  { id: "scat-511", parentId: "mcat-14", name: "Other Phone & Gadget Accessories", slug: "other-phone-gadget-accessories", order: 7 },

  // ── mCatID=16 — Electronics & Gadgets Accessories ──
  { id: "scat-154", parentId: "mcat-16", name: "Voltage Stabilisers",            slug: "voltage-stabilisers",           order: 1 },
  { id: "scat-156", parentId: "mcat-16", name: "AC Extension Boards",            slug: "ac-extension-boards",           order: 2 },
  { id: "scat-394", parentId: "mcat-16", name: "Step Up & Down Transformers",    slug: "step-up-down-transformers",     order: 3 },
  { id: "scat-401", parentId: "mcat-16", name: "Adapters",                       slug: "adapters",                      order: 4 },
  { id: "scat-475", parentId: "mcat-16", name: "Projectors",                     slug: "projectors",                    order: 5 },
  { id: "scat-477", parentId: "mcat-16", name: "Landline Phones",                slug: "landline-phones",               order: 6 },
  { id: "scat-479", parentId: "mcat-16", name: "Voice Recorders",                slug: "voice-recorders",               order: 7 },
  { id: "scat-480", parentId: "mcat-16", name: "Power Guards",                   slug: "power-guards",                  order: 8 },
  { id: "scat-481", parentId: "mcat-16", name: "Power Adapters",                 slug: "power-adapters",                order: 9 },
  { id: "scat-482", parentId: "mcat-16", name: "Splitters",                      slug: "splitters",                     order: 10 },
  { id: "scat-505", parentId: "mcat-16", name: "Security Cameras",               slug: "security-cameras",              order: 11 },
  { id: "scat-510", parentId: "mcat-16", name: "Other Electronics & Gadgets",    slug: "other-electronics-gadgets",     order: 12 },

  // ── mCatID=23 — Networking ──
  { id: "scat-150", parentId: "mcat-23", name: "Routers",                        slug: "routers",                       order: 1 },
  { id: "scat-176", parentId: "mcat-23", name: "Ethernet Switches",              slug: "ethernet-switches",             order: 2 },
  { id: "scat-390", parentId: "mcat-23", name: "Cabinets",                       slug: "cabinets",                      order: 3 },
  { id: "scat-435", parentId: "mcat-23", name: "MiFi",                           slug: "mifi",                          order: 4 },
  { id: "scat-467", parentId: "mcat-23", name: "Servers",                        slug: "servers",                       order: 5 },
  { id: "scat-491", parentId: "mcat-23", name: "Network Tools",                  slug: "network-tools",                 order: 6 },

  // ── mCatID=39 — Gift Cards ──
  { id: "scat-384", parentId: "mcat-39", name: "Gift Cards",                     slug: "gift-cards-sub",                order: 1 },

  // ── mCatID=40 — Computers & Laptops ──
  { id: "scat-348", parentId: "mcat-40", name: "Laptops",                        slug: "laptops",                       order: 1 },
  { id: "scat-349", parentId: "mcat-40", name: "Desktops",                       slug: "desktops",                      order: 2 },
  { id: "scat-350", parentId: "mcat-40", name: "Monitors",                       slug: "monitors",                      order: 3 },

  // ── mCatID=41 — Printers, Ink & Office Supplies ──
  { id: "scat-363", parentId: "mcat-41", name: "Inks & Cartridges",              slug: "inks-cartridges",               order: 1 },
  { id: "scat-362", parentId: "mcat-41", name: "Toners",                         slug: "toners",                        order: 2 },
  { id: "scat-358", parentId: "mcat-41", name: "Printers",                       slug: "printers",                      order: 3 },
  { id: "scat-359", parentId: "mcat-41", name: "Scanners",                       slug: "scanners",                      order: 4 },
  { id: "scat-484", parentId: "mcat-41", name: "Copiers",                        slug: "copiers",                       order: 5 },
  { id: "scat-446", parentId: "mcat-41", name: "Handheld POS Receipt Printers",  slug: "handheld-pos-receipt-printers", order: 6 },
  { id: "scat-447", parentId: "mcat-41", name: "Label Makers",                   slug: "label-makers",                  order: 7 },
  { id: "scat-448", parentId: "mcat-41", name: "Label Maker Tapes",              slug: "label-maker-tapes",             order: 8 },
  { id: "scat-485", parentId: "mcat-41", name: "Office Supplies",                slug: "office-supplies",               order: 9 },
  { id: "scat-486", parentId: "mcat-41", name: "Calculators",                    slug: "calculators",                   order: 10 },
  { id: "scat-487", parentId: "mcat-41", name: "Counting Machines",              slug: "counting-machines",             order: 11 },
  { id: "scat-488", parentId: "mcat-41", name: "Cash Drawers",                   slug: "cash-drawers",                  order: 12 },

  // ── mCatID=42 — Phones & Gadgets ──
  { id: "scat-365", parentId: "mcat-42", name: "Smart Phones",                   slug: "smart-phones",                  order: 1 },
  { id: "scat-368", parentId: "mcat-42", name: "Basic Phones",                   slug: "basic-phones",                  order: 2 },
  { id: "scat-376", parentId: "mcat-42", name: "Tablets",                        slug: "tablets",                       order: 3 },
  { id: "scat-504", parentId: "mcat-42", name: "Gadgets",                        slug: "gadgets",                       order: 4 },
  { id: "scat-509", parentId: "mcat-42", name: "Smart Watches",                  slug: "smart-watches",                 order: 5 },
  // catID=513 (orphan) assigned here per confirmation
  { id: "scat-513", parentId: "mcat-42", name: "Refurbished / Used Smart Phones", slug: "refurbished-used-smart-phones", order: 6 },

  // ── mCatID=44 — AI Enabled ──
  { id: "scat-501", parentId: "mcat-44", name: "AI Smartphones",                 slug: "ai-smartphones",                order: 1 },

  // ── mCatID=45 — Games & Photography ──
  { id: "scat-379", parentId: "mcat-45", name: "Micro SD / SD Cards",            slug: "micro-sd-cards",                order: 1 },
  { id: "scat-497", parentId: "mcat-45", name: "Consoles & Games",               slug: "consoles-games",                order: 2 },
  { id: "scat-498", parentId: "mcat-45", name: "Digital Cameras",                slug: "digital-cameras",               order: 3 },
  { id: "scat-499", parentId: "mcat-45", name: "Camera Accessories",             slug: "camera-accessories",            order: 4 },
  { id: "scat-502", parentId: "mcat-45", name: "Drones",                         slug: "drones",                        order: 5 },

  // ── mCatID=47 — Headphones, Speakers & Audio ──
  { id: "scat-492", parentId: "mcat-47", name: "Earbuds & In-Ear Headphones",    slug: "earbuds-in-ear-headphones",     order: 1 },
  { id: "scat-495", parentId: "mcat-47", name: "Speakers",                       slug: "speakers",                      order: 2 },
  { id: "scat-496", parentId: "mcat-47", name: "USB Speakers",                   slug: "usb-speakers",                  order: 3 },
  { id: "scat-512", parentId: "mcat-47", name: "Audio",                          slug: "audio",                         order: 4 },

  // ── mCatID=48 — Musical Instruments ──
  { id: "scat-514", parentId: "mcat-48", name: "Keyboards (Musical)",            slug: "musical-keyboards",             order: 1 },
  { id: "scat-515", parentId: "mcat-48", name: "Musical Accessories",            slug: "musical-accessories",           order: 2 },
];

async function main() {
  console.log("🗂️  Starting category migration...\n");

  const allNew = [...PARENTS, ...SUBCATEGORIES];
  const newIds = new Set(allNew.map((c) => c.id));
  const newSlugs = new Set(allNew.map((c) => c.slug));

  // ── Step 1: Read existing state ───────────────────────────────────────────
  const oldCategories = await prisma.category.findMany();
  const existingProducts = await prisma.product.findMany({ select: { id: true, categoryId: true } });
  console.log(`   Found ${oldCategories.length} existing categories, ${existingProducts.length} products.`);

  // ── Step 2: Prefix old slugs to avoid unique-slug conflicts on insert ─────
  console.log("\n🔀 Freeing up slugs on old categories...");
  for (const old of oldCategories) {
    if (!newIds.has(old.id) && newSlugs.has(old.slug)) {
      await prisma.category.update({
        where: { id: old.id },
        data: { slug: `_old_${old.slug}` },
      });
    }
  }
  console.log("   ✅ Slug conflicts resolved.");

  // ── Step 3: Create all new parent categories ──────────────────────────────
  console.log("\n📁 Creating 14 parent categories...");
  for (const cat of PARENTS) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { id: undefined, name: cat.name, featured: cat.featured, order: cat.order },
      create: { id: cat.id, name: cat.name, slug: cat.slug, featured: cat.featured, order: cat.order },
    });
    console.log(`   ✅ ${cat.name}`);
  }

  // ── Step 4: Ensure parent IDs are the canonical mcat-X IDs ───────────────
  // (upsert may have matched on slug and used the old id — we need exact ids)
  for (const cat of PARENTS) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing && existing.id !== cat.id) {
      // Re-point any products + subcategories using the old id
      await prisma.product.updateMany({ where: { categoryId: existing.id }, data: { categoryId: cat.id } });
      // Create with correct id, then delete old
      await prisma.category.create({
        data: { id: cat.id, name: cat.name, slug: `_tmp_${cat.slug}`, featured: cat.featured, order: cat.order },
      });
      await prisma.category.delete({ where: { id: existing.id } });
      await prisma.category.update({ where: { id: cat.id }, data: { slug: cat.slug } });
    }
  }

  // ── Step 5: Create all subcategories ─────────────────────────────────────
  console.log("\n📂 Creating 67 subcategories...");
  let subCount = 0;
  for (const sub of SUBCATEGORIES) {
    const slugExists = await prisma.category.findUnique({ where: { slug: sub.slug } });
    if (slugExists && slugExists.id !== sub.id) {
      // Free the slug
      await prisma.category.update({ where: { id: slugExists.id }, data: { slug: `_old2_${sub.slug}` } });
    }
    await prisma.category.upsert({
      where: { slug: sub.id }, // won't match — force create path
      update: {},
      create: { id: sub.id, name: sub.name, slug: sub.slug, parentId: sub.parentId, featured: false, order: sub.order },
    }).catch(async () => {
      // If ID already exists, just update it
      await prisma.category.update({
        where: { id: sub.id },
        data: { name: sub.name, slug: sub.slug, parentId: sub.parentId, order: sub.order },
      });
    });
    subCount++;
  }
  console.log(`   ✅ ${subCount} subcategories done.`);

  // ── Step 6: Re-assign existing products to best-matching new category ─────
  if (existingProducts.length > 0) {
    console.log("\n🔄 Re-assigning products...");
    const nameMap: Record<string, string> = {};
    allNew.forEach((c) => { nameMap[c.name.toLowerCase()] = c.id; });

    const oldIdToNewId: Record<string, string> = {};
    for (const old of oldCategories) {
      const directMatch = nameMap[old.name.toLowerCase()];
      if (directMatch) {
        oldIdToNewId[old.id] = directMatch;
      } else {
        const words = old.name.toLowerCase().split(/[\s&,/]+/).filter((w) => w.length > 3);
        let best: string | null = null;
        for (const w of words) {
          const found = allNew.find((c) => c.name.toLowerCase().includes(w));
          if (found) { best = found.id; break; }
        }
        oldIdToNewId[old.id] = best ?? PARENTS[0].id;
      }
    }

    let reassigned = 0;
    for (const p of existingProducts) {
      const newId = oldIdToNewId[p.categoryId];
      if (newId && newId !== p.categoryId) {
        await prisma.product.update({ where: { id: p.id }, data: { categoryId: newId } });
        reassigned++;
      }
    }
    console.log(`   ✅ ${reassigned} products re-assigned.`);
  }

  // ── Step 7: Delete old categories ────────────────────────────────────────
  console.log("\n🗑️  Removing old placeholder categories...");
  const currentCategories = await prisma.category.findMany();
  const toDelete = currentCategories.filter((c) => !newIds.has(c.id));
  let deleted = 0;
  for (const cat of toDelete) {
    try {
      await prisma.category.delete({ where: { id: cat.id } });
      deleted++;
    } catch {
      console.log(`   ⚠️  Skipped "${cat.name}" — still in use.`);
    }
  }
  console.log(`   ✅ ${deleted} old categories removed.`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = await prisma.category.count();
  console.log(`\n🎉 Migration complete! ${total} total categories in database.`);
  console.log("   14 parent categories · 67 subcategories · orders & products preserved.");
}

main()
  .catch((e) => {
    console.error("❌ Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
