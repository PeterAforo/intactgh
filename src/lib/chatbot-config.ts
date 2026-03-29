// Re-export canonical types from the chatbot service layer for backward compat
export type { ProductPreview, ProductDetail, ChatApiResponse as ChatbotResponse } from "./chatbot/types";
export type { ProductPreview as ProductPreviewCompat } from "./chatbot/types";
export { DEFAULT_CHATBOT_SETTINGS } from "./chatbot/types";

// Static config used by the frontend widget (quick replies / welcome come from DB via API)
export const CHATBOT_CONFIG = {
  name: "Kwaku",
  tagline: "Your Personal Shopping Assistant",
  primaryColor: "#0052cc",
  accentColor: "#f97316",
  escalationEmail: "support@intactghana.com",
  escalationPhone: "+233 543 645 126",
  maxHistoryMessages: 12,
  welcomeMessage:
    "Hi there! 👋 I'm **Kwaku**, your personal shopping assistant for Intact Ghana. I can help you find products, compare options, track orders, and more. How can I help you today?",
  quickReplies: [
    "🔥 Best deals today",
    "💻 Laptops under GH₵3000",
    "📱 Latest smartphones",
    "🛒 Help me choose",
  ],
};
