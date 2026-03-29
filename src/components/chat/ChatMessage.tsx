"use client";

import { motion } from "framer-motion";
import {
  Bot, User, ExternalLink, ShoppingCart, Package,
  Tag, ArrowRight, Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import QuickReplies from "./QuickReplies";
import ComparisonBlock from "./ComparisonBlock";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChatbot";
import type { ProductDetail, AccessoryGroup } from "@/lib/chatbot/types";
import { chatAnalytics } from "@/lib/chatbot/analytics";
import { formatPrice } from "@/lib/utils";

interface Props {
  message: ChatMessageType;
  onQuickReply: (reply: string) => void;
  onAddToCart?: (product: ProductDetail) => void;
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
      // Bullet lines
      if (part.startsWith("• ") || part.startsWith("- ")) {
        return <span key={j} className="block pl-2">{part}</span>;
      }
      return part;
    });
    return (
      <span key={i} className="block">
        {rendered}
        {i < lines.length - 1 && line.trim() && <span className="block h-0.5" />}
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
  if (!action || action === "none" || action === "capture_lead" || action === "show_products" || action === "compare_products") return null;

  if (action === "redirect" && payload?.url) {
    return (
      <Link
        href={payload.url}
        className="inline-flex items-center gap-1.5 mt-2 text-xs px-3 py-1.5 bg-[#0052cc] text-white rounded-lg hover:bg-[#003ea3] transition-colors"
        onClick={() => {
          if (payload.url === "/checkout") chatAnalytics.checkoutCtaClicked();
        }}
      >
        {payload.label ?? "Open page"}
        <ExternalLink className="w-3 h-3" />
      </Link>
    );
  }

  if (action === "track_order" && payload?.prompt) {
    return (
      <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
        {payload.prompt}
      </div>
    );
  }

  return null;
}

function ProductCards({
  products,
  onAddToCart,
}: {
  products: ProductDetail[];
  onAddToCart?: (product: ProductDetail) => void;
}) {
  if (!products.length) return null;
  return (
    <div
      className="mt-2 flex gap-2 overflow-x-auto pb-1 max-w-[280px]"
      style={{ scrollbarWidth: "none" }}
    >
      {products.map((p) => (
        <div
          key={p.id}
          className="shrink-0 w-[140px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
        >
          <Link
            href={`/product/${p.slug}`}
            className="block"
            onClick={() => chatAnalytics.viewProductClicked(p.id, p.name)}
          >
            <div className="relative w-full h-[90px] bg-gray-50">
              {/* Badges */}
              <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-10">
                {p.onSale && (
                  <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">SALE</span>
                )}
                {p.isNew && (
                  <span className="bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">NEW</span>
                )}
                {p.featured && !p.onSale && !p.isNew && (
                  <span className="bg-[#0052cc] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">TOP</span>
                )}
              </div>
              {p.image ? (
                <Image src={p.image} alt={p.name} fill className="object-contain p-1" sizes="140px" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>
            <div className="px-2 py-1.5">
              {p.brand && <p className="text-[9px] text-gray-400 uppercase tracking-wide truncate">{p.brand}</p>}
              <p className="text-[11px] font-medium text-gray-800 leading-tight line-clamp-2">{p.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[12px] font-bold text-[#0052cc]">{formatPrice(p.price)}</p>
                {p.comparePrice && p.comparePrice > p.price && (
                  <p className="text-[9px] text-gray-400 line-through">{formatPrice(p.comparePrice)}</p>
                )}
              </div>
              {p.rating && p.rating > 0 ? (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-[9px] text-gray-500">{p.rating.toFixed(1)}</span>
                </div>
              ) : null}
            </div>
          </Link>
          <div className="px-2 pb-2 flex gap-1">
            <button
              onClick={() => {
                onAddToCart?.(p);
                chatAnalytics.addToCartClicked(p.id, p.name, p.price);
              }}
              disabled={p.stock === 0}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-medium py-1.5 rounded-lg bg-[#0052cc] text-white hover:bg-[#003ea3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-3 h-3" />
              {p.stock === 0 ? "Out of stock" : "Add"}
            </button>
            <Link
              href={`/product/${p.slug}`}
              onClick={() => chatAnalytics.viewProductClicked(p.id, p.name)}
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
              title="View product"
            >
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function AccessoryShelf({
  accessories,
  onAddToCart,
}: {
  accessories: AccessoryGroup;
  onAddToCart?: (product: ProductDetail) => void;
}) {
  if (!accessories.products.length) return null;
  return (
    <div className="mt-2 max-w-[280px]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Tag className="w-3 h-3 text-orange-500" />
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{accessories.label}</p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {accessories.products.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            onClick={() => chatAnalytics.viewProductClicked(p.id, p.name)}
            className="shrink-0 w-[90px] bg-orange-50 border border-orange-100 rounded-lg p-1.5 hover:bg-orange-100 transition-colors"
          >
            <div className="relative w-full h-[52px] bg-white rounded-md overflow-hidden mb-1">
              {p.image ? (
                <Image src={p.image} alt={p.name} fill className="object-contain p-0.5" sizes="90px" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
            <p className="text-[9px] font-medium text-gray-700 leading-tight line-clamp-2">{p.name}</p>
            <p className="text-[10px] font-bold text-orange-600 mt-0.5">{formatPrice(p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ModeBadge({ mode }: { mode?: string }) {
  if (!mode || mode === "browsing") return null;
  const badges: Record<string, { label: string; cls: string }> = {
    recommendation: { label: "✨ Recommendation", cls: "bg-blue-50 text-blue-600" },
    comparison: { label: "⚖️ Comparison", cls: "bg-purple-50 text-purple-600" },
    conversion: { label: "🛒 Ready to Buy", cls: "bg-green-50 text-green-600" },
    support: { label: "💬 Support", cls: "bg-gray-100 text-gray-500" },
  };
  const b = badges[mode];
  if (!b) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${b.cls} mb-1`}>
      {b.label}
    </span>
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
        {/* Mode badge (only on bot messages with non-browsing mode) */}
        {isBot && message.mode && <ModeBadge mode={message.mode} />}

        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isBot
              ? "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm"
              : "bg-[#0052cc] text-white rounded-tr-sm"
          } ${message.isError ? "bg-red-50 border-red-200 text-red-700" : ""}`}
        >
          {renderMarkdown(message.content)}
        </div>

        {/* Comparison block */}
        {isBot && message.comparison && (
          <ComparisonBlock
            comparison={message.comparison}
            onAddToCart={onAddToCart}
            onProductClick={(id, name) => chatAnalytics.viewProductClicked(id, name)}
          />
        )}

        {/* Product cards */}
        {isBot && !message.comparison && message.products && message.products.length > 0 && (
          <ProductCards products={message.products} onAddToCart={onAddToCart} />
        )}

        {/* Accessory shelf */}
        {isBot && message.accessories && (
          <AccessoryShelf accessories={message.accessories} onAddToCart={onAddToCart} />
        )}

        {/* Action button (redirect, track_order) */}
        {isBot && (
          <ActionButton action={message.action} payload={message.action_payload} />
        )}

        {/* Quick replies — only on last bot message, not while loading */}
        {isBot && isLastMessage && !isLoading && message.quickReplies && message.quickReplies.length > 0 && (
          <QuickReplies
            replies={message.quickReplies}
            onSelect={(r) => {
              chatAnalytics.quickReplyClicked(r);
              onQuickReply(r);
            }}
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
