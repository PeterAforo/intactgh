"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatbotResponse } from "@/lib/chatbot-config";
import { CHATBOT_CONFIG } from "@/lib/chatbot-config";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  action?: ChatbotResponse["action"];
  action_payload?: Record<string, string>;
  isError?: boolean;
}

export type LeadStep = "idle" | "name" | "email" | "message" | "done";

export interface LeadState {
  step: LeadStep;
  name: string;
  email: string;
  message: string;
}

const INITIAL_LEAD: LeadState = {
  step: "idle",
  name: "",
  email: "",
  message: "",
};

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: CHATBOT_CONFIG.welcomeMessage,
      timestamp: new Date(),
      quickReplies: CHATBOT_CONFIG.quickReplies,
      action: "none",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [leadState, setLeadState] = useState<LeadState>(INITIAL_LEAD);
  const [pendingNewsletterEmail, setPendingNewsletterEmail] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const full: ChatMessage = {
      ...msg,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, full]);
    return full;
  }, []);

  // Build OpenAI-compatible history from current messages
  const buildHistory = useCallback(
    (msgs: ChatMessage[]) =>
      msgs
        .filter((m) => !m.isError)
        .slice(-CHATBOT_CONFIG.maxHistoryMessages)
        .map((m) => ({ role: m.role, content: m.content })),
    []
  );

  const callChatAPI = useCallback(
    async (history: { role: string; content: string }[]): Promise<ChatbotResponse> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Request failed");
      }
      return res.json();
    },
    []
  );

  // ── Lead capture state machine ─────────────────────────────────────────────
  const handleLeadInput = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      // Echo user message
      addMessage({ role: "user", content: trimmed });

      if (leadState.step === "name") {
        setLeadState((prev) => ({ ...prev, name: trimmed, step: "email" }));
        addMessage({
          role: "assistant",
          content: `Nice to meet you, **${trimmed}**! 😊 What's your email address so we can get back to you?`,
          quickReplies: [],
        });
        return true;
      }

      if (leadState.step === "email") {
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
        if (!emailOk) {
          addMessage({
            role: "assistant",
            content: "That doesn't look like a valid email. Could you try again?",
            quickReplies: [],
          });
          return true;
        }
        setLeadState((prev) => ({ ...prev, email: trimmed, step: "message" }));
        addMessage({
          role: "assistant",
          content: "Got it! Finally, what would you like us to help you with?",
          quickReplies: [],
        });
        return true;
      }

      if (leadState.step === "message") {
        const finalLead = { ...leadState, message: trimmed };
        setLeadState({ ...finalLead, step: "done" });

        try {
          const res = await fetch("/api/lead-capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: finalLead.name,
              email: finalLead.email,
              message: trimmed,
              source: "chatbot",
            }),
          });
          const data = await res.json();
          addMessage({
            role: "assistant",
            content:
              data.message ??
              `Thanks **${finalLead.name}**! We'll get back to you within 24 hours. Is there anything else I can help with?`,
            quickReplies: ["Browse products", "View promotions", "Track order"],
          });
        } catch {
          addMessage({
            role: "assistant",
            content:
              "Your message was received! Our team will contact you soon. Is there anything else?",
            quickReplies: ["Browse products", "FAQ"],
          });
        }
        // Reset lead state after completion
        setTimeout(() => setLeadState(INITIAL_LEAD), 500);
        return true;
      }

      return false;
    },
    [leadState, addMessage]
  );

  // ── Newsletter ──────────────────────────────────────────────────────────────
  const handleNewsletterInput = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      addMessage({ role: "user", content: trimmed });
      setPendingNewsletterEmail(false);

      if (emailOk) {
        try {
          await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmed }),
          });
        } catch {
          // Best-effort
        }
        addMessage({
          role: "assistant",
          content: `🎉 You're subscribed! We'll keep **${trimmed}** in the loop with our best deals and new arrivals.`,
          quickReplies: ["Browse products", "View promotions", "Track order"],
        });
      } else {
        addMessage({
          role: "assistant",
          content: "That doesn't look like a valid email. Want to try again?",
          quickReplies: ["Try again", "Skip"],
        });
      }
    },
    [addMessage]
  );

  // ── Main send function ──────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Route to lead capture flow if active
      if (leadState.step !== "idle" && leadState.step !== "done") {
        await handleLeadInput(text);
        return;
      }

      // Route to newsletter flow if awaiting email
      if (pendingNewsletterEmail) {
        await handleNewsletterInput(text);
        return;
      }

      // Normal AI chat flow
      const userMsg = addMessage({ role: "user", content: text });
      setIsLoading(true);

      try {
        const history = buildHistory([...messages, userMsg]);
        const response = await callChatAPI(history);

        // Handle action side-effects
        if (response.action === "capture_lead") {
          setLeadState({ step: "name", name: "", email: "", message: "" });
          addMessage({
            role: "assistant",
            content:
              response.message ||
              "I'd love to connect you with our team! First, what's your name?",
            quickReplies: [],
            action: response.action,
            action_payload: response.action_payload,
          });
          return;
        }

        if (response.action === "subscribe_newsletter") {
          setPendingNewsletterEmail(true);
        }

        addMessage({
          role: "assistant",
          content: response.message,
          quickReplies: response.quick_replies ?? [],
          action: response.action,
          action_payload: response.action_payload,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        addMessage({
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. You can reach us at **+233 543 645 126** or **support@intactghana.com**.",
          isError: true,
          quickReplies: ["Try again", "View FAQ"],
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      leadState,
      pendingNewsletterEmail,
      messages,
      addMessage,
      buildHistory,
      callChatAPI,
      handleLeadInput,
      handleNewsletterInput,
    ]
  );

  const resetChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: CHATBOT_CONFIG.welcomeMessage,
        timestamp: new Date(),
        quickReplies: CHATBOT_CONFIG.quickReplies,
        action: "none",
      },
    ]);
    setLeadState(INITIAL_LEAD);
    setPendingNewsletterEmail(false);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    leadState,
    sendMessage,
    resetChat,
  };
}
