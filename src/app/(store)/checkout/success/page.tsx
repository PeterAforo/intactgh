"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ShoppingBag, User, Wallet, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "N/A";
  const method = searchParams.get("method");
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-lg"
      >
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-success" />
        </div>

        <h1 className="text-3xl font-bold text-text mb-3">Payment Successful!</h1>

        <p className="text-text-muted mb-2">
          Thank you for shopping with Intact Ghana.
        </p>

        <div className="bg-surface rounded-xl p-4 mb-6 inline-block">
          <div className="flex items-center gap-3 text-sm">
            {method === "hubtel" && <Wallet className="w-4 h-4 text-success" />}
            {method === "canpay" && <Clock className="w-4 h-4 text-[#0A7BFF]" />}
            <span className="text-text-muted">
              {method === "hubtel" ? "Paid via Hubtel" : method === "canpay" ? "CanPay BNPL" : "Payment confirmed"}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Reference: <span className="font-mono font-bold text-accent">{ref}</span>
          </p>
        </div>

        <p className="text-sm text-text-light mb-8">
          You&apos;ll receive an email and SMS confirmation shortly with your order details and tracking information.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop">
            <Button size="lg" className="rounded-xl">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <Link href="/account">
            <Button variant="outline" size="lg" className="rounded-xl">
              <User className="w-4 h-4 mr-2" />
              View Orders
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
