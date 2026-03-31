"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Search, CheckCircle2, Clock, Truck, MapPin,
  ShoppingBag, XCircle, ChevronRight, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const STATUS_STEPS = [
  { key: "pending",    label: "Order Placed",     icon: ShoppingBag, desc: "Your order has been received" },
  { key: "confirmed", label: "Confirmed",          icon: CheckCircle2, desc: "Order confirmed and being prepared" },
  { key: "processing",label: "Processing",         icon: Package,      desc: "Your items are being packed" },
  { key: "shipped",   label: "Shipped",            icon: Truck,        desc: "Your order is on the way" },
  { key: "delivered", label: "Delivered",          icon: MapPin,       desc: "Order delivered successfully" },
];

const CANCELLED_STEP = { key: "cancelled", label: "Cancelled", icon: XCircle, desc: "This order was cancelled" };

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function paymentMethodLabel(method: string) {
  switch (method) {
    case "hubtel": return "Hubtel (MoMo / Card)";
    case "canpay": return "CanPay Buy Now Pay Later";
    case "cod": return "Payment on Delivery";
    case "pickup": return "Pay at Store";
    default: return method;
  }
}

function paymentStatusBadge(status: string) {
  switch (status) {
    case "paid": return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" />Paid</span>;
    case "pending": return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />Pending</span>;
    default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface text-text-muted">{status}</span>;
  }
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("orderNumber") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Any>(null);
  const [error, setError] = useState("");

  // Auto-track if both params are provided via URL
  useEffect(() => {
    const on = searchParams.get("orderNumber");
    const em = searchParams.get("email");
    if (on && em) handleTrack();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrack = useCallback(async () => {
    if (!orderNumber.trim() || !email.trim()) { setError("Please enter both order number and email."); return; }
    setLoading(true); setError(""); setOrder(null);
    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Order not found."); return; }
      setOrder(data.order);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }, [orderNumber, email]);

  const isCancelled = order?.status === "cancelled";
  const currentStep = isCancelled ? -1 : getStepIndex(order?.status || "pending");
  const steps = isCancelled ? [...STATUS_STEPS, CANCELLED_STEP] : STATUS_STEPS;

  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-text mb-2">Track Your Order</h1>
          <p className="text-text-muted">Enter your order number and email address to see the latest status.</p>
        </motion.div>

        {/* Search form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-border p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Order Number</label>
              <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. ORD-20260331-ABC123" className="rounded-lg font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleTrack()} />
            </div>
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Email Address</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="The email used when placing the order" className="rounded-lg"
                onKeyDown={(e) => e.key === "Enter" && handleTrack()} />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
            )}
            <Button className="w-full rounded-xl h-11" onClick={handleTrack} disabled={loading}>
              {loading ? "Searching…" : <><Search className="w-4 h-4 mr-2" />Track Order</>}
            </Button>
          </div>
        </motion.div>

        {/* Order result */}
        <AnimatePresence>
          {order && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-5">

              {/* Order header */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <p className="text-xs text-text-muted">Order Number</p>
                    <p className="font-mono font-bold text-text text-lg">{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Placed on</p>
                    <p className="text-sm font-medium text-text">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-text-muted">Payment:</span>
                    <span className="font-medium">{paymentMethodLabel(order.paymentMethod)}</span>
                    {paymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
              </div>

              {/* Status timeline */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-bold text-text mb-6">Order Status</h2>
                {isCancelled ? (
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                    <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800">Order Cancelled</p>
                      <p className="text-xs text-red-600 mt-0.5">This order has been cancelled. Contact support if you have questions.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {steps.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isCompleted = idx < currentStep;
                      const isCurrent = idx === currentStep;
                      const isPending = idx > currentStep;
                      return (
                        <div key={step.key} className="flex gap-4 pb-6 last:pb-0 relative">
                          {idx < steps.length - 1 && (
                            <div className={`absolute left-[19px] top-10 w-0.5 h-full ${isCompleted ? "bg-accent" : "bg-border"}`} />
                          )}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                            isCompleted ? "bg-accent text-white" :
                            isCurrent ? "bg-accent text-white ring-4 ring-accent/20" :
                            "bg-surface text-text-muted border-2 border-border"
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 pt-1.5">
                            <p className={`text-sm font-semibold ${isCurrent ? "text-accent" : isPending ? "text-text-muted" : "text-text"}`}>
                              {step.label}
                              {isCurrent && <span className="ml-2 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Current</span>}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-bold text-text mb-4">Items Ordered</h2>
                <div className="space-y-3">
                  {order.items.map((item: Any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface shrink-0 relative">
                        {item.product.images[0]?.url ? (
                          <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-border" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-text-muted">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                      <p className="text-sm font-bold text-text shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                  <div className="flex justify-between text-text-muted">
                    <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Delivery</span>
                    <span>{order.deliveryFee === 0 ? <span className="text-success">FREE</span> : formatPrice(order.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-text border-t border-border pt-2">
                    <span>Total</span><span className="text-accent">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-bold text-text mb-3">Delivery Address</h2>
                <p className="text-sm text-text">
                  {order.shippingFirstName} {order.shippingLastName}
                </p>
                <p className="text-sm text-text-muted mt-0.5">{order.shippingCity}, {order.shippingRegion}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/shop" className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl">Continue Shopping</Button>
                </Link>
                <Link href="/contact" className="flex-1">
                  <Button className="w-full rounded-xl">
                    Need Help? <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        {!order && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-border p-5 mt-2">
            <div className="flex items-start gap-3">
              <ChevronRight className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div className="text-sm text-text-muted space-y-1">
                <p>Your order number was included in your confirmation email (e.g. <span className="font-mono text-text">ORD-20260331-XXXXX</span>).</p>
                <p>Use the same email address you entered at checkout.</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
