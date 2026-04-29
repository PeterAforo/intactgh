import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { buildSystemPrompt } from "@/lib/chatbot/prompt-builder";
import { classifyIntent } from "@/lib/chatbot/intent";
import { updateSession } from "@/lib/chatbot/session";
import { getAccessorySuggestions } from "@/lib/chatbot/cross-sell";
import type {
  ChatApiResponse,
  ProductDetail,
  ComparisonData,
  ComparisonRow,
  ChatbotSettings,
  SessionContext,
  AccessoryGroup,
} from "@/lib/chatbot/types";
import { DEFAULT_CHATBOT_SETTINGS } from "@/lib/chatbot/types";

// ── Rate Limiter ─────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ilike(field: string, word: string): any {
  return { [field]: { contains: word, mode: "insensitive" } };
}

const ACCESSORY_WORDS = [
  "charger", "adapter", "cable", "case", "cover", "bag", "sleeve",
  "stand", "dock", "hub", "mount", "holder", "pouch", "protector",
  "accessories", "spare", "power supply", "battery",
];

function isAccessoryCategory(name: string): boolean {
  const n = name.toLowerCase();
  return ACCESSORY_WORDS.some((w) => n.includes(w));
}

const STOP_WORDS = new Set([
  "a","an","the","and","or","in","on","at","to","i","is","it","with","for","of",
  "me","my","get","can","below","under","above","over","around","about","want",
  "need","looking","show","find","cedis","cedi","ghc","gh","please","some","any",
  "good","best","cheap","expensive","buy","have","you","do","price","priced","latest",
]);

function parseKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function parsePriceFromText(text: string): { min?: number; max?: number } {
  const t = text.replace(/,/g, "");
  const range = t.match(/(\d+)\s*(?:[-–]|to)\s*(\d+)/);
  if (range) return { min: parseFloat(range[1]), max: parseFloat(range[2]) };
  const under = t.match(/(?:under|below|within|less\s*than|at\s*most)\s+(?:gh[₵c]?|ghc)?\s*(\d+)/i);
  if (under) return { max: parseFloat(under[1]) };
  const cedis = t.match(/(?:gh[₵c]?|ghc)?\s*(\d{3,})\s*(?:cedis?|ghc)?/i);
  if (cedis && /below|under|budget|cheap|within|less/i.test(t))
    return { max: parseFloat(cedis[1]) };
  const above = t.match(/(?:above|over|from|starting)\s+(?:gh[₵c]?|ghc)?\s*(\d+)/i);
  if (above) return { min: parseFloat(above[1]) };
  const budget = t.match(/budget\s+(?:of\s+)?(?:gh[₵c]?|ghc)?\s*(\d+)/i);
  if (budget) return { max: parseFloat(budget[1]) };
  return {};
}

// ── Product Select Shape ──────────────────────────────────────────────────────
const PRODUCT_SELECT = {
  id: true, name: true, price: true, comparePrice: true, slug: true, stock: true,
  featured: true, onSale: true, isNew: true, rating: true, tags: true, specs: true,
  images: { orderBy: { order: "asc" as const }, take: 1, select: { url: true } },
  category: { select: { name: true } },
  brand: { select: { name: true } },
};

const PRODUCT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { featured: "desc" }, { createdAt: "desc" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProductRow(p: any): ProductDetail {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    comparePrice: p.comparePrice,
    slug: p.slug,
    stock: p.stock,
    image: p.images?.[0]?.url,
    category: p.category?.name,
    brand: p.brand?.name,
    tags: p.tags,
    specs: p.specs,
    rating: p.rating,
    onSale: p.onSale,
    isNew: p.isNew,
    featured: p.featured,
  };
}

