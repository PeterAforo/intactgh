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

async function searchProducts(
  query: string,
  minPrice?: number,
  maxPrice?: number,
  limit = 6
): Promise<ProductPreview[]> {
  const where: Prisma.ProductWhereInput = { status: "active" };

  if (query) {
    where.OR = [
      { name: { contains: query } },
      { description: { contains: query } },
      { tags: { contains: query } },
      { category: { name: { contains: query } } },
      { brand: { name: { contains: query } } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) (where.price as Prisma.FloatFilter).gte = minPrice;
    if (maxPrice !== undefined) (where.price as Prisma.FloatFilter).lte = maxPrice;
  }

  const rows = await prisma.product.findMany({
    where,
    select: {
      id: true, name: true, price: true, comparePrice: true, slug: true, stock: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return rows.map((p) => ({
    id: p.id, name: p.name, price: p.price,
    comparePrice: p.comparePrice, slug: p.slug, stock: p.stock,
    image: p.images[0]?.url,
  }));
}

function parsePriceFromText(text: string): { min?: number; max?: number } {
  const t = text.replace(/,/g, "");
  const range = t.match(/(\d+)\s*[-–to]+\s*(\d+)/);
  if (range) return { min: parseFloat(range[1]), max: parseFloat(range[2]) };
  const under = t.match(/under\s+(?:gh[₵c]?|ghc)?\s*(\d+)/i);
  if (under) return { max: parseFloat(under[1]) };
  const above = t.match(/(?:above|over)\s+(?:gh[₵c]?|ghc)?\s*(\d+)/i);
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

      const products = await searchProducts(query, minPrice, maxPrice);
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
