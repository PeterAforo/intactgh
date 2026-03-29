import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI not configured." }, { status: 503 });
  }

  let body: {
    productName: string;
    brand?: string;
    category?: string;
    features?: string;
    tone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { productName, brand, category, features, tone = "professional" } = body;
  if (!productName?.trim()) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }

  const toneInstructions: Record<string, string> = {
    professional: "formal and authoritative, suitable for business buyers",
    casual: "friendly and approachable, suitable for everyday consumers",
    technical: "detailed and spec-focused, aimed at tech-savvy customers",
    sales: "persuasive and benefit-focused, with a strong call to action",
  };

  const prompt = `You are an expert e-commerce copywriter for Intact Ghana, Ghana's leading electronics retailer. Write a compelling HTML product description.

Product Name: ${productName}
${brand ? `Brand: ${brand}` : ""}
${category ? `Category: ${category}` : ""}
${features ? `Key Features / Specs:\n${features}` : ""}
Tone: ${toneInstructions[tone] ?? toneInstructions.professional}

Requirements:
- Write in HTML using only: <p>, <ul>, <li>, <strong>, <br>
- Start with a 2-3 sentence engaging intro paragraph (<p>)
- Include a bullet list (<ul><li>...</li></ul>) of 4-6 key features/specs  
- End with a 1-sentence closing statement highlighting value
- Keep it between 120-200 words
- Do NOT include a title or the product name as a heading
- Do NOT use <h1>/<h2>/<h3> tags
- Output ONLY the HTML, nothing else`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
    }

    const data = await res.json();
    const description = data.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ description });
  } catch (err) {
    console.error("Description generation error:", err);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
