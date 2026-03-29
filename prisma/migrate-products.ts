/**
 * Product Migration Script
 * Migrates ~1952 products from the legacy MySQL dump to Prisma/Postgres + Cloudinary.
 *
 * Steps:
 *  1. Parse products.sql
 *  2. Map mCatID → mcat-XX, catID → scat-XX (Prisma category IDs)
 *  3. Create/find Brand records
 *  4. Upload product images to Cloudinary
 *  5. Create Product + ProductImage records
 *
 * Run:  npx tsx prisma/migrate-products.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SQL_FILE = path.resolve(__dirname, "../../existing_sql/products.sql");
const IMAGE_DIR = path.resolve(__dirname, "../../existing_sql/products/products");
const UPLOAD_CONCURRENCY = 8;
const FALLBACK_CATEGORY = "mcat-13"; // Computer Accessories

// ═══════════════════════════ SQL Value Parser ═══════════════════════════════

function parseSqlValues(row: string): (string | number | null)[] {
  const out: (string | number | null)[] = [];
  let i = row.indexOf("(");
  if (i < 0) return out;
  i++; // skip '('

  while (i < row.length && row[i] !== ")") {
    while (i < row.length && row[i] === " ") i++;
    if (row[i] === ")") break;

    if (row.startsWith("NULL", i)) {
      out.push(null);
      i += 4;
    } else if (row[i] === "'") {
      i++; // skip opening quote
      let s = "";
      while (i < row.length) {
        if (row[i] === "\\" && i + 1 < row.length) {
          const next = row[i + 1];
          if (next === "'") { s += "'"; i += 2; }
          else if (next === "n") { s += "\n"; i += 2; }
          else if (next === "r") { s += "\r"; i += 2; }
          else if (next === "t") { s += "\t"; i += 2; }
          else if (next === "\\") { s += "\\"; i += 2; }
          else { s += (next || ""); i += 2; }
        } else if (row[i] === "'" && row[i + 1] === "'") {
          s += "'"; i += 2;
        } else if (row[i] === "'") {
          i++; break;
        } else {
          s += row[i]; i++;
        }
      }
      out.push(s);
    } else {
      let tok = "";
      while (i < row.length && row[i] !== "," && row[i] !== ")") { tok += row[i]; i++; }
      tok = tok.trim();
      const n = Number(tok);
      out.push(tok === "" ? null : isNaN(n) ? tok : n);
    }

    if (i < row.length && row[i] === ",") i++;
    while (i < row.length && row[i] === " ") i++;
  }
  return out;
}

// ═══════════════════════════ Image File Index ═══════════════════════════════

function buildImageIndex(dir: string): Map<string, string> {
  const idx = new Map<string, string>();
  let files: string[];
  try { files = fs.readdirSync(dir); } catch { return idx; }

  for (const f of files) {
    const full = path.join(dir, f);
    try { if (!fs.statSync(full).isFile()) continue; } catch { continue; }
    const low = f.toLowerCase();
    idx.set(low, full);
    const noExt = low.replace(/\.[^.]+$/, "");
    if (noExt !== low && !idx.has(noExt)) idx.set(noExt, full);
  }
  return idx;
}

function findImage(picName: string | null, idx: Map<string, string>): string | null {
  if (!picName || !picName.trim()) return null;
  const key = picName.trim().toLowerCase();

  // exact match
  if (idx.has(key)) return idx.get(key)!;

  // without extension
  const noExt = key.replace(/\.[^.]+$/, "");
  if (noExt !== key && idx.has(noExt)) return idx.get(noExt)!;

  // try appending common extensions
  for (const ext of [".jpg", ".jpeg", ".png", ".gif", ".webp"]) {
    if (idx.has(key + ext)) return idx.get(key + ext)!;
    if (noExt !== key && idx.has(noExt + ext)) return idx.get(noExt + ext)!;
  }

  // try with curly/smart quotes normalised
  const clean = key.replace(/['']/g, "'");
  if (clean !== key && idx.has(clean)) return idx.get(clean)!;

  return null;
}

// ═══════════════════════════ Cloudinary Upload ══════════════════════════════

async function uploadImage(filePath: string, publicId: string): Promise<string | null> {
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      folder: "intactgh/products",
      public_id: publicId,
      overwrite: false,
      resource_type: "image",
    });
    return res.secure_url;
  } catch (err: unknown) {
    const e = err as { http_code?: number; error?: { message?: string }; message?: string };
    // already exists → retrieve existing URL
    if (e.http_code === 409 || e.error?.message?.includes("already exists")) {
      try {
        const info = await cloudinary.api.resource(`intactgh/products/${publicId}`);
        return info.secure_url;
      } catch { /* fall through */ }
    }
    return null;
  }
}

