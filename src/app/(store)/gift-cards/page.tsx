"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, CheckCircle2, Copy, ArrowRight, Shield, Clock, CreditCard, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const DENOMINATIONS = [
  { amount: 10, label: "GH₵10", popular: false },
  { amount: 20, label: "GH₵20", popular: false },
  { amount: 50, label: "GH₵50", popular: true },
  { amount: 100, label: "GH₵100", popular: true },
  { amount: 200, label: "GH₵200", popular: false },
  { amount: 500, label: "GH₵500", popular: false },
];

const FAQS = [
  { q: "How do I use a gift card?", a: "At checkout, enter your gift card code and PIN in the gift card section. The amount will be deducted from your order total automatically." },
  { q: "Can I use a gift card with other discounts?", a: "Yes! Gift cards can be combined with promotional codes and sale prices." },
  { q: "What if my gift card balance doesn't cover the full order?", a: "You can pay the remaining balance with any other payment method available at checkout." },
  { q: "Do gift cards expire?", a: "Gift cards purchased online do not expire unless a specific expiry date is set. Physically printed cards may have an expiry — check the card for details." },
  { q: "Can I check my gift card balance?", a: "Yes, enter your code and PIN in the checker below to see your current balance." },
];

export default function GiftCardsPage() {
  const [selected, setSelected] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState<Any>(null);

  // Balance checker
  const [checkCode, setCheckCode] = useState("");
  const [checkPin, setCheckPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<Any>(null);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const finalAmount = customAmount ? parseFloat(customAmount) : selected ?? 0;

  const handlePurchase = async () => {
    if (!finalAmount || finalAmount < 5) { toast.error("Minimum gift card value is GH₵5"); return; }
    if (finalAmount > 5000) { toast.error("Maximum gift card value is GH₵5,000"); return; }
    setPurchasing(true);
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          quantity: 1,
          purchasedBy: recipientEmail || null,
          notes: recipientName ? `Purchased for ${recipientName}${message ? ` — "${message}"` : ""}` : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");
      setPurchased(data.cards[0]);
      toast.success("Gift card created!");
    } catch (e: Any) {
      toast.error(e.message || "Failed to create gift card");
    } finally {
      setPurchasing(false);
    }
  };

  const handleCheckBalance = async () => {
    if (!checkCode.trim() || !checkPin.trim()) { toast.error("Enter both code and PIN"); return; }
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: checkCode.trim(), pin: checkPin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setCheckResult({ error: data.error }); return; }
      setCheckResult(data);
    } catch { setCheckResult({ error: "Check failed. Try again." }); }
    finally { setChecking(false); }
  };

  const copyText = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copied!"); };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0041a8] to-[#0080ff] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Gift className="w-9 h-9" />
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-black mb-3">
            Intact Ghana Gift Cards
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-white/80 text-lg">
            The perfect gift for any occasion — redeemable on thousands of products online and in-store.
          </motion.p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Purchase form */}
        <div className="lg:col-span-2 space-y-6">
          {!purchased ? (
            <>
              {/* Denominations */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-bold text-text mb-4">Choose Amount</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                  {DENOMINATIONS.map((d) => (
                    <button key={d.amount}
                      onClick={() => { setSelected(d.amount); setCustomAmount(""); }}
                      className={`relative py-3 rounded-xl border text-sm font-bold transition-all ${
                        selected === d.amount && !customAmount
                          ? "bg-accent text-white border-accent shadow-md scale-105"
                          : "bg-surface border-border text-text hover:border-accent/50"
                      }`}>
                      {d.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-gold text-white px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
                          Popular
                        </span>
                      )}
                      {d.label}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium text-text block mb-1.5">Or enter custom amount (GH₵)</label>
                  <Input type="number" value={customAmount} min="5" max="5000"
                    onChange={(e) => { setCustomAmount(e.target.value); setSelected(null); }}
                    placeholder="e.g. 75" className="rounded-lg max-w-xs" />
                </div>
              </motion.div>

              {/* Recipient details */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-bold text-text mb-4">Recipient Details <span className="text-text-muted font-normal text-sm">(optional)</span></h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">Recipient Name</label>
                      <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="John Doe" className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">Recipient Email</label>
                      <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="john@email.com" className="rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Personal Message</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="Happy Birthday! Enjoy shopping at Intact Ghana…"
                      rows={3}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none" />
                  </div>
                </div>
              </motion.div>

              {/* Purchase summary */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-text">Summary</h2>
                  <span className="text-2xl font-black text-accent">{finalAmount ? formatPrice(finalAmount) : "—"}</span>
                </div>
                <p className="text-sm text-text-muted mb-5">
                  You will receive a gift card code and PIN after purchase. Share it with the recipient or save it for yourself.
                </p>
                <Button className="w-full rounded-xl h-12 text-base font-semibold" onClick={handlePurchase}
                  disabled={!finalAmount || finalAmount < 5 || purchasing}>
                  {purchasing ? "Processing…" : `Purchase ${finalAmount ? formatPrice(finalAmount) : ""} Gift Card`}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-xs text-text-muted mt-3 text-center">
                  Gift cards are fulfilled digitally. For physical printed cards, visit our{" "}
                  <Link href="/store-locations" className="text-accent hover:underline">store locations</Link>.
                </p>
              </motion.div>
            </>
          ) : (
            /* Success state */
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-green-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-text mb-1">Gift Card Ready!</h2>
              <p className="text-text-muted text-sm mb-6">Save or share these details securely.</p>

              {/* Printable card */}
              <div className="w-full max-w-sm mx-auto rounded-2xl bg-gradient-to-br from-[#0041a8] to-[#0080ff] text-white p-6 mb-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs opacity-70">Intact Ghana</p>
                    <p className="text-xl font-black">Gift Card</p>
                  </div>
                  <Gift className="w-9 h-9 opacity-80" />
                </div>
                <p className="text-3xl font-black mb-2">{formatPrice(purchased.amount)}</p>
                <p className="text-sm font-mono tracking-wider opacity-90 mb-1">{purchased.code}</p>
                <p className="text-xs opacity-70">PIN: {purchased.pin}</p>
              </div>

              <div className="space-y-3 text-left max-w-sm mx-auto mb-6">
                <div className="flex items-center justify-between bg-surface rounded-xl p-3">
                  <div>
                    <p className="text-xs text-text-muted">Card Code</p>
                    <p className="font-mono font-bold text-text">{purchased.code}</p>
                  </div>
                  <button onClick={() => copyText(purchased.code)} className="p-2 rounded-lg hover:bg-white transition-colors">
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-surface rounded-xl p-3">
                  <div>
                    <p className="text-xs text-text-muted">PIN</p>
                    <p className="font-mono font-bold text-text">{purchased.pin}</p>
                  </div>
                  <button onClick={() => copyText(purchased.pin)} className="p-2 rounded-lg hover:bg-white transition-colors">
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => window.print()}>Print Card</Button>
                <Button className="flex-1 rounded-xl" onClick={() => { setPurchased(null); setSelected(50); setCustomAmount(""); setRecipientName(""); setRecipientEmail(""); setMessage(""); }}
                  asChild={false}>
                  Buy Another
                </Button>
              </div>
            </motion.div>
          )}

          {/* Balance Checker */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold text-text mb-1">Check Balance</h2>
            <p className="text-sm text-text-muted mb-4">Enter your gift card details to see the remaining balance.</p>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <Input value={checkCode} onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                placeholder="INTGC-XXXX-XXXX-XXXX" className="rounded-lg flex-1 font-mono text-sm" />
              <Input value={checkPin} onChange={(e) => setCheckPin(e.target.value)}
                placeholder="6-digit PIN" maxLength={6} className="rounded-lg w-full sm:w-36 font-mono" />
              <Button variant="outline" className="rounded-lg shrink-0" onClick={handleCheckBalance} disabled={checking}>
                {checking ? "Checking…" : "Check"}
              </Button>
            </div>
            {checkResult && (
              <div className={`rounded-xl p-3 text-sm ${checkResult.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                {checkResult.error ? checkResult.error : (
                  <>
                    <strong>Balance: GH₵{checkResult.balance?.toFixed(2)}</strong>
                    {checkResult.amount !== checkResult.balance && (
                      <span className="text-green-600 ml-2">(original: GH₵{checkResult.amount?.toFixed(2)})</span>
                    )}
                    {checkResult.expiresAt && <span className="ml-2">· Expires {new Date(checkResult.expiresAt).toLocaleDateString()}</span>}
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: How it works + FAQs */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold text-text mb-4">How It Works</h2>
            <div className="space-y-4">
              {[
                { icon: <CreditCard className="w-5 h-5 text-accent" />, title: "1. Choose & Purchase", desc: "Pick a denomination or enter a custom amount, then complete your purchase." },
                { icon: <Gift className="w-5 h-5 text-green-600" />, title: "2. Receive Your Card", desc: "You get a unique card code and 6-digit PIN instantly." },
                { icon: <Shield className="w-5 h-5 text-blue-600" />, title: "3. Share or Redeem", desc: "Give it as a gift or use it yourself at checkout — online or in-store." },
                { icon: <Clock className="w-5 h-5 text-amber-600" />, title: "4. Partial Use OK", desc: "Unused balance stays on the card for future purchases." },
              ].map((step) => (
                <div key={step.title} className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{step.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* FAQs */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-text-muted" />
              <h2 className="font-bold text-text">FAQs</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left p-3 flex items-center justify-between gap-2 hover:bg-surface transition-colors">
                    <span className="text-sm font-medium text-text">{faq.q}</span>
                    <span className="text-text-muted shrink-0">{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-3 pb-3 text-xs text-text-muted leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
