"use client";

import { motion } from "framer-motion";
import { Bot, User, ExternalLink, ShoppingCart, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import QuickReplies from "./QuickReplies";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChatbot";
import type { ProductPreview } from "@/lib/chatbot-config";
import { formatPrice } from "@/lib/utils";

interface Props {
  message: ChatMessageType;
  onQuickReply: (reply: string) => void;
  onAddToCart?: (product: ProductPreview) => void;
  isLastMessage: boolean;
  isLoading: boolean;
}

// Converts **bold** and newlines to JSX
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <span key={i}>
        {rendered}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

function ActionButton({
  action,
  payload,
}: {
  action: ChatMessageType["action"];
  payload?: Record<string, string>;
}) {
  if (!action || action === "none" || action === "capture_lead" || action === "show_products") return null;

  if (action === "redirect" && payload?.url) {
    return (
      <Link
        href={payload.url}
        className="inline-flex items-center gap-1.5 mt-2 text-xs px-3 py-1.5 bg-[#0052cc] text-white rounded-lg hover:bg-[#003ea3] transition-colors"
      >
        {payload.label ?? "Open page"}
        <ExternalLink className="w-3 h-3" />
      </Link>
    );
  }

  return null;
}

function ProductCards({
  products,
  onAddToCart,
}: {
  products: ProductPreview[];
  onAddToCart?: (product: ProductPreview) => void;
}) {
  if (!products.length) return null;
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 max-w-[280px]" style={{ scrollbarWidth: "none" }}>
      {products.map((p) => (
        <div
          key={p.id}
          className="shrink-0 w-[140px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
        >
          <Link href={`/product/${p.slug}`} className="block">
            <div className="relative w-full h-[90px] bg-gray-50">
              {p.image ? (
                <Image src={p.image} alt={p.name} fill className="object-contain p-1" sizes="140px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>
            <div className="px-2 py-1.5">
              <p className="text-[11px] font-medium text-gray-800 leading-tight line-clamp-2">{p.name}</p>
              <p className="text-[12px] font-bold text-[#0052cc] mt-0.5">{formatPrice(p.price)}</p>
              {p.comparePrice && p.comparePrice > p.price && (
                <p className="text-[10px] text-gray-400 line-through">{formatPrice(p.comparePrice)}</p>
              )}
            </div>
          </Link>
          <div className="px-2 pb-2">
            <button
              onClick={() => onAddToCart?.(p)}
              disabled={p.stock === 0}
              className="w-full flex items-center justify-center gap-1 text-[11px] font-medium py-1.5 rounded-lg bg-[#0052cc] text-white hover:bg-[#003ea3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-3 h-3" />
              {p.stock === 0 ? "Out of stock" : "Add to Cart"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChatMessage({
  message,
  onQuickReply,
  onAddToCart,
  isLastMessage,
  isLoading,
}: Props) {
  const isBot = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2 ${isBot ? "items-end" : "items-end flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isBot ? "bg-[#0052cc] text-white" : "bg-gray-200 text-gray-600"
        }`}
        aria-hidden="true"
      >
        {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Bubble + extras */}
      <div className={`max-w-[85%] flex flex-col ${isBot ? "items-start" : "items-end"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isBot
              ? "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm"
              : "bg-[#0052cc] text-white rounded-tr-sm"
          } ${message.isError ? "bg-red-50 border-red-200 text-red-700" : ""}`}
        >
          {renderMarkdown(message.content)}
        </div>

        {/* Product cards */}
        {isBot && message.products && message.products.length > 0 && (
          <ProductCards products={message.products} onAddToCart={onAddToCart} />
        )}

        {/* Action button (redirect only) */}
        {isBot && (
          <ActionButton action={message.action} payload={message.action_payload} />
        )}

        {/* Quick replies — only on last bot message and not while loading */}
        {isBot && isLastMessage && !isLoading && message.quickReplies && message.quickReplies.length > 0 && (
          <QuickReplies
            replies={message.quickReplies}
            onSelect={onQuickReply}
            disabled={isLoading}
          />
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}