// ── 3-Tier Smart Product Search ───────────────────────────────────────────────
async function searchProducts(
  query: string,
  minPrice?: number,
  maxPrice?: number,
  categoryHint?: string,
  brandHint?: string,
  limit = 6
): Promise<ProductDetail[]> {
  const words = parseKeywords(query);
  if (words.length === 0 && !categoryHint) return [];

  const priceFilter: Prisma.FloatFilter = { gt: 0 };
  if (minPrice !== undefined) priceFilter.gte = minPrice;
  if (maxPrice !== undefined) priceFilter.lte = maxPrice;

  // Tier 1: Find matching category → prefer exact/startsWith/non-accessory matches
  const catTerms = categoryHint ? [categoryHint, ...words] : words;
  let matchedCatIds: string[] = [];

  for (const term of catTerms) {
    if (term.length < 3) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidates = await prisma.category.findMany({
      where: { name: { contains: term, mode: "insensitive" as any } },
      select: { id: true, name: true, children: { select: { id: true } } },
      take: 20,
    }) as { id: string; name: string; children: { id: string }[] }[];

    if (!candidates.length) continue;

    // Sort: exact match → startsWith → non-accessory → accessory
    const scored = candidates
      .map((c) => ({
        c,
        score:
          (c.name.toLowerCase() === term.toLowerCase() ? 0 : c.name.toLowerCase().startsWith(term.toLowerCase()) ? 1 : 2) +
          (isAccessoryCategory(c.name) ? 10 : 0),
      }))
      .sort((a, b) => a.score - b.score);

    const best = scored[0]?.c;
    if (best) {
      matchedCatIds = [best.id, ...(best.children ?? []).map((c) => c.id)];
      break;
    }
  }

  // Find matching brand
  let brandId: string | undefined;
  const brandTerms = brandHint ? [brandHint, ...words] : words;
  for (const w of brandTerms) {
    if (w.length < 2) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const brand = await prisma.brand.findFirst({
      where: { name: { contains: w, mode: "insensitive" as any } },
      select: { id: true },
    });
    if (brand) { brandId = brand.id; break; }
  }

  if (matchedCatIds.length > 0) {
    const catWhere: Prisma.ProductWhereInput = {
      status: "active", price: priceFilter,
      categoryId: { in: matchedCatIds },
    };
    if (brandId) catWhere.brandId = brandId;
    const rows = await prisma.product.findMany({ where: catWhere, select: PRODUCT_SELECT, orderBy: PRODUCT_ORDER, take: limit });
    if (rows.length > 0) return rows.map(mapProductRow);
  }

  // Tier 2: Name + brand (no description)
  const nameRows = await prisma.product.findMany({
    where: {
      status: "active", price: priceFilter,
      OR: words.flatMap((w) => [
        ilike("name", w),
        { brand: ilike("name", w) },
      ]) as Prisma.ProductWhereInput[],
    },
    select: PRODUCT_SELECT, orderBy: PRODUCT_ORDER, take: limit,
  });
  if (nameRows.length > 0) return nameRows.map(mapProductRow);

  // Tier 3: Broad (tags + category name)
  const broadRows = await prisma.product.findMany({
    where: {
      status: "active", price: priceFilter,
      OR: words.flatMap((w) => [
        ilike("name", w), ilike("tags", w),
        { category: ilike("name", w) },
        { brand: ilike("name", w) },
      ]) as Prisma.ProductWhereInput[],
    },
    select: PRODUCT_SELECT, orderBy: PRODUCT_ORDER, take: limit,
  });
  return broadRows.map(mapProductRow);
}

// ── Comparison Engine ─────────────────────────────────────────────────────────
async function buildComparison(
  productAQuery: string,
  productBQuery: string,
  categoryHint?: string
): Promise<ComparisonData | null> {
  const [resultsA, resultsB] = await Promise.all([
    searchProducts(productAQuery, undefined, undefined, categoryHint, undefined, 1),
    searchProducts(productBQuery, undefined, undefined, categoryHint, undefined, 1),
  ]);

  const a = resultsA[0];
  const b = resultsB[0];
  if (!a || !b) return null;

  const rows: ComparisonRow[] = [];

  // Price comparison
  const priceWinner = a.price < b.price ? "a" : b.price < a.price ? "b" : "tie";
  rows.push({ aspect: "Price", valueA: `GH₵${a.price.toLocaleString()}`, valueB: `GH₵${b.price.toLocaleString()}`, winner: priceWinner });

  // Category
  if (a.category || b.category)
    rows.push({ aspect: "Category", valueA: a.category ?? "—", valueB: b.category ?? "—" });

  // Brand
  if (a.brand || b.brand)
    rows.push({ aspect: "Brand", valueA: a.brand ?? "—", valueB: b.brand ?? "—" });

  // Stock
  rows.push({
    aspect: "Availability",
    valueA: a.stock > 0 ? `In Stock (${a.stock})` : "Out of Stock",
    valueB: b.stock > 0 ? `In Stock (${b.stock})` : "Out of Stock",
    winner: a.stock > 0 && b.stock === 0 ? "a" : b.stock > 0 && a.stock === 0 ? "b" : "tie",
  });

  // Rating
  if ((a.rating ?? 0) > 0 || (b.rating ?? 0) > 0) {
    const rWinner = (a.rating ?? 0) > (b.rating ?? 0) ? "a" : (b.rating ?? 0) > (a.rating ?? 0) ? "b" : "tie";
    rows.push({ aspect: "Rating", valueA: a.rating ? `${a.rating}/5` : "—", valueB: b.rating ? `${b.rating}/5` : "—", winner: rWinner });
  }

  // Sale
  rows.push({
    aspect: "On Sale",
    valueA: a.onSale ? "✅ Yes" : "No",
    valueB: b.onSale ? "✅ Yes" : "No",
  });

  // Key specs from tags/specs fields (first 2 lines)
  const specsA = (a.specs ?? a.tags ?? "").split(/[,\n|;]/).slice(0, 2).join(" • ").trim();
  const specsB = (b.specs ?? b.tags ?? "").split(/[,\n|;]/).slice(0, 2).join(" • ").trim();
  if (specsA || specsB) rows.push({ aspect: "Key Specs", valueA: specsA || "—", valueB: specsB || "—" });

  const verdictA = a.price < b.price ? "Best for budget buyers" : a.rating && b.rating && a.rating > b.rating ? "Best-rated option" : "Best overall value";
  const verdictB = b.price < a.price ? "Best for budget buyers" : b.rating && a.rating && b.rating > a.rating ? "Best-rated option" : "Feature-rich choice";

  return { productA: a, productB: b, rows, verdictA, verdictB };
}

