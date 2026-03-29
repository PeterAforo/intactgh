"use client";

import { motion } from "framer-motion";
import { Bot, User, ExternalLink } from "lucide-react";
import Link from "next/link";
import QuickReplies from "./QuickReplies";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChatbot";

interface Props {
  message: ChatMessageType;
  onQuickReply: (reply: string) => void;
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
  if (!action || action === "none" || action === "capture_lead") return null;

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

  if (action === "show_products" && payload?.query) {
    const url = `/shop?q=${encodeURIComponent(payload.query)}`;
    return (
      <Link
        href={url}
        className="inline-flex items-center gap-1.5 mt-2 text-xs px-3 py-1.5 bg-[#0052cc] text-white rounded-lg hover:bg-[#003ea3] transition-colors"
      >
        View {payload.query} products
        <ExternalLink className="w-3 h-3" />
      </Link>
    );
  }

  return null;
}

export default function ChatMessage({
  message,
  onQuickReply,
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
      <div className={`max-w-[78%] flex flex-col ${isBot ? "items-start" : "items-end"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isBot
              ? "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm"
              : "bg-[#0052cc] text-white rounded-tr-sm"
          } ${message.isError ? "bg-red-50 border-red-200 text-red-700" : ""}`}
        >
          {renderMarkdown(message.content)}
        </div>

        {/* Action button (redirect / show_products) */}
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
