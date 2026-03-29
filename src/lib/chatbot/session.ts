import type { SessionContext, ChatApiResponse, ChatIntent, ChatMode } from "./types";

export function emptySession(): SessionContext {
  return {};
}

export function updateSession(
  current: SessionContext,
  userText: string,
  response: ChatApiResponse
): SessionContext {
  const updated: SessionContext = { ...current };

  // Extract budget constraints from user message
  const budget = extractBudget(userText);
  if (budget.min !== undefined || budget.max !== undefined) {
    updated.budget = {
      min: budget.min ?? current.budget?.min,
      max: budget.max ?? current.budget?.max,
    };
  }

  // Track last shown products
  if (response.products?.length) {
    updated.lastProductSlugs = response.products.slice(0, 6).map((p) => p.slug);
  }

  // Persist mode and intent from response
  if (response.intent) updated.intent = response.intent as ChatIntent;
  if (response.mode) updated.mode = response.mode as ChatMode;

  // Track preferred category
  if (response.action_payload?.category) {
    updated.preferredCategory = response.action_payload.category;
  }

  // Track preferred brand
  if (response.action_payload?.brand) {
    updated.preferredBrand = response.action_payload.brand;
  }

  return updated;
}

function extractBudget(text: string): { min?: number; max?: number } {
  const t = text.replace(/,/g, "");
  const range = t.match(/(\d+)\s*(?:[-–]|to)\s*(\d+)/);
  if (range) return { min: parseFloat(range[1]), max: parseFloat(range[2]) };
  const under = t.match(/(?:under|below|within|less\s+than|max|at\s+most)\s+(?:gh[₵c]?|ghc)?\s*(\d+)/i);
  if (under) return { max: parseFloat(under[1]) };
  const above = t.match(/(?:above|over|from|starting|at\s+least|minimum)\s+(?:gh[₵c]?|ghc)?\s*(\d+)/i);
  if (above) return { min: parseFloat(above[1]) };
  const budget = t.match(/budget\s+(?:of\s+)?(?:gh[₵c]?|ghc)?\s*(\d+)/i);
  if (budget) return { max: parseFloat(budget[1]) };
  // "3000 cedis" or "GHC 3000"
  const plain = t.match(/(?:gh[₵c]?|ghc)?\s*(\d{3,})\s*(?:cedis?|ghc)?/i);
  if (plain && /cheap|budget|under|below|max|affordable/i.test(t))
    return { max: parseFloat(plain[1]) };
  return {};
}

export function sessionToContext(session: SessionContext): string {
  const parts: string[] = [];
  if (session.budget?.max) parts.push(`Budget: up to GH₵${session.budget.max.toLocaleString()}`);
  if (session.budget?.min) parts.push(`Budget: from GH₵${session.budget.min.toLocaleString()}`);
  if (session.preferredCategory) parts.push(`Category interest: ${session.preferredCategory}`);
  if (session.preferredBrand) parts.push(`Brand preference: ${session.preferredBrand}`);
  if (session.useCase) parts.push(`Use case: ${session.useCase}`);
  if (session.lastProductSlugs?.length)
    parts.push(`Recently shown products: ${session.lastProductSlugs.join(", ")}`);
  if (session.mode) parts.push(`Current mode: ${session.mode}`);
  return parts.length ? parts.join(" | ") : "No session context yet";
}
