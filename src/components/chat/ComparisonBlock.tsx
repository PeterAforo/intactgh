"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Package, Trophy, ShoppingCart, ExternalLink, CheckCircle2 } from "lucide-react";
import type { ComparisonData } from "@/lib/chatbot/types";
import { formatPrice } from "@/lib/utils";

interface Props {
  comparison: ComparisonData;
  onAddToCart?: (product: ComparisonData["productA"]) => void;
  onProductClick?: (productId: string, productName: string) => void;
}

export default function ComparisonBlock({ comparison, onAddToCart, onProductClick }: Props) {
  const { productA, productB, rows, verdictA, verdictB } = comparison;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-2 w-full max-w-[320px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0041a8] to-[#0052cc] px-3 py-2 text-center">
        <p className="text-white text-[11px] font-bold uppercase tracking-wider">Side-by-Side Comparison</p>
      </div>

      {/* Product Headers */}
      <div className="grid grid-cols-2 gap-px bg-gray-100">
        {[productA, productB].map((p, i) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            onClick={() => onProductClick?.(p.id, p.name)}
            className="bg-white p-2.5 flex flex-col items-center gap-1.5 hover:bg-gray-50 transition-colors"
          >
            <div className="relative w-14 h-14 bg-gray-50 rounded-lg overflow-hidden shrink-0">
              {p.image ? (
                <Image src={p.image} alt={p.name} fill className="object-contain p-1" sizes="56px" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </div>
            <p className="text-[10px] font-semibold text-gray-800 text-center leading-tight line-clamp-2">{p.name}</p>
            <p className="text-[12px] font-bold text-[#0052cc]">{formatPrice(p.price)}</p>
            {i === 0 && <span className="text-[9px] bg-blue-50 text-[#0052cc] px-1.5 py-0.5 rounded font-medium">Option A</span>}
            {i === 1 && <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Option B</span>}
          </Link>
        ))}
      </div>

      {/* Comparison Rows */}
      <div className="divide-y divide-gray-100">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_auto_1fr] items-center">
            {/* Value A */}
            <div className={`px-2.5 py-1.5 text-[10px] text-center ${row.winner === "a" ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600"}`}>
              {row.winner === "a" && <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5 text-green-500" />}
              {row.valueA}
            </div>
            {/* Aspect label */}
            <div className="px-1.5 py-1.5 bg-gray-50 text-[9px] font-semibold text-gray-400 uppercase tracking-wide text-center whitespace-nowrap">
              {row.aspect}
            </div>
            {/* Value B */}
            <div className={`px-2.5 py-1.5 text-[10px] text-center ${row.winner === "b" ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600"}`}>
              {row.winner === "b" && <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5 text-green-500" />}
              {row.valueB}
            </div>
          </div>
        ))}
      </div>

      {/* Verdicts */}
      <div className="grid grid-cols-2 gap-px bg-gray-100 mt-px">
        <div className="bg-blue-50 px-2.5 py-2 text-center">
          <Trophy className="w-3 h-3 text-[#0052cc] mx-auto mb-0.5" />
          <p className="text-[9px] text-[#0052cc] font-semibold leading-tight">{verdictA}</p>
        </div>
        <div className="bg-gray-50 px-2.5 py-2 text-center">
          <Trophy className="w-3 h-3 text-gray-400 mx-auto mb-0.5" />
          <p className="text-[9px] text-gray-500 font-semibold leading-tight">{verdictB}</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-1.5 p-2 bg-white">
        {[productA, productB].map((p) => (
          <div key={p.id} className="flex flex-col gap-1">
            <button
              onClick={() => onAddToCart?.(p)}
              disabled={p.stock === 0}
              className="flex items-center justify-center gap-1 text-[10px] font-medium py-1.5 rounded-lg bg-[#0052cc] text-white hover:bg-[#003ea3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-2.5 h-2.5" />
              {p.stock === 0 ? "Out of stock" : "Add to Cart"}
            </button>
            <Link
              href={`/product/${p.slug}`}
              onClick={() => onProductClick?.(p.id, p.name)}
              className="flex items-center justify-center gap-1 text-[10px] font-medium py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              View
            </Link>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
