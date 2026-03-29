# Intact AI Chatbot — Testing Checklist

## Pre-Launch Testing

### Setup
- [ ] `OPENAI_API_KEY` is set in `.env` (replace the placeholder value)
- [ ] `NEXT_PUBLIC_CHATBOT_ENABLED="true"` is set in `.env`
- [ ] Dev server is running (`npm run dev`)

---

### Core Functionality
- [ ] Chatbot widget loads on all pages without breaking layout
- [ ] Greeting tooltip ("👋 Hi! Need help...") appears on first load with unread badge
- [ ] Clicking the launcher button opens the chat window
- [ ] Welcome message and quick reply chips appear on first open
- [ ] OpenAI API call succeeds and returns a response (check Network tab)
- [ ] **API key is NOT visible in browser network requests** — only `/api/chat` should appear
- [ ] Typing indicator (animated dots) shows while waiting for response
- [ ] Messages auto-scroll to the latest on new messages
- [ ] Scroll-to-bottom button appears when user scrolls up
- [ ] Reset button (↺) clears chat and shows welcome message again
- [ ] Escape key closes the chat window
- [ ] Close (×) button closes the window

---

### Conversation Flows

#### FAQ Flow
- [ ] Ask "What is your return policy?" → receives accurate 5-day return answer
- [ ] Ask "How long does delivery take?" → receives Accra 1-3 days / nationwide 3-7 days
- [ ] Ask "What payment methods do you accept?" → lists MoMo, Hubtel, CanPay, COD
- [ ] Ask "Do you have free delivery?" → mentions GH₵3,000 threshold
- [ ] Ask an unknown question → offers to escalate / connect with team

#### Product Search Flow
- [ ] Ask "Show me smartphones" → action `show_products` triggers, button linking to `/shop?q=smartphones` appears
- [ ] Ask "I want to buy a laptop" → show_products action for laptops
- [ ] Click the "View products" button → navigates to correct shop URL

#### Lead Capture Flow
- [ ] Say "I want to contact someone" → bot asks for name
- [ ] Enter name → bot asks for email
- [ ] Enter invalid email → bot asks to try again
- [ ] Enter valid email → bot asks for message
- [ ] Enter message → POST to `/api/lead-capture` succeeds (check Network tab)
- [ ] Confirmation message appears with user's name

#### Order Tracking Flow
- [ ] Ask "How do I track my order?" → receives account dashboard instructions
- [ ] Response includes quick replies for follow-up options

#### Redirect Flow
- [ ] Ask "Show me promotions" → redirect action appears with "Open page" button
- [ ] Click button → navigates to `/promotions`

#### Newsletter Flow
- [ ] Ask "Can I subscribe to your newsletter?" → bot asks for email
- [ ] Enter email → POST to `/api/newsletter` fires (best-effort)
- [ ] Confirmation message appears

#### Escalation Flow
- [ ] Type "I'm frustrated" or "This is broken" → bot acknowledges and offers to connect team
- [ ] Say "I need help" repeatedly → escalation triggered

---

### Error Handling
- [ ] Temporarily remove `OPENAI_API_KEY` → graceful error message shown (not a crash)
- [ ] Simulate network failure → fallback message with phone number appears
- [ ] Send 31 requests in 1 minute → 429 rate limit response received

---

### Mobile & Accessibility
- [ ] Chat window is full-width and usable on mobile (320px viewport)
- [ ] Input field does not trigger iOS zoom (font-size ≥ 16px)
- [ ] All buttons have `aria-label` attributes
- [ ] Chat window has `role="dialog"` and `aria-modal="true"`
- [ ] Message feed has `aria-live="polite"` for screen readers
- [ ] Tab key navigates through: launcher → input → send button
- [ ] Quick reply buttons are keyboard-accessible

---

### Visual & Theme
- [ ] Chatbot colours match brand: primary `#0052cc` blue
- [ ] Font matches site Inter font
- [ ] No layout shift when chatbot opens
- [ ] Chatbot does not overlap important site content (z-index 50)
- [ ] Gradient header matches Intact Ghana brand style

---

### Chat History
- [ ] Messages persist within the same browser session (state in React)
- [ ] Refreshing the page resets the conversation (no localStorage persistence — by design)
- [ ] Reset button clears all messages and restores welcome message

---

## Manual Test Script

Open browser console and paste:
```js
// Verify chatbot API is reachable
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
}).then(r => r.json()).then(console.log);
```

Expected response shape:
```json
{
  "message": "...",
  "action": "none",
  "action_payload": {},
  "quick_replies": ["Browse products", "Track order", "..."]
}
```
