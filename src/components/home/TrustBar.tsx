import React from "react";
import { Truck, ShieldCheck, Smartphone, BadgeCheck } from "lucide-react";

const items = [
  { icon: Truck, label: "Delivery nationwide — Accra in 1–3 days" },
  { icon: ShieldCheck, label: "5-day returns on unopened items" },
  { icon: Smartphone, label: "MoMo, cards & cash on delivery" },
  { icon: BadgeCheck, label: "Genuine products, manufacturer warranty" },
];

/** Slim trust strip — real fulfilment facts from the store's FAQ. */
export default function TrustBar() {
  return (
    <section aria-label="Shopping confidence" className="bg-[#f5f5f4]">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-4 sm:px-8">
        {items.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-2 text-base font-medium text-[#111]/70">
            <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