// ── Accessories Fetch ─────────────────────────────────────────────────────────
async function fetchAccessories(
  productName: string,
  categoryName?: string,
  limit = 3
): Promise<ProductDetail[]> {
  const suggestions = getAccessorySuggestions(productName, categoryName);
  if (!suggestions.length) return [];

  const results: ProductDetail[] = [];
  const seenIds = new Set<string>();

  for (const suggestion of suggestions) {
    if (results.length >= limit) break;
    const found = await searchProducts(suggestion.query, undefined, undefined, undefined, undefined, 1);
    if (found.length > 0 && !seenIds.has(found[0].id) && found[0].name !== productName) {
      seenIds.add(found[0].id);
      results.push(found[0]);
    }
  }
  return results;
}

// ── Admin Settings Loader ─────────────────────────────────────────────────────
let settingsCache: { data: ChatbotSettings; fetchedAt: number } | null = null;
const SETTINGS_TTL = 60_000; // 1 min cache

async function loadChatbotSettings(): Promise<ChatbotSettings> {
  if (settingsCache && Date.now() - settingsCache.fetchedAt < SETTINGS_TTL) {
    return settingsCache.data;
  }
  try {
    const rows = await prisma.siteSetting.findMany({
      where: {
        key: { in: [
          "chatbot_enabled", "chatbot_name", "chatbot_welcome", "chatbot_personality",
          "chatbot_quick_replies", "chatbot_fallback", "chatbot_escalation",
          "chatbot_max_recs", "chatbot_cross_sell", "chatbot_comparison", "chatbot_order_support",
        ] },
      },
    });
    const s: Record<string, string> = {};
    for (const r of rows) s[r.key] = r.value;

    const settings: ChatbotSettings = {
      enabled: s.chatbot_enabled !== "false",
      botName: s.chatbot_name || DEFAULT_CHATBOT_SETTINGS.botName,
      welcomeMessage: s.chatbot_welcome || DEFAULT_CHATBOT_SETTINGS.welcomeMessage,
      personality: s.chatbot_personality || DEFAULT_CHATBOT_SETTINGS.personality,
      quickReplies: s.chatbot_quick_replies
        ? (() => { try { return JSON.parse(s.chatbot_quick_replies); } catch { return DEFAULT_CHATBOT_SETTINGS.quickReplies; } })()
        : DEFAULT_CHATBOT_SETTINGS.quickReplies,
      fallbackMessage: s.chatbot_fallback || DEFAULT_CHATBOT_SETTINGS.fallbackMessage,
      escalationMessage: s.chatbot_escalation || DEFAULT_CHATBOT_SETTINGS.escalationMessage,
      maxRecommendations: s.chatbot_max_recs ? parseInt(s.chatbot_max_recs) : DEFAULT_CHATBOT_SETTINGS.maxRecommendations,
      enableRecommendations: s.chatbot_cross_sell !== "false",
      enableCrossSell: s.chatbot_cross_sell !== "false",
      enableComparison: s.chatbot_comparison !== "false",
      enableOrderSupport: s.chatbot_order_support !== "false",
    };
    settingsCache = { data: settings, fetchedAt: Date.now() };
    return settings;
  } catch {
    return DEFAULT_CHATBOT_SETTINGS;
  }
}

