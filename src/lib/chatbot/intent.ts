import type { ChatIntent, ChatMode } from "./types";

interface PatternEntry {
  intent: ChatIntent;
  patterns: RegExp[];
}

const INTENT_PATTERNS: PatternEntry[] = [
  {
    intent: "product_comparison",
    patterns: [
      /\bcompare\b|\bvs\.?\b|\bversus\b/i,
      /difference between|which is better|better than|or the |between .+ and/i,
    ],
  },
  {
    intent: "budget_recommendation",
    patterns: [
      /under\s+[\d,]|below\s+[\d,]|within\s+[\d,]|less than\s+[\d,]/i,
      /budget|affordable|cheap(er)?|value for money|best deal/i,
      /\d[\d,]*\s*(cedis?|gh[₵c]|ghc)/i,
    ],
  },
  {
    intent: "product_recommendation",
    patterns: [
      /recommend|suggest|help me (choose|pick|find|decide)/i,
      /what (should|would you|is the best|are the best)/i,
      /which (one|laptop|phone|tv|printer|tablet|camera|speaker)/i,
      /best (laptop|phone|tablet|tv|camera|printer|speaker|headphone|ups)/i,
      /good (laptop|phone|tablet|tv|camera|printer)/i,
    ],
  },
  {
    intent: "accessory_recommendation",
    patterns: [
      /accessor(y|ies)|bag|case|mouse\b|keyboard|cable|charger|earbuds|headphones/i,
      /screen protector|power bank|cooling pad|laptop stand|webcam|tripod/i,
      /what (else|other|accessories) (do i|should i|can i)/i,
    ],
  },
  {
    intent: "deals_promotions",
    patterns: [
      /\bdeal(s)?\b|\bdiscount(s)?\b|\bsale\b|\bpromo\b|\boffer(s)?\b/i,
      /cheapest|best price|special|on sale|clearance|today.?s deal/i,
    ],
  },
  {
    intent: "order_tracking",
    patterns: [
      /track|order status|where is my (order|package|delivery)/i,
      /my order|order number|delivery status|when will/i,
    ],
  },
  {
    intent: "payment_guidance",
    patterns: [
      /payment|how (do i |can i |to )?pay|momo|mobile money/i,
      /visa|mastercard|card payment|installment|bnpl|canpay|cash on delivery|\bcod\b/i,
    ],
  },
  {
    intent: "return_policy",
    patterns: [
      /return|refund|exchange|warranty|guarantee/i,
      /broken|damaged|not working|faulty|defective/i,
    ],
  },
  {
    intent: "human_escalation",
    patterns: [
      /human|agent|live (person|agent|support|chat)/i,
      /speak to (someone|support|agent|staff)|talk to (a person|someone)/i,
      /frustrated|angry|terrible|useless|not helpful/i,
    ],
  },
  {
    intent: "checkout_guidance",
    patterns: [
      /checkout|buy now|purchase|place (an )?order|proceed to (buy|checkout)/i,
      /how (do i |to )?(buy|order|purchase|checkout)/i,
    ],
  },
  {
    intent: "category_browse",
    patterns: [
      /show (me )?(all |your )?(laptops|phones|tablets|tvs|cameras|printers)/i,
      /browse|what (laptops|phones|tablets|cameras|tvs) do you (have|sell|stock)/i,
      /list of (laptops|phones|products)|all (products|items)/i,
    ],
  },
  {
    intent: "product_search",
    patterns: [
      /find|looking for|search|do you (have|sell|stock)|show me\b/i,
      /i (want|need|am looking for) (a |an |the )?/i,
      /can i get|where (can i find|is the)/i,
    ],
  },
  {
    intent: "general_support",
    patterns: [
      /help|support|question|issue|problem|concern/i,
    ],
  },
];

export function classifyIntent(text: string): ChatIntent {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return intent;
  }
  return "none";
}

export function inferMode(intent: ChatIntent): ChatMode {
  switch (intent) {
    case "product_comparison":
      return "comparison";
    case "product_recommendation":
    case "budget_recommendation":
    case "accessory_recommendation":
    case "category_browse":
      return "recommendation";
    case "checkout_guidance":
      return "conversion";
    case "order_tracking":
    case "payment_guidance":
    case "return_policy":
    case "human_escalation":
    case "general_support":
      return "support";
    case "deals_promotions":
    case "product_search":
      return "browsing";
    default:
      return "browsing";
  }
}
