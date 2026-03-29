/**
 * Image Repair Script
 * Finds products that are missing images and re-uploads them to Cloudinary.
 * Safe to run multiple times - only processes products without images.
 *
 * Run:  npx tsx prisma/repair-images.ts
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
const UPLOAD_CONCURRENCY = 5; // lower concurrency to avoid rate limits
const DELAY_BETWEEN_BATCHES_MS = 2000;

// ─── SQL parser (same as migrate-products.ts) ───────────────────────────────

function parseSqlValues(row: string): (string | number | null)[] {
  const out: (string | number | null)[] = [];
  let i = row.indexOf("(");
  if (i < 0) return out;
  i++;
  while (i < row.length && row[i] !== ")") {
    while (i < row.length && row[i] === " ") i++;
    if (row[i] === ")") break;
    if (row.startsWith("NULL", i)) {
      out.push(null); i += 4;
    } else if (row[i] === "'") {
      i++;
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
        } else if (row[i] === "'") { i++; break; }
        else { s += row[i]; i++; }
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

// ─── Image index ────────────────────────────────────────────────────────────

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
  if (idx.has(key)) return idx.get(key)!;
  const noExt = key.replace(/\.[^.]+$/, "");
  if (noExt !== key && idx.has(noExt)) return idx.get(noExt)!;
  for (const ext of [".jpg", ".jpeg", ".png", ".gif", ".webp"]) {
    if (idx.has(key + ext)) return idx.get(key + ext)!;
    if (noExt !== key && idx.has(noExt + ext)) return idx.get(noExt + ext)!;
  }
  const clean = key.replace(/['']/g, "'");
  if (clean !== key && idx.has(clean)) return idx.get(clean)!;
  return null;
}

// ─── Cloudinary upload with retry ───────────────────────────────────────────

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function uploadWithRetry(filePath: string, publicId: string, retries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await cloudinary.uploader.upload(filePath, {
        folder: "intactgh/products",
        public_id: publicId,
        overwrite: false,
        resource_type: "image",
      });
      return res.secure_url;
    } catch (err: unknown) {
      const e = err as { http_code?: number; error?: { message?: string } };
      if (e.http_code === 409 || e.error?.message?.includes("already exists")) {
        try {
          const info = await cloudinary.api.resource(`intactgh/products/${publicId}`);
          return info.secure_url;
        } catch { /* fall through */ }
      }
      if (attempt < retries) {
        const wait = attempt * 3000; // backoff: 3s, 6s, 9s
        await sleep(wait);
      }
    }
  }
  return null;
}

// ─── Slug helper ────────────────────────────────────────────────────────────

function toSlug(raw: string): string {
  return raw.toLowerCase().replace(/&amp;/g, "and").replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 200);
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n======================================================");
  console.log("  Image Repair: re-upload missing product images");
  console.log("======================================================\n");

  // 1. Find products WITHOUT images
  console.log("1) Finding products without images ...");
  const productsWithoutImages = await prisma.product.findMany({
    where: { images: { none: {} } },
    select: { id: true, slug: true, name: true },
  });
  console.log(`   ${productsWithoutImages.length} products need images\n`);

  if (productsWithoutImages.length === 0) {
    console.log("   Nothing to do!\n");
    return;
  }

  // 2. Parse SQL to get image filenames by slug
  console.log("2) Parsing products.sql for image filenames ...");
  const sql = fs.readFileSync(SQL_FILE, "utf-8");
  const rows = sql.split("\n").filter(l => l.trim().startsWith("(")).map(l => parseSqlValues(l.trim()));

  // Build slug → { serial, picture, extras } map
  const sqlMap = new Map<string, { serial: number; picture: string | null; extras: (string | null)[] }>();
  for (const v of rows) {
    if (v.length < 30 || !v[7]) continue;
    const rawSlug = toSlug((v[8] as string) || (v[7] as string));
    sqlMap.set(rawSlug, {
      serial: v[0] as number,
      picture: v[18] as string | null,
      extras: [v[19] as string | null, v[20] as string | null, v[21] as string | null, v[22] as string | null, v[23] as string | null],
    });
  }
  console.log(`   ${sqlMap.size} SQL rows indexed\n`);

  // 3. Build image file index
  console.log("3) Indexing image files ...");
  const imgIdx = buildImageIndex(IMAGE_DIR);
  console.log(`   ${imgIdx.size} entries\n`);

  // 4. Match and upload
  console.log("4) Uploading missing images ...");
  let uploaded = 0;
  let notFound = 0;
  let failed = 0;
  let batchCount = 0;

  for (const product of productsWithoutImages) {
    // Find matching SQL row (try exact slug first, then strip trailing numbers)
    let sqlRow = sqlMap.get(product.slug);
    if (!sqlRow) {
      // Try slug without trailing dedup suffix (e.g., "some-product-1" → "some-product")
      const base = product.slug.replace(/-\d+$/, "");
      sqlRow = sqlMap.get(base);
    }

    if (!sqlRow) {
      notFound++;
      continue;
    }

    // Find image files
    const imagePaths: { path: string; publicId: string }[] = [];
    const mainImg = findImage(sqlRow.picture, imgIdx);
    if (mainImg) imagePaths.push({ path: mainImg, publicId: `prod-${sqlRow.serial}` });

    for (let i = 0; i < sqlRow.extras.length; i++) {
      const ep = findImage(sqlRow.extras[i], imgIdx);
      if (ep) imagePaths.push({ path: ep, publicId: `prod-${sqlRow.serial}-${i + 1}` });
    }

    if (imagePaths.length === 0) {
      notFound++;
      continue;
    }

    // Upload and create ProductImage records
    for (let idx = 0; idx < imagePaths.length; idx++) {
      const { path: imgPath, publicId } = imagePaths[idx];
      const url = await uploadWithRetry(imgPath, publicId);
      if (url) {
        await prisma.productImage.create({
          data: {
            url,
            alt: product.name,
            order: idx,
            productId: product.id,
          },
        });
        uploaded++;
      } else {
        failed++;
      }

      batchCount++;
      // Throttle: pause every 50 uploads to avoid rate limits
      if (batchCount % 50 === 0) {
        console.log(`   ${uploaded} uploaded, ${failed} failed, ${notFound} not found ... (pausing)`);
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`  Repair Complete!`);
  console.log(`  Images uploaded:    ${uploaded}`);
  console.log(`  Upload failures:    ${failed}`);
  console.log(`  No image found:     ${notFound}`);
  console.log(`  Total processed:    ${productsWithoutImages.length}`);
  console.log(`======================================================\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
