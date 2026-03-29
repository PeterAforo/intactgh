"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatbot } from "@/hooks/useChatbot";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import { CHATBOT_CONFIG } from "@/lib/chatbot-config";
import type { ProductDetail } from "@/lib/chatbot/types";
import { chatAnalytics } from "@/lib/chatbot/analytics";
import { useCartStore } from "@/store/cart-store";

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    [[880, 0], [1100, 0.12], [1320, 0.24]].forEach(([freq, when]) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + 0.3);
    });
    setTimeout(() => ctx.close(), 800);
  } catch { /* ignore */ }
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showBadge, setShowBadge] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [idlePopup, setIdlePopup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleShownRef = useRef(false);
  const { messages, isLoading, sendMessage, resetChat, confirmAddToCart } = useChatbot();
  const { addItem, getItemCount } = useCartStore();

  const handleAddToCart = (product: ProductDetail) => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image ?? "",
      stock: product.stock,
    });
    confirmAddToCart(product.name, getItemCount() + 1);
    chatAnalytics.addToCartClicked(product.id, product.name, product.price);
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Show scroll-to-bottom button when user scrolls up
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  };

  // Focus input when chat opens; dismiss idle popup on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      setShowBadge(false);
      setIdlePopup(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }
  }, [isOpen]);

  // Idle popup: fires after 5s of no user activity while chat is closed
  useEffect(() => {
    const resetTimer = () => {
      if (isOpen) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (!isOpen && !idleShownRef.current) {
          idleShownRef.current = true;
          setIdlePopup(true);
          playNotificationSound();
        }
      }, 5000);
    };

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen]);

  // Keyboard: close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleToggleChat = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) chatAnalytics.chatOpened();
    else chatAnalytics.chatClosed();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    chatAnalytics.messageSent("user_message");
    sendMessage(input.trim());
    setInput("");
  };

  const handleQuickReply = (reply: string) => {
    if (isLoading) return;
    sendMessage(reply);
  };

  const enabled = process.env.NEXT_PUBLIC_CHATBOT_ENABLED !== "false";
  if (!enabled) return null;

  return (
    <>
      {/* ── Floating Launcher Button ─────────────────────────────────────── */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      >
        {/* Greeting tooltip (initial) */}
        <AnimatePresence>
          {showBadge && !isOpen && !idlePopup && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              className="relative bg-white border border-gray-200 shadow-lg rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-gray-700 max-w-[220px] cursor-pointer"
              onClick={() => setIsOpen(true)}
            >
              👋 Hi! Need help finding something?
              <span className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle popup */}
        <AnimatePresence>
          {idlePopup && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.88 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              className="relative bg-[#0052cc] text-white shadow-xl rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-[230px] cursor-pointer"
              onClick={() => { setIdlePopup(false); setIsOpen(true); }}
            >
              <p className="font-semibold text-[13px]">👋 Still there?</p>
              <p className="text-white/80 text-[12px] mt-0.5">I can help you find products, check prices or track an order!</p>
              <button
                onClick={(e) => { e.stopPropagation(); setIdlePopup(false); }}
                className="absolute top-1.5 right-2 text-white/60 hover:text-white text-base leading-none"
                aria-label="Dismiss"
              >✕</button>
              <span className="absolute -bottom-1.5 right-4 w-3 h-3 bg-[#0052cc] border-r border-b border-[#0052cc] rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleToggleChat}
          aria-label={isOpen ? "Close chat" : "Open Intact AI chat assistant"}
          aria-expanded={isOpen}
          className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? "bg-gray-800 rotate-0"
              : "bg-[#0052cc] hover:bg-[#003ea3] animate-pulse-glow"
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
          {/* Unread dot */}
          {showBadge && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] text-white font-bold flex items-center justify-center">
              1
            </span>
          )}
        </button>
      </motion.div>

      {/* ── Chat Window ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Open Kwaku chat assistant"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{
              width: "clamp(320px, 90vw, 400px)",
              height: "clamp(480px, 80dvh, 580px)",
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0041a8] to-[#0052cc] px-4 py-3 text-white flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">{CHATBOT_CONFIG.name}</p>
                <p className="text-xs text-white/70 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Online
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  aria-label="Reset conversation"
                  title="Start new chat"
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages feed */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onQuickReply={handleQuickReply}
                  onAddToCart={handleAddToCart}
                  isLastMessage={idx === messages.length - 1}
                  isLoading={isLoading}
                />
              ))}

              <AnimatePresence>
                {isLoading && <TypingIndicator />}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() =>
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  aria-label="Scroll to latest message"
                  className="absolute bottom-20 right-5 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                >
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input bar */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white shrink-0"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything…"
                aria-label="Type your message"
                disabled={isLoading}
                maxLength={500}
                className="rounded-full bg-gray-50 border-gray-200 text-sm h-10 focus:ring-[#0052cc] focus:border-[#0052cc]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="rounded-full shrink-0 w-10 h-10 bg-[#0052cc] hover:bg-[#003ea3] disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>

            {/* Footer branding */}
            <p className="text-center text-[10px] text-gray-400 pb-2 bg-white shrink-0">
              Powered by <span className="font-semibold text-[#0052cc]">Kwaku</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
