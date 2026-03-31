"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      setMessage("No verification token provided.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  return (
    <div className="min-h-[70vh] bg-surface flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border shadow-lg p-8 max-w-md w-full text-center"
      >
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-text mb-2">Verifying your email...</h1>
            <p className="text-text-muted text-sm">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-text mb-2">Email Verified!</h1>
            <p className="text-text-muted text-sm mb-6">{message}</p>
            <Link href="/account">
              <Button size="lg" className="rounded-xl w-full">
                Go to My Account
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-text mb-2">Verification Failed</h1>
            <p className="text-text-muted text-sm mb-6">{message}</p>
            <Link href="/account">
              <Button size="lg" variant="outline" className="rounded-xl w-full">
                Back to Sign In
              </Button>
            </Link>
          </>
        )}

        {status === "no-token" && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-text mb-2">No Token Provided</h1>
            <p className="text-text-muted text-sm mb-6">
              Please use the verification link from your email.
            </p>
            <Link href="/account">
              <Button size="lg" variant="outline" className="rounded-xl w-full">
                Back to Sign In
              </Button>
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
