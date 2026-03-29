import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, type ChatbotResponse } from "@/lib/chatbot-config";

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
