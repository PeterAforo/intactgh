import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, type ChatbotResponse, type ProductPreview } from "@/lib/chatbot-config";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// In-memory rate limiter: max 30 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ilike(field: string, word: string): any {
  return { [field]: { contains: word, mode: "insensitive" } };
}

const STOP_WORDS = new Set([
  "a","an","the","and","or","in","on","at","to","i","is","it","with","for","of",
  "me","my","get","can","below","under","above","over","around","about","want",
  "need","looking","show","find","cedis","cedi","ghc","gh","please","some","any",
  "good","best","cheap","expensive","buy","have","you","do","price","priced",
]);

function parseKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(p: any): ProductPreview {
  return {
    id: p.id, name: p.name, price: p.price,
    comparePrice: p.comparePrice, slug: p.slug, stock: p.stock,
    image: p.images[0]?.url,
  };
}

const PRODUCT_SELECT = {
  id: true, name: true, price: true, comparePrice: true, slug: true, stock: true,
  images: { orderBy: { order: "asc" as const }, take: 1, select: { url: true } },
};
const PRODUCT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { featured: "desc" }, { createdAt: "desc" },
];

/**
 * Smart 3-tier product search:
 *  1. Category-first: match query to a category, return products IN that category
 *  2. Name + brand: search product name and brand name only (no description)
 *  3. Broad fallback: include tags and category name in search
 */
async function searchProducts(
  query: string,
  minPrice?: number,
  maxPrice?: number,
  categoryHint?: string,
  limit = 6
): Promise<ProductPreview[]> {
  const words = parseKeywords(query);
  if (words.length === 0 && !categoryHint) return [];

  const priceFilter: Prisma.FloatFilter = { gt: 0 };
  if (minPrice !== undefined) priceFilter.gte = minPrice;
  if (maxPrice !== undefined) priceFilter.lte = maxPrice;

  // ── Tier 1: Category-first search ──────────────────────────────────
  const catTerms = categoryHint ? [categoryHint, ...words] : words;
  let matchedCat: { id: string; children: { id: string }[] } | null = null;

  for (const term of catTerms) {
    if (term.length < 3) continue;
    matchedCat = await prisma.category.findFirst({
      where: { name: { contains: term, mode: "insensitive" } },
      select: { id: true, children: { select: { id: true } } },
    });
    if (matchedCat) break;
  }

  if (matchedCat) {
    const catIds = [matchedCat.id, ...matchedCat.children.map((c) => c.id)];

    // Also check if any word matches a brand
    let brandId: string | undefined;
    for (const w of words) {
      const brand = await prisma.brand.findFirst({
        where: { name: { contains: w, mode: "insensitive" } },
        select: { id: true },
      });
      if (brand) { brandId = brand.id; break; }
    }

    const catWhere: Prisma.ProductWhereInput = {
      status: "active",
      price: priceFilter,
      categoryId: { in: catIds },
    };
    if (brandId) catWhere.brandId = brandId;

    const catResults = await prisma.product.findMany({
      where: catWhere, select: PRODUCT_SELECT, orderBy: PRODUCT_ORDER, take: limit,
    });
    if (catResults.length > 0) return catResults.map(mapRow);
  }

  // ── Tier 2: Name + brand only (no description) ────────────────────
  const nameResults = await prisma.product.findMany({
    where: {
      status: "active",
      price: priceFilter,
      OR: words.flatMap((w) => [
        ilike("name", w),
        { brand: ilike("name", w) },
      ]) as Prisma.ProductWhereInput[],
    },
    select: PRODUCT_SELECT, orderBy: PRODUCT_ORDER, take: limit,
  });
  if (nameResults.length > 0) return nameResults.map(mapRow);

  // ── Tier 3: Broad fallback (tags + category name, still no description) ─
  const broadResults = await prisma.product.findMany({
    where: {
      status: "active",
      price: priceFilter,
      OR: words.flatMap((w) => [
        ilike("name", w),
        ilike("tags", w),
        { category: ilike("name", w) },
        { brand: ilike("name", w) },
      ]) as Prisma.ProductWhereInput[],
    },
    select: PRODUCT_SELECT, orderBy: PRODUCT_ORDER, take: limit,
  });
  return broadResults.map(mapRow);
}

function parsePriceFromText(text: string): { min?: number; max?: number } {
  const t = text.replace(/,/g, "");
  const range = t.match(/(\d+)\s*[-–to]+\s*(\d+)/);
  if (range) return { min: parseFloat(range[1]), max: parseFloat(range[2]) };
  // "under/below X" or "under/below GHC X"
  const under = t.match(/(?:under|below)\s+(?:gh[₵c]?|ghc)?\s*(\d+)/i);
  if (under) return { max: parseFloat(under[1]) };
  // "X cedis" / "GHC X" as a budget cap
  const cedis = t.match(/(?:gh[₵c]?|ghc)?\s*(\d{3,})\s*(?:cedis?|ghc)?/i);
  if (cedis && /below|under|budget|cheap|within|less/i.test(t))
    return { max: parseFloat(cedis[1]) };
  const above = t.match(/(?:above|over|from)\s+(?:gh[₵c]?|ghc)?\s*(\d+)/i);
  if (above) return { min: parseFloat(above[1]) };
  const budget = t.match(/budget\s+(?:of\s+)?(?:gh[₵c]?|ghc)?\s*(\d+)/i);
  if (budget) return { max: parseFloat(budget[1]) };
  return {};
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service not configured." },
      { status: 503 }
    );
  }

  let body: { messages: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  // Keep only the last 10 messages for context window efficiency
  const history = messages.slice(-10);

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...history,
        ],
        max_tokens: 600,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", openaiRes.status, errText);
      return NextResponse.json(
        { error: "AI service temporarily unavailable." },
        { status: 502 }
      );
    }

    const data = await openaiRes.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: ChatbotResponse;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        message: raw,
        action: "none",
        quick_replies: ["Browse products", "Contact us", "Track order"],
      };
    }

    // Ensure required fields exist
    if (!parsed.message) {
      parsed.message =
        "I'm here to help! What would you like to know about Intact Ghana?";
    }
    if (!parsed.action) parsed.action = "none";
    if (!parsed.quick_replies) parsed.quick_replies = [];

    // ── Server-side product search ────────────────────────────────────────────
    if (parsed.action === "show_products") {
      const query = parsed.action_payload?.query ?? "";
      const categoryHint = parsed.action_payload?.category;
      let minPrice = parsed.action_payload?.minPrice
        ? parseFloat(parsed.action_payload.minPrice)
        : undefined;
      let maxPrice = parsed.action_payload?.maxPrice
        ? parseFloat(parsed.action_payload.maxPrice)
        : undefined;

      // Fall back to parsing price range from the last user message
      if (minPrice === undefined && maxPrice === undefined) {
        const lastUser = history.filter((m) => m.role === "user").pop()?.content ?? "";
        const pp = parsePriceFromText(lastUser);
        minPrice = pp.min;
        maxPrice = pp.max;
      }

      const products = await searchProducts(query, minPrice, maxPrice, categoryHint);
      parsed.products = products;

      if (products.length === 0) {
        parsed.message = `I searched our store but couldn't find products matching "${query}"${minPrice || maxPrice ? " in that price range" : ""}. Try a broader search or browse our full shop.`;
        parsed.action = "none";
        parsed.quick_replies = ["Browse all products", "Try different search", "Contact us"];
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      {
        message:
          "Sorry, I'm having trouble connecting right now. Please try again or contact us at +233 543 645 126.",
        action: "none",
        quick_replies: ["Call us", "Send an email"],
      },
      { status: 200 }
    );
  }
}
