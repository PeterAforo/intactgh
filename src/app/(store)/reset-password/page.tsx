"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!email) { toast.error("Email is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("If that email exists, a reset link has been sent.");
      // In dev mode, auto-fill token if returned
      if (data.resetToken) setToken(data.resetToken);
      setStep("reset");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to request reset";
      toast.error(msg);
    }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!token) { toast.error("Reset token is required"); return; }
    if (!newPassword || newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Password reset successfully!");
      setStep("done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to reset password";
      toast.error(msg);
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border p-8 w-full max-w-md"
      >
        {step === "request" && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-text">Forgot Password?</h1>
              <p className="text-text-muted text-sm mt-2">Enter your email and we&apos;ll send you a reset link.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Email Address</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="rounded-lg" />
              </div>
              <Button onClick={handleRequest} disabled={loading} className="w-full rounded-lg">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Reset Link
              </Button>
              <Link href="/account" className="text-sm text-accent hover:underline flex items-center gap-1 justify-center mt-3">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </>
        )}

        {step === "reset" && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-text">Reset Password</h1>
              <p className="text-text-muted text-sm mt-2">Enter your new password below.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Reset Token</label>
                <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste your reset token" className="rounded-lg font-mono text-xs" />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">New Password</label>
                <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Min 8 characters" className="rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Confirm Password</label>
                <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Confirm new password" className="rounded-lg" />
              </div>
              <Button onClick={handleReset} disabled={loading} className="w-full rounded-lg">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Password Reset!</h1>
            <p className="text-text-muted text-sm mb-6">Your password has been changed. You can now log in with your new password.</p>
            <Link href="/account">
              <Button className="rounded-lg w-full">Go to Login</Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
