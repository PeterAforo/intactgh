# Intact AI Chatbot — Developer Guide

## Overview

The Intact AI chatbot is a fully AI-powered shopping assistant built on **OpenAI gpt-4o**, embedded on every page of the Intact Ghana e-commerce storefront.

### Enabled Capabilities
| Capability | Status |
|---|---|
| General FAQ (shipping, returns, payments, warranty) | ✅ Enabled |
| Lead capture (name → email → message → /api/lead-capture) | ✅ Enabled |
| Product search (triggers show_products action → /shop?q=...) | ✅ Enabled |
| Checkout & delivery assistance | ✅ Enabled |
| Order tracking guidance | ✅ Enabled |
| Newsletter subscription | ✅ Enabled |
| Page redirects (promotions, cart, account, etc.) | ✅ Enabled |
| Escalation to human support | ✅ Enabled |
| Booking / appointments | ❌ Not applicable |
| Event information | ❌ Not applicable |

---

## Setup

### 1. Install the dependency
No extra npm package is required — the API route uses native `fetch` to call OpenAI directly, keeping the bundle lean.

### 2. Set environment variables
Add these to your `.env` file:

```env
OPENAI_API_KEY="sk-your-key-here"
CHATBOT_NOTIFICATION_EMAIL="support@intactghana.com"
NEXT_PUBLIC_CHATBOT_ENABLED="true"
SITE_URL="https://intactghana.com"
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Restart the dev server
```bash
npm run dev
```

The chatbot widget will appear on every page (bottom-right corner).

---

## File Structure

```
src/
├── app/api/
│   ├── chat/route.ts           # OpenAI gpt-4o API route (server-side only)
│   └── lead-capture/route.ts  # Lead storage + notification email
├── components/chat/
│   ├── ChatBot.tsx             # Main floating widget (launcher + window)
│   ├── ChatMessage.tsx         # Individual message bubble with action rendering
│   ├── QuickReplies.tsx        # Horizontal chip buttons
│   └── TypingIndicator.tsx     # Animated three-dot indicator
├── hooks/
│   └── useChatbot.ts           # All chat state, flows, and API calls
└── lib/
    ├── chatbot-config.ts       # Identity, system prompt builder, capabilities
    └── chatbot-knowledge.ts    # FAQ knowledge base (27 entries from site content)
```

---

## Customization

### Change chatbot name or personality
Edit `src/lib/chatbot-config.ts`:
```ts
export const CHATBOT_CONFIG = {
  name: "Intact AI",           // ← change name here
  tagline: "Your Personal Shopping Assistant",
  escalationEmail: "support@intactghana.com",
  welcomeMessage: "Hi there! ...",
  quickReplies: [...],         // ← change initial quick reply chips
};
```

### Update the system prompt / personality
In `chatbot-config.ts`, edit the `buildSystemPrompt()` function. The tone, rules, and capabilities are all defined there.

---

## Adding a New Conversation Flow

1. **Add knowledge** — Open `src/lib/chatbot-knowledge.ts` and add new entries to the `knowledgeBase` array:
```ts
{
  id: "faq_xxx",
  question: "Your new question?",
  answer: "The answer with full detail.",
  tags: ["keyword1", "keyword2"],
  category: "general",
}
```

2. **Update the system prompt** — If the flow requires a new action (e.g. `book_demo`), add it to:
   - The `action` union type in `chatbot-config.ts`
   - The action payload instructions in `buildSystemPrompt()`
   - The `ActionButton` renderer in `ChatMessage.tsx`
   - The action handler in `useChatbot.ts`

3. **Test** — Open the chatbot and trigger the flow with a relevant query.

---

## Updating the Knowledge Base

Open `src/lib/chatbot-knowledge.ts`. Each entry follows this structure:
```ts
{
  id: "faq_XXX",           // unique ID
  question: "string",      // human-readable question
  answer: "string",        // full answer text
  tags: ["tag1", "tag2"],  // keywords for local search
  category: "orders | payment | returns | products | contact | account",
}
```

The entire knowledge base is injected verbatim into every OpenAI system prompt, so keep answers concise.

---

## API Route: `/api/chat`

- **Method:** POST
- **Auth:** None (public, rate-limited)
- **Rate limit:** 30 requests per IP per minute
- **Body:** `{ messages: [{ role: "user"|"assistant", content: string }] }`
- **Response:** `{ message, action, action_payload, quick_replies }`
- **Model:** gpt-4o, `max_tokens: 600`, `response_format: json_object`

The API key is **never** sent to the client. All OpenAI calls happen server-side.

## API Route: `/api/lead-capture`

- **Method:** POST
- **Body:** `{ name, email, message, source? }`
- **Behaviour:** Attempts to insert into `contact_submissions` DB table; falls back to `console.log` if table doesn't exist. Logs to `CHATBOT_NOTIFICATION_EMAIL` when set.

---

## Deployment Notes

- Set `OPENAI_API_KEY` in your production environment (Vercel, Railway, etc.)
- Set `NEXT_PUBLIC_CHATBOT_ENABLED="false"` to disable the widget without removing code
- The rate limiter uses an in-memory Map — it resets on server restart (fine for single-instance; use Redis for multi-instance)

---

## Cost Estimation (gpt-4o)

| Metric | Value |
|---|---|
| Model | gpt-4o |
| Avg tokens per message (in + out) | ~800 |
| Price per 1M input tokens | $2.50 |
| Price per 1M output tokens | $10.00 |
| Estimated cost per conversation (5 turns) | ~$0.006 |
| 1,000 conversations/month | ~$6/month |
| 10,000 conversations/month | ~$60/month |

Costs can be reduced by caching common FAQ responses or switching to `gpt-4o-mini` ($0.15/$0.60 per 1M tokens) for lower-complexity queries.