// ── Main POST Handler ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
  }

  let body: { messages: { role: string; content: string }[]; session?: SessionContext };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { messages, session: incomingSession } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  const history = messages.slice(-12);
  const lastUserMessage = history.filter((m) => m.role === "user").pop()?.content ?? "";

  // Client-side intent classification to enrich the session before calling OpenAI
  const clientIntent = classifyIntent(lastUserMessage);

  try {
    const settings = await loadChatbotSettings();

    if (!settings.enabled) {
      return NextResponse.json({
        message: settings.fallbackMessage,
        action: "none" as const,
        quick_replies: ["Browse shop", "Contact us"],
      });
    }

    // Build prompt with session context
    const systemPrompt = buildSystemPrompt(settings, incomingSession);

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, ...history],
        max_tokens: 700,
        temperature: 0.65,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error("OpenAI error:", openaiRes.status, errBody);

      // If gpt-4o fails (e.g. quota, access), retry with gpt-4o-mini
      if (openaiRes.status === 429 || openaiRes.status === 403 || openaiRes.status === 404) {
        console.log("Retrying with gpt-4o-mini fallback...");
        const fallbackRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, ...history],
            max_tokens: 700,
            temperature: 0.65,
            response_format: { type: "json_object" },
          }),
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const fbRaw = fbData.choices?.[0]?.message?.content ?? "{}";
          let fbParsed: Partial<ChatApiResponse>;
          try { fbParsed = JSON.parse(fbRaw); } catch { fbParsed = { message: fbRaw, action: "none" }; }
          if (!fbParsed.message) fbParsed.message = settings.fallbackMessage;
          return NextResponse.json({ ...fbParsed, action: fbParsed.action ?? "none", quick_replies: fbParsed.quick_replies ?? [] });
        }
      }

      return NextResponse.json(
        { error: `AI service error (${openaiRes.status}). Please try again.`, debug: process.env.NODE_ENV === "development" ? errBody : undefined },
        { status: 502 }
      );
    }

    const data = await openaiRes.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: Partial<ChatApiResponse>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: raw, action: "none", quick_replies: ["Browse products", "Contact us"] };
    }

    if (!parsed.message) parsed.message = settings.fallbackMessage;
    if (!parsed.action) parsed.action = "none";
    if (!parsed.quick_replies) parsed.quick_replies = [];

    // Use client intent as fallback if AI didn't provide one
    if (!parsed.intent && clientIntent !== "none") parsed.intent = clientIntent;

    const response: ChatApiResponse = {
      message: parsed.message,
      action: parsed.action,
      action_payload: parsed.action_payload,
      quick_replies: parsed.quick_replies,
      intent: parsed.intent,
      mode: parsed.mode,
    };

    // ── Show Products ──────────────────────────────────────────────────────────
    if (parsed.action === "show_products") {
      const query = parsed.action_payload?.query ?? "";
      const categoryHint = parsed.action_payload?.category;
      const brandHint = parsed.action_payload?.brand;

      let minPrice = parsed.action_payload?.minPrice ? parseFloat(parsed.action_payload.minPrice) : undefined;
      let maxPrice = parsed.action_payload?.maxPrice ? parseFloat(parsed.action_payload.maxPrice) : undefined;

      // Fall back to parsing from last user message or session
      if (minPrice === undefined && maxPrice === undefined) {
        const pp = parsePriceFromText(lastUserMessage);
        minPrice = pp.min ?? incomingSession?.budget?.min;
        maxPrice = pp.max ?? incomingSession?.budget?.max;
      }

      const limit = Math.min(settings.maxRecommendations, 6);
      const products = await searchProducts(query, minPrice, maxPrice, categoryHint, brandHint, limit);

      if (products.length === 0) {
        response.message = `I searched our store but couldn't find products matching "${query || categoryHint}"${maxPrice ? ` under GH₵${maxPrice.toLocaleString()}` : ""}. Try browsing our shop or contacting us.`;
        response.action = "none";
        response.quick_replies = ["Browse all products", "Try different search", "Contact us"];
      } else {
        response.products = products;

        // Cross-sell accessories if enabled
        if (settings.enableCrossSell && products.length > 0) {
          const firstProduct = products[0];
          const accessories = await fetchAccessories(firstProduct.name, firstProduct.category);
          if (accessories.length > 0) {
            const label = `Accessories for ${firstProduct.category ?? "this product"}`;
            response.accessories = { label, products: accessories } as AccessoryGroup;
          }
        }
      }
    }

    // ── Compare Products ───────────────────────────────────────────────────────
    if (parsed.action === "compare_products" && settings.enableComparison) {
      const productA = parsed.action_payload?.product_a ?? "";
      const productB = parsed.action_payload?.product_b ?? "";
      const catHint = parsed.action_payload?.category;

      if (productA && productB) {
        const comparison = await buildComparison(productA, productB, catHint);
        if (comparison) {
          response.comparison = comparison;
        } else {
          response.message = `I couldn't find both products to compare. Try being more specific with the product names.`;
          response.action = "none";
          response.quick_replies = ["Search laptops", "Search phones", "Browse shop"];
        }
      }
    }

    // ── Update Session ─────────────────────────────────────────────────────────
    const updatedSession = updateSession(incomingSession ?? {}, lastUserMessage, response);
    response.session = updatedSession;

    return NextResponse.json(response);

  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      {
        message: "Sorry, I'm having trouble connecting right now. Please try again or contact us at +233 543 645 126.",
        action: "none" as const,
        quick_replies: ["Call us", "Browse shop"],
      },
      { status: 200 }
    );
  }
}
