"use client";

// Lightweight client-side analytics for chatbot events.
// Fires custom browser events that can be picked up by any analytics provider
// (GA4, Mixpanel, etc.) or simply logged. Zero external dependencies.

export type ChatAnalyticsEvent =
  | "chat_opened"
  | "chat_closed"
  | "quick_reply_clicked"
  | "product_recommended"
  | "product_card_clicked"
  | "comparison_requested"
  | "comparison_shown"
  | "accessory_shown"
  | "add_to_cart_clicked"
  | "checkout_cta_clicked"
  | "view_product_clicked"
  | "escalation_triggered"
  | "lead_captured"
  | "message_sent";

interface EventPayload {
  event: ChatAnalyticsEvent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
}

function fireEvent(payload: EventPayload) {
  if (typeof window === "undefined") return;

  // Dispatch as a custom DOM event so any listener can pick it up
  window.dispatchEvent(
    new CustomEvent("kwaku_analytics", { detail: payload })
  );

  // Also push to dataLayer if Google Tag Manager is present
  if ("dataLayer" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).dataLayer.push({ event: payload.event, ...payload.data });
  }
}

export const chatAnalytics = {
  chatOpened: () => fireEvent({ event: "chat_opened" }),
  chatClosed: () => fireEvent({ event: "chat_closed" }),

  quickReplyClicked: (reply: string) =>
    fireEvent({ event: "quick_reply_clicked", data: { reply } }),

  productRecommended: (products: { id: string; name: string }[]) =>
    fireEvent({ event: "product_recommended", data: { count: products.length, products } }),

  productCardClicked: (productId: string, productName: string) =>
    fireEvent({ event: "product_card_clicked", data: { productId, productName } }),

  comparisonRequested: (productA: string, productB: string) =>
    fireEvent({ event: "comparison_requested", data: { productA, productB } }),

  comparisonShown: () => fireEvent({ event: "comparison_shown" }),

  accessoryShown: (label: string, count: number) =>
    fireEvent({ event: "accessory_shown", data: { label, count } }),

  addToCartClicked: (productId: string, productName: string, price: number) =>
    fireEvent({ event: "add_to_cart_clicked", data: { productId, productName, price } }),

  checkoutCtaClicked: () => fireEvent({ event: "checkout_cta_clicked" }),

  viewProductClicked: (productId: string, productName: string) =>
    fireEvent({ event: "view_product_clicked", data: { productId, productName } }),

  escalationTriggered: () => fireEvent({ event: "escalation_triggered" }),

  leadCaptured: () => fireEvent({ event: "lead_captured" }),

  messageSent: (intent: string) =>
    fireEvent({ event: "message_sent", data: { intent } }),
};
