"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const CONSENT_KEY = "ig_cookie_consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Show banner after a brief delay
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-primary text-white rounded-2xl shadow-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">We use cookies</p>
                <p className="text-xs text-white/60 leading-relaxed">
                  We use cookies and similar technologies to improve your browsing experience, analyze site traffic, and personalize content.
                  By clicking &quot;Accept&quot;, you consent to our use of cookies.{" "}
                  <Link href="/pages/privacy-policy" className="text-accent hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <Button
                onClick={decline}
                variant="outline"
                size="sm"
                className="rounded-xl border-white/20 text-white hover:bg-white/10 flex-1 md:flex-none"
              >
                Decline
              </Button>
              <Button
                onClick={accept}
                size="sm"
                className="rounded-xl flex-1 md:flex-none"
              >
                Accept
              </Button>
              <button onClick={decline} className="text-white/40 hover:text-white ml-1 md:hidden">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
