"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex gap-2 items-end"
      aria-label="Intact AI is typing"
      role="status"
    >
      <div className="w-7 h-7 rounded-full bg-[#0052cc] text-white flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 150, 300].map((delay) => (
            <motion.span
              key={delay}
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: delay / 1000,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
