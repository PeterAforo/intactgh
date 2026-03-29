// Central type definitions for the Intact Ghana AI Shopping Assistant

export type ChatIntent =
  | "product_search"
  | "product_recommendation"
  | "product_comparison"
  | "budget_recommendation"
  | "category_browse"
  | "deals_promotions"
  | "accessory_recommendation"
  | "order_tracking"
  | "payment_guidance"
  | "return_policy"
  | "human_escalation"
  | "checkout_guidance"
  | "general_support"
  | "none";

export type ChatMode =
  | "browsing"
  | "recommendation"
  | "comparison"
  | "conversion"
  | "support";

export type ChatAction =
  | "none"
  | "show_products"
  | "compare_products"
  | "capture_lead"
  | "redirect"
  | "track_order"
  | "subscribe_newsletter"
  | "checkout_prompt";

// ── Session Memory ────────────────────────────────────────────────────────────
// Passed client→server in every request, returned server→client in every response.
// No server-side storage needed.
export interface SessionContext {
  budget?: { min?: number; max?: number };
  preferredCategory?: string;
  preferredBrand?: string;
  useCase?: string;
  lastProductSlugs?: string[];
  mode?: ChatMode;
  intent?: ChatIntent;
}

// ── Product Data ──────────────────────────────────────────────────────────────
export interface ProductPreview {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  image?: string;
}

export interface ProductDetail extends ProductPreview {
  category?: string;
  brand?: string;
  tags?: string;
  specs?: string;
  rating?: number;
  onSale?: boolean;
  isNew?: boolean;
  featured?: boolean;
}

// ── Comparison ────────────────────────────────────────────────────────────────
export interface ComparisonRow {
  aspect: string;
  valueA: string;
  valueB: string;
  winner?: "a" | "b" | "tie";
}

export interface ComparisonData {
  productA: ProductDetail;
  productB: ProductDetail;
  rows: ComparisonRow[];
  verdictA: string; // "Best for budget buyers"
  verdictB: string; // "Best for power users"
}

// ── Accessories ───────────────────────────────────────────────────────────────
export interface AccessoryGroup {
  label: string; // "Recommended Accessories"
  products: ProductPreview[];
}

// ── API Contracts ─────────────────────────────────────────────────────────────
export interface ChatApiRequest {
  messages: { role: string; content: string }[];
  session?: SessionContext;
}

export interface ChatApiResponse {
  message: string;
  action: ChatAction;
  action_payload?: Record<string, string>;
  quick_replies?: string[];
  products?: ProductDetail[];
  comparison?: ComparisonData;
  accessories?: AccessoryGroup;
  intent?: ChatIntent;
  mode?: ChatMode;
  session?: SessionContext;
}

// ── Admin-Controlled Settings ─────────────────────────────────────────────────
export interface ChatbotSettings {
  enabled: boolean;
  botName: string;
  welcomeMessage: string;
  personality: string;
  quickReplies: string[];
  fallbackMessage: string;
  escalationMessage: string;
  maxRecommendations: number;
  enableRecommendations: boolean;
  enableCrossSell: boolean;
  enableComparison: boolean;
  enableOrderSupport: boolean;
}

export const DEFAULT_CHATBOT_SETTINGS: ChatbotSettings = {
  enabled: true,
  botName: "Kwaku",
  welcomeMessage:
    "Hi there! 👋 I'm **Kwaku**, your personal shopping assistant for Intact Ghana. I can help you find products, compare options, track orders, and more. How can I help you today?",
  personality:
    "Friendly, helpful, and knowledgeable about electronics. Stays focused on Intact Ghana products. Uses simple language and asks clarifying questions before recommending.",
  quickReplies: [
    "🔥 Best deals today",
    "💻 Laptops under GH₵3000",
    "📱 Latest smartphones",
    "🛒 Help me choose",
  ],
  fallbackMessage:
    "I'm not sure I can help with that. You can browse our shop, or contact us at +233 543 645 126.",
  escalationMessage:
    "I'll connect you with our support team. Call **+233 543 645 126** or email **support@intactghana.com** — Mon–Sat, 9am–6pm.",
  maxRecommendations: 4,
  enableRecommendations: true,
  enableCrossSell: true,
  enableComparison: true,
  enableOrderSupport: true,
};
