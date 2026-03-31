// Auto-populated from scanned site content: FAQ page, contact page, checkout page, policies
export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  category: string;
}

export const knowledgeBase: KnowledgeEntry[] = [
  // ── Orders & Shipping ──────────────────────────────────────────────────────
  {
    id: "faq_001",
    question: "How long does delivery take?",
    answer:
      "Within Greater Accra, delivery takes 1–3 business days. For other regions, delivery takes 3–7 business days depending on your location.",
    tags: ["delivery", "shipping", "time", "days"],
    category: "orders",
  },
  {
    id: "faq_002",
    question: "Is delivery free?",
    answer:
      "Yes! Free delivery on all orders above GH₵3,000. For orders below that amount, a flat fee of GH₵50 applies within Accra and GH₵100 for other regions.",
    tags: ["free delivery", "shipping cost", "GH₵3000"],
    category: "orders",
  },
  {
    id: "faq_003",
    question: "How can I track my order?",
    answer:
      "Once your order is shipped, you'll receive an SMS and email with a tracking number. You can also track your order from your account dashboard under My Account > Orders.",
    tags: ["track", "order status", "tracking number"],
    category: "orders",
  },
  {
    id: "faq_004",
    question: "Can I change or cancel my order?",
    answer:
      "You can modify or cancel your order within 2 hours of placing it. After that, please contact our customer service team for assistance.",
    tags: ["cancel", "change", "modify order"],
    category: "orders",
  },
  {
    id: "faq_005",
    question: "Do you deliver nationwide?",
    answer:
      "Yes, we deliver across Ghana. Accra deliveries take 1–3 days; other regions take 3–7 days. Delivery partners include Yango Delivery and Bolt Delivery for express same-day/next-day options.",
    tags: ["nationwide", "regions", "Accra", "Ghana delivery"],
    category: "orders",
  },
  // ── Payment ────────────────────────────────────────────────────────────────
  {
    id: "faq_010",
    question: "What payment methods do you accept?",
    answer:
      "We accept: Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money), Visa/Mastercard debit and credit cards via Hubtel, CanPay BNPL (Buy Now Pay Later), and Cash on Delivery (COD) for eligible orders.",
    tags: ["payment", "momo", "mobile money", "visa", "card", "cash"],
    category: "payment",
  },
  {
    id: "faq_011",
    question: "Is online payment secure?",
    answer:
      "Absolutely. All transactions are encrypted with 256-bit SSL. We use trusted payment processors (Hubtel & CanPay) and never store your card details on our servers.",
    tags: ["secure", "safe", "ssl", "encryption"],
    category: "payment",
  },
  {
    id: "faq_012",
    question: "Can I pay in installments?",
    answer:
      "Yes! We offer CanPay BNPL (Buy Now Pay Later) installment plans on selected products above GH₵2,000. Select CanPay at checkout to see available plans.",
    tags: ["installment", "bnpl", "canpay", "buy now pay later"],
    category: "payment",
  },
  {
    id: "faq_013",
    question: "What is Cash on Delivery?",
    answer:
      "Cash on Delivery (COD) lets you pay in cash when your order arrives. It's available for most locations within Ghana. Note: COD is not available when selecting Pickup.",
    tags: ["cod", "cash on delivery", "pay on delivery"],
    category: "payment",
  },
  // ── Returns & Refunds ──────────────────────────────────────────────────────
  {
    id: "faq_020",
    question: "What is your return policy?",
    answer:
      "We offer a 5-day return policy. Items must be in original packaging, unused, and in the same condition you received them. Products must be returned with all accessories and documentation.",
    tags: ["return", "policy", "5 days"],
    category: "returns",
  },
  {
    id: "faq_021",
    question: "How do I initiate a return?",
    answer:
      "Contact our customer service via phone (+233 543 645 126), email (support@intactghana.com), or the chat widget. We'll provide a return authorisation and instructions.",
    tags: ["return", "initiate", "how to return"],
    category: "returns",
  },
  {
    id: "faq_022",
    question: "How long do refunds take?",
    answer:
      "Refunds are processed within 3–5 business days after we receive and inspect the returned item. Mobile Money refunds are typically faster than card refunds.",
    tags: ["refund", "how long", "processing time"],
    category: "returns",
  },
  // ── Products & Warranty ───────────────────────────────────────────────────
  {
    id: "faq_030",
    question: "Are all products genuine?",
    answer:
      "100% genuine. We are authorised dealers for all brands we carry. Every product comes with the manufacturer's warranty and original packaging.",
    tags: ["genuine", "authentic", "original", "authorized"],
    category: "products",
  },
  {
    id: "faq_031",
    question: "What warranty do products come with?",
    answer:
      "All products carry the manufacturer's standard warranty, typically 1–2 years. Some products have extended warranty options available at checkout.",
    tags: ["warranty", "guarantee", "manufacturer warranty"],
    category: "products",
  },
  {
    id: "faq_032",
    question: "Do you offer product demonstrations?",
    answer:
      "Yes! Visit any of our showrooms for hands-on demonstrations. Our knowledgeable staff will help you find the perfect product. Locations: East Legon (A&C Mall, Accra), Adum (Kumasi), Market Circle (Takoradi).",
    tags: ["demo", "showroom", "try", "test"],
    category: "products",
  },
  // ── Store Info & Contact ──────────────────────────────────────────────────
  {
    id: "faq_040",
    question: "Where are your store locations?",
    answer:
      "We have 3 showrooms: (1) Accra Main – East Legon, A&C Mall; (2) Kumasi Branch – Adum; (3) Takoradi Branch – Market Circle. All stores are open Mon–Sat 9am–6pm.",
    tags: ["store", "location", "showroom", "address", "accra", "kumasi", "takoradi"],
    category: "contact",
  },
  {
    id: "faq_041",
    question: "How do I contact Intact Ghana?",
    answer:
      "Phone: +233 543 645 126. Email: support@intactghana.com or sales@intactghana.com. You can also use the chat widget or the Contact page on our website.",
    tags: ["contact", "phone", "email", "support"],
    category: "contact",
  },
  {
    id: "faq_042",
    question: "What are your opening hours?",
    answer:
      "Our stores are open Monday to Saturday, 9am – 6pm. Online orders and chat support are available 24/7.",
    tags: ["hours", "opening times", "open", "close"],
    category: "contact",
  },
  // ── Products & Pricing ────────────────────────────────────────────────────
  {
    id: "faq_050",
    question: "What product categories do you sell?",
    answer:
      "We stock: Smartphones, Laptops & Computers, Tablets, Smart TVs, Home Appliances (fridges, washing machines, ACs), Audio & Headphones, Cameras, Gaming, Smart Home devices, and Accessories.",
    tags: ["categories", "products", "what do you sell", "electronics"],
    category: "products",
  },
  {
    id: "faq_051",
    question: "Do you price-match?",
    answer:
      "Contact our sales team at sales@intactghana.com or +233 543 008 475 if you find a lower price for the same product at another authorised retailer. We'll do our best to match it.",
    tags: ["price match", "cheaper", "competitor price"],
    category: "products",
  },
  {
    id: "faq_052",
    question: "Do you have current promotions or deals?",
    answer:
      "Yes! Check our Promotions page for current deals. We run: Mega Electronics Sale (up to 30% off selected items), Free Delivery Week, and Bundle & Save offers. Orders above GH₵5,000 also get an automatic 5% discount.",
    tags: ["deals", "sale", "discount", "promotions", "offers"],
    category: "products",
  },
  // ── Account ────────────────────────────────────────────────────────────────
  {
    id: "faq_060",
    question: "How do I create an account?",
    answer:
      "Click the person icon in the top navigation bar, then click 'Create Account'. Enter your name, email, and password. You can also create an account during checkout.",
    tags: ["account", "register", "sign up", "create account"],
    category: "account",
  },
  {
    id: "faq_061",
    question: "I forgot my password, how do I reset it?",
    answer:
      "Go to My Account, click 'Forgot password?', enter your email address, and follow the reset link sent to your inbox.",
    tags: ["password", "forgot", "reset password"],
    category: "account",
  },
  // ── Checkout & Delivery ───────────────────────────────────────────────────
  {
    id: "faq_070",
    question: "What delivery options are available?",
    answer:
      "We offer: (1) Yango Delivery – express, 1–3 hours, distance-based pricing; (2) Bolt Delivery – express, 1–4 hours, distance-based pricing; (3) Standard Delivery – GH₵50 flat rate, 2–5 days (free over GH₵3,000); (4) Pickup from Store – free, same day.",
    tags: ["delivery options", "yango", "bolt", "standard", "pickup", "express"],
    category: "orders",
  },
  {
    id: "faq_071",
    question: "Can I pick up my order from a store?",
    answer:
      "Yes! Select 'Pickup from Store' at checkout. You can collect from East Legon (Accra), Adum (Kumasi), or Market Circle (Takoradi). Pickup is always FREE.",
    tags: ["pickup", "collect", "store pickup", "free pickup"],
    category: "orders",
  },
];

export function searchKnowledge(query: string): KnowledgeEntry[] {
  const q = query.toLowerCase();
  return knowledgeBase.filter(
    (entry) =>
      entry.question.toLowerCase().includes(q) ||
      entry.answer.toLowerCase().includes(q) ||
      entry.tags.some((tag) => q.includes(tag) || tag.includes(q))
  );
}
