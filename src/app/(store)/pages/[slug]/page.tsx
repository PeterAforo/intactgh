"use client";

import React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const pagesContent: Record<string, { title: string; content: string[] }> = {
  "privacy-policy": {
    title: "Privacy Policy",
    content: [
      "Last updated: March 2026",
      "At Intact Ghana, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.",
      "## Information We Collect\nWe collect information you provide directly, including: name, email address, phone number, shipping address, payment information, and any other information you choose to provide when creating an account, making a purchase, or contacting us.",
      "## How We Use Your Information\nWe use the information we collect to: process and fulfill your orders, communicate with you about orders and promotions, improve our website and services, prevent fraud and ensure security, and comply with legal obligations.",
      "## Information Sharing\nWe do not sell your personal information. We may share your information with: payment processors to complete transactions, delivery partners to ship your orders, and law enforcement when required by law.",
      "## Data Security\nWe implement appropriate technical and organizational security measures to protect your personal information, including SSL encryption for all data transmissions and secure storage of payment information.",
      "## Your Rights\nYou have the right to: access your personal data, correct inaccurate data, request deletion of your data, opt out of marketing communications, and lodge a complaint with a supervisory authority.",
      "## Contact Us\nIf you have questions about this Privacy Policy, please contact us at privacy@intactghana.com or call +233 543 645 126.",
    ],
  },
  "terms-of-use": {
    title: "Terms & Conditions",
    content: [
      "Last updated: March 2026",
      "Welcome to Intact Ghana. These Terms and Conditions govern your use of our website and the purchase of products from us.",
      "## Acceptance of Terms\nBy accessing or using our website, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.",
      "## Products and Pricing\nAll products are subject to availability. Prices are listed in Ghana Cedis (GH₵) and include applicable taxes. We reserve the right to modify prices without prior notice. Errors in pricing will be corrected and you will be notified before your order is processed.",
      "## Orders and Payment\nBy placing an order, you are making an offer to purchase. We reserve the right to refuse or cancel any order. Payment must be made in full at the time of purchase unless a payment plan has been agreed upon.",
      "## Shipping and Delivery\nDelivery times are estimates and not guaranteed. We are not liable for delays caused by factors beyond our control. Risk of loss transfers to you upon delivery.",
      "## Returns and Refunds\nProducts may be returned within 5 days of delivery in their original condition and packaging. Certain products such as opened software, personalized items, and hygiene products are non-returnable.",
      "## Limitation of Liability\nIntact Ghana shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services or products.",
      "## Governing Law\nThese Terms shall be governed by the laws of the Republic of Ghana. Any disputes shall be resolved in the courts of Ghana.",
    ],
  },
  "refund-policy": {
    title: "Refund Policy",
    content: [
      "Last updated: March 2026",
      "At Intact Ghana, customer satisfaction is our priority. This Refund Policy outlines the conditions under which refunds are provided.",
      "## Eligibility for Refunds\nYou may request a refund within 5 days of receiving your order if: the product is defective or damaged upon arrival, the product received is different from what was ordered, or the product does not function as advertised.",
      "## Non-Refundable Items\nThe following items are not eligible for refunds: opened software and digital products, gift cards and vouchers, products with broken seals (hygiene-related items), and items damaged due to customer misuse.",
      "## Refund Process\n1. Contact our customer service team within 5 days of delivery.\n2. Provide your order number and reason for the refund.\n3. Our team will provide return instructions.\n4. Ship the item back in its original packaging.\n5. Once received and inspected, your refund will be processed.",
      "## Refund Timeline\nMobile Money refunds: 1-3 business days. Credit/Debit card refunds: 5-10 business days. Bank transfer refunds: 3-7 business days.",
      "## Exchanges\nIf you received a defective product, we offer free exchanges. Contact us and we will arrange for a replacement to be shipped at no additional cost.",
      "## Contact\nFor refund inquiries, email returns@intactghana.com or call +233 543 645 126.",
    ],
  },
  "delivery-policy": {
    title: "Delivery Policy",
    content: [
      "Last updated: March 2026",
      "Intact Ghana delivers products across all regions of Ghana. Below are the details of our delivery service.",
      "## Delivery Areas\nWe deliver to all 16 regions of Ghana. Delivery times and fees may vary depending on your location.",
      "## Delivery Timeframes\nGreater Accra: 1-3 business days. Ashanti, Central, Eastern, Western regions: 3-5 business days. Northern, Upper East, Upper West, Volta, and other regions: 5-7 business days.",
      "## Delivery Fees\nWithin Greater Accra: from GH₵50. Outside Greater Accra: GH₵80-150 depending on location. Exact fees are calculated at checkout based on your delivery address.",
      "## Tracking Your Order\nOnce your order is shipped, you will receive a notification via SMS and email with tracking information. You can also track your order from your account dashboard.",
      "## Failed Deliveries\nIf delivery is attempted and you are not available, our courier will attempt delivery again the next business day. After 3 failed attempts, the order will be returned to our warehouse and you will be contacted.",
      "## Damaged Items\nIf your order arrives damaged, please refuse the delivery and contact us immediately. We will arrange a replacement at no cost.",
    ],
  },
  "shipping-returns": {
    title: "Shipping & Returns",
    content: [
      "Last updated: March 2026",
      "## Shipping Information\nWe ship all orders from our warehouse in Accra, Ghana. Orders placed before 2:00 PM on business days are processed the same day.",
      "## Shipping Methods\nStandard Delivery: 1-7 business days depending on location. Express Delivery (Greater Accra only): Next business day delivery for an additional GH₵30.",
      "## Free Shipping\nEnjoy free standard shipping on all orders above GH₵3,000. This applies to all locations within Ghana.",
      "## International Shipping\nWe currently do not offer international shipping. We plan to expand to West African countries in the near future.",
      "## Returns\nWe accept returns within 5 days of delivery. To initiate a return, contact our customer service team with your order number. Items must be unused, in original packaging, and in the same condition you received them.",
      "## Return Shipping\nFor defective products, we cover return shipping costs. For other returns (change of mind, wrong size, etc.), the customer is responsible for return shipping costs.",
      "## Refund Processing\nOnce we receive your returned item, we will inspect it and notify you of the refund status. Approved refunds are processed within 3-5 business days.",
    ],
  },
};

export default function CMSPage() {
  const params = useParams();
  const slug = params.slug as string;
  const page = pagesContent[slug];

  if (!page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-text mb-3">Page Not Found</h1>
        <p className="text-text-muted mb-6">The page you are looking for does not exist.</p>
        <Link href="/">
          <Button className="rounded-xl">Go Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-gradient-to-r from-primary to-primary-light text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold"
          >
            {page.title}
          </motion.h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-border/50 p-6 md:p-10"
        >
          {page.content.map((block, i) => {
            if (block.startsWith("## ")) {
              const parts = block.split("\n");
              const heading = parts[0].replace("## ", "");
              const body = parts.slice(1).join("\n");
              return (
                <div key={i} className="mb-6">
                  <h2 className="text-xl font-bold text-text mb-2">{heading}</h2>
                  <p className="text-text-light leading-relaxed whitespace-pre-line">{body}</p>
                </div>
              );
            }
            return (
              <p key={i} className="text-text-light leading-relaxed mb-4 whitespace-pre-line">
                {block}
              </p>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
