"use client";

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

export default function QuickReplies({ replies, onSelect, disabled }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-1.5 mt-2"
      role="group"
      aria-label="Quick reply options"
    >
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => !disabled && onSelect(reply)}
          disabled={disabled}
          aria-label={`Quick reply: ${reply}`}
          className="text-xs px-3 py-1.5 rounded-full border border-[#0052cc]/30 text-[#0052cc] bg-[#0052cc]/5 hover:bg-[#0052cc] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