// ═══════════════════════════ Concurrency Helper ════════════════════════════

async function parallel<T, R>(
  items: T[], concurrency: number, fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

// ═══════════════════════════ Helpers ════════════════════════════════════════

function toSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 200);
}

function brandDisplay(raw: string): string {
  if (raw.length <= 3) return raw.toUpperCase();
  return raw
    .split("-")
    .map((part) =>
      part.length <= 2
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("-");
}

// ═══════════════════════════ MAIN ══════════════════════════════════════════

interface Row {
  serial: number; catID: number | null; brand: string | null; code: string | null;
  name: string; url: string | null; qty: number; enable: string | null; isNew: string | null;
  sDesc: string | null; desc: string | null; price: number;
  picture: string | null; img1: string | null; img2: string | null; img3: string | null;
  img4: string | null; img5: string | null; mCatID: number | null;
  featured: string | null; promotion: string | null; promoPrice: number | null;
  tags: string | null;
}

interface Prepared {
  row: Row; slug: string; categoryId: string;
  imagePaths: { path: string; publicId: string }[];
}

async function main() {
  console.log("\n======================================================");
  console.log("  Product Migration: SQL -> Prisma + Cloudinary");
  console.log("======================================================\n");

  // ── 1. Parse products from SQL ──────────────────────────────────────────
  console.log("1) Parsing products.sql ...");
  const sql = fs.readFileSync(SQL_FILE, "utf-8");
  const rows = sql
    .split("\n")
    .filter((l) => l.trim().startsWith("("))
    .map((l) => parseSqlValues(l.trim()));

  const products: Row[] = rows
    .filter((v) => v.length >= 30 && v[7])
    .map((v) => ({
      serial:    v[0] as number,
      catID:     v[4] as number | null,
      brand:     v[5] as string | null,
      code:      v[6] as string | null,
      name:      v[7] as string,
      url:       v[8] as string | null,
      qty:       ((v[9] as number) || 0),
      enable:    v[10] as string | null,
      isNew:     v[11] as string | null,
      sDesc:     v[12] as string | null,
      desc:      v[13] as string | null,
      price:     ((v[14] as number) || 0),
      picture:   v[18] as string | null,
      img1:      v[19] as string | null,
      img2:      v[20] as string | null,
      img3:      v[21] as string | null,
      img4:      v[22] as string | null,
      img5:      v[23] as string | null,
      mCatID:    v[24] as number | null,
      featured:  v[25] as string | null,
      promotion: v[26] as string | null,
      promoPrice: v[27] as number | null,
      tags:      v[30] as string | null,
    }));
  console.log(`   ${products.length} products parsed\n`);

  // ── 2. Verify categories in DB ──────────────────────────────────────────
  console.log("2) Verifying categories ...");
  const dbCats = new Set(
    (await prisma.category.findMany({ select: { id: true } })).map((c) => c.id),
  );
  console.log(`   ${dbCats.size} categories in database\n`);

  // ── 3. Create / find brands ─────────────────────────────────────────────
  console.log("3) Syncing brands ...");
  const uniqueBrands = [
    ...new Set(products.map((p) => p.brand?.trim()).filter(Boolean)),
  ] as string[];
  const brandMap = new Map<string, string>();

  for (const raw of uniqueBrands) {
    const slug = toSlug(raw);
    if (!slug) continue;
    const display = brandDisplay(raw);
    let brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      try {
        brand = await prisma.brand.create({ data: { name: display, slug } });
      } catch {
        brand = await prisma.brand.findUnique({ where: { slug } });
      }
    }
    if (brand) brandMap.set(raw, brand.id);
  }
  console.log(`   ${brandMap.size} brands ready\n`);

  // ── 4. Clear existing products ──────────────────────────────────────────
  console.log("4) Clearing old product data ...");
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  console.log("   Done\n");

  // ── 5. Build image index ────────────────────────────────────────────────
  console.log("5) Indexing image files ...");
  const imgIdx = buildImageIndex(IMAGE_DIR);
  console.log(`   ${imgIdx.size} index entries\n`);

  // ── 6. Resolve slugs, categories, images ────────────────────────────────
  console.log("6) Preparing product data ...");
  const usedSlugs = new Set<string>();
  const prepared: Prepared[] = [];

  for (const row of products) {
    // Slug
    let slug = toSlug(row.url || row.name);
    if (!slug) slug = `product-${row.serial}`;
    let final = slug;
    let n = 1;
    while (usedSlugs.has(final)) final = `${slug}-${n++}`;
    usedSlugs.add(final);

    // Category: prefer subcategory, fall back to main, then fallback
    let catId: string | null = null;
    if (row.catID) {
      const sid = `scat-${row.catID}`;
      if (dbCats.has(sid)) catId = sid;
    }
    if (!catId && row.mCatID) {
      const mid = `mcat-${row.mCatID}`;
      if (dbCats.has(mid)) catId = mid;
    }
    if (!catId) catId = FALLBACK_CATEGORY;

    // Images
    const imagePaths: { path: string; publicId: string }[] = [];
    const mainImg = findImage(row.picture, imgIdx);
    if (mainImg) imagePaths.push({ path: mainImg, publicId: `prod-${row.serial}` });

    const extras = [row.img1, row.img2, row.img3, row.img4, row.img5];
    for (let ei = 0; ei < extras.length; ei++) {
      const ep = findImage(extras[ei], imgIdx);
      if (ep) imagePaths.push({ path: ep, publicId: `prod-${row.serial}-${ei + 1}` });
    }

    prepared.push({ row, slug: final, categoryId: catId, imagePaths });
  }

  const totalImages = prepared.reduce((s, p) => s + p.imagePaths.length, 0);
  const noImageCount = prepared.filter((p) => p.imagePaths.length === 0).length;
  console.log(
    `   ${prepared.length} products, ${totalImages} images found, ${noImageCount} without image\n`,
  );

  // ── 7. Upload images to Cloudinary ──────────────────────────────────────
  console.log("7) Uploading images to Cloudinary ...");
  const allImgTasks = prepared.flatMap((p) => p.imagePaths);
  const imgUrlMap = new Map<string, string>();
  let uploaded = 0;
  let uploadFailed = 0;

  await parallel(allImgTasks, UPLOAD_CONCURRENCY, async (task) => {
    const url = await uploadImage(task.path, task.publicId);
    if (url) {
      imgUrlMap.set(task.publicId, url);
      uploaded++;
    } else {
      uploadFailed++;
    }
    const done = uploaded + uploadFailed;
    if (done % 100 === 0 || done === allImgTasks.length) {
      console.log(`   ${done}/${allImgTasks.length} (${uploaded} ok, ${uploadFailed} failed)`);
    }
  });
  console.log(`   Upload complete: ${uploaded} ok, ${uploadFailed} failed\n`);

  // ── 8. Create products in database ──────────────────────────────────────
  console.log("8) Creating products in database ...");
  let created = 0;
  let skipped = 0;

  for (const p of prepared) {
    try {
      const { row, slug, categoryId, imagePaths } = p;

      const finalPrice =
        row.promotion === "Yes" && row.promoPrice ? row.promoPrice : row.price;
      const comparePrice =
        row.promotion === "Yes" && row.promoPrice && row.price > row.promoPrice
          ? row.price
          : undefined;

      const imageCreates = imagePaths
        .map((img, order) => {
          const url = imgUrlMap.get(img.publicId);
          return url ? { url, alt: row.name, order } : null;
        })
        .filter(Boolean) as { url: string; alt: string; order: number }[];

      await prisma.product.create({
        data: {
          name: row.name,
          slug,
          description: row.desc || row.sDesc || row.name,
          price: finalPrice,
          comparePrice,
          sku: row.code || undefined,
          stock: row.qty,
          categoryId,
          brandId: row.brand ? brandMap.get(row.brand) : undefined,
          featured: row.featured === "Yes",
          isNew: row.isNew === "Yes",
          onSale: row.promotion === "Yes",
          tags: row.tags || undefined,
          status: row.enable === "Yes" ? "active" : "draft",
          images: imageCreates.length > 0 ? { create: imageCreates } : undefined,
        },
      });
      created++;
    } catch (err: unknown) {
      skipped++;
      if (skipped <= 5) {
        const msg = err instanceof Error ? err.message.substring(0, 100) : String(err);
        console.log(`   Skip: ${p.row.name} -- ${msg}`);
      }
    }

    if ((created + skipped) % 200 === 0) {
      console.log(`   ${created + skipped}/${prepared.length} ...`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`  Migration Complete!`);
  console.log(`  Products created:  ${created}`);
  console.log(`  Products skipped:  ${skipped}`);
  console.log(`  Images uploaded:   ${uploaded}`);
  console.log(`  Images not found:  ${noImageCount}`);
  console.log(`======================================================\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
