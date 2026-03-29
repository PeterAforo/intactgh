"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const faqCategories = [
  {
    title: "Orders & Shipping",
    faqs: [
      {
        q: "How long does delivery take?",
        a: "Within Greater Accra, delivery takes 1-3 business days. For other regions, delivery takes 3-7 business days depending on your location.",
      },
      {
        q: "Is delivery free?",
        a: "Yes! We offer free delivery on all orders above GH₵3,000. For orders below that amount, a flat delivery fee of GH₵50 applies within Accra and GH₵100 for other regions.",
      },
      {
        q: "How can I track my order?",
        a: "Once your order is shipped, you'll receive an SMS and email with a tracking number. You can also track your order from your account dashboard.",
      },
      {
        q: "Can I change or cancel my order?",
        a: "You can modify or cancel your order within 2 hours of placing it. After that, please contact our customer service team for assistance.",
      },
    ],
  },
  {
    title: "Payment",
    faqs: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money), Visa/Mastercard debit and credit cards, and Cash on Delivery.",
      },
      {
        q: "Is online payment secure?",
        a: "Absolutely. All transactions are encrypted with 256-bit SSL encryption. We use trusted payment processors and never store your card details on our servers.",
      },
      {
        q: "Can I pay in installments?",
        a: "Yes, we offer installment payment plans on selected products above GH₵2,000. Contact our sales team to learn more about available plans.",
      },
    ],
  },
  {
    title: "Returns & Refunds",
    faqs: [
      {
        q: "What is your return policy?",
        a: "We offer a 5-day return policy on most products. Items must be in their original packaging, unused, and in the same condition you received them.",
      },
      {
        q: "How do I initiate a return?",
        a: "Contact our customer service via phone, email, or the chat widget on our website. We'll provide you with a return authorization and instructions.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds are processed within 3-5 business days after we receive and inspect the returned item. Mobile Money refunds are typically faster than card refunds.",
      },
    ],
  },
  {
    title: "Products & Warranty",
    faqs: [
      {
        q: "Are all products genuine?",
        a: "Yes, 100%. We are authorized dealers for all the brands we carry. Every product comes with the manufacturer's warranty and original packaging.",
      },
      {
        q: "What warranty do products come with?",
        a: "All products come with the manufacturer's standard warranty, typically 1-2 years. Some products have extended warranty options available at checkout.",
      },
      {
        q: "Do you offer product demonstrations?",
        a: "Yes! Visit any of our showrooms for hands-on product demonstrations. Our knowledgeable staff will help you find the perfect product.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (faq) =>
          !search ||
          faq.q.toLowerCase().includes(search.toLowerCase()) ||
          faq.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.faqs.length > 0);

  return (
    <div className="min-h-screen bg-surface">
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-accent" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg mb-8">
              Find answers to common questions about orders, shipping, payments, and more.
            </p>
            <div className="max-w-md mx-auto relative">
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {filteredCategories.map((category, catIdx) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.1 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-text mb-4">{category.title}</h2>
            <div className="space-y-2">
              {category.faqs.map((faq, faqIdx) => {
                const key = `${catIdx}-${faqIdx}`;
                const isOpen = openItems[key];
                return (
                  <div
                    key={key}
                    className="bg-white rounded-xl border border-border/50 overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/50 transition-colors"
                    >
                      <span className="font-medium text-text pr-4">{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-text-muted shrink-0 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 pb-4 text-sm text-text-light leading-relaxed">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted">No questions match your search. Try different keywords.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border/50 p-8 text-center mt-8">
          <h3 className="text-lg font-bold text-text mb-2">Still have questions?</h3>
          <p className="text-text-muted text-sm mb-4">Our support team is here to help you.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+233543645126" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors text-sm">
              Call Us
            </a>
            <a href="mailto:support@intactghana.com" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-border rounded-xl font-medium hover:bg-surface transition-colors text-sm">
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
