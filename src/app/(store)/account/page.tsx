"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Package,
  Heart,
  MapPin,
  Settings,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function AccountPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<Any>(null);
  const [orders, setOrders] = useState<Any[]>([]);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          fetch("/api/orders")
            .then((r) => r.json())
            .then((od) => {
              if (od.orders) setOrders(od.orders);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email, password }
        : { email, password, name, phone };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setUser(data.user);
      fetch("/api/orders")
        .then((r) => r.json())
        .then((od) => {
          if (od.orders) setOrders(od.orders);
        })
        .catch(() => {});
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    setUser(null);
    setOrders([]);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // ====== LOGGED IN VIEW ======
  if (user) {
    return (
      <div className="min-h-[70vh] bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Profile Header */}
            <div className="bg-white rounded-2xl border border-border p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
                  <User className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-text">{user.name || user.email}</h1>
                  <p className="text-text-muted text-sm">{user.email}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} className="rounded-lg">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: Package, label: "My Orders", count: orders.length },
                { icon: Heart, label: "Wishlist", href: "/wishlist" },
                { icon: MapPin, label: "Addresses", href: "#" },
                { icon: Settings, label: "Settings", href: "#" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href || "#"}
                  className="bg-white rounded-xl border border-border p-4 flex flex-col items-center gap-2 hover:border-accent/30 transition-colors"
                >
                  <link.icon className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium text-text">{link.label}</span>
                  {"count" in link && (
                    <Badge variant="outline" className="text-xs">{link.count}</Badge>
                  )}
                </Link>
              ))}
            </div>

            {/* Order History */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-bold text-text">Recent Orders</h2>
              </div>
              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-border mx-auto mb-3" />
                  <p className="text-text-muted">No orders yet.</p>
                  <Link href="/shop">
                    <Button className="mt-4 rounded-xl">Start Shopping</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map((order: Any) => (
                    <div key={order.id} className="px-6 py-4 hover:bg-surface/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-mono text-sm font-bold text-accent">{order.orderNumber}</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("en-GH", {
                              year: "numeric", month: "short", day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={order.status === "delivered" ? "default" : "outline"}
                            className="text-xs capitalize"
                          >
                            {order.status}
                          </Badge>
                          <span className="font-bold text-text">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                      {order.items && (
                        <p className="text-xs text-text-muted mt-1.5">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                          {order.items.slice(0, 2).map((item: Any) => (
                            <span key={item.id}> &middot; {item.product?.name || "Product"}</span>
                          ))}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ====== LOGIN / REGISTER VIEW ======
  return (
    <div className="min-h-[70vh] bg-surface flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {isLogin
              ? "Sign in to access your account"
              : "Join Intact Ghana for the best deals"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 md:p-8 shadow-sm">
          {/* Toggle Tabs */}
          <div className="flex mb-6 bg-surface rounded-xl p-1">
            <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isLogin ? "bg-accent text-white shadow-md" : "text-text-muted"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isLogin ? "bg-accent text-white shadow-md" : "text-text-muted"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="pl-10 rounded-lg"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10 rounded-lg"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Phone Number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233..."
                  className="rounded-lg"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="pl-10 pr-10 rounded-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border text-accent focus:ring-accent" />
                  <span className="text-sm text-text-light">Remember me</span>
                </label>
                <a href="/reset-password" className="text-sm text-accent hover:underline">
                  Forgot password?
                </a>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-text-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-accent font-medium ml-1 hover:underline"
              >
                {isLogin ? "Register" : "Sign In"}
              </button>
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { icon: Package, label: "My Orders", href: "/orders" },
            { icon: Heart, label: "Wishlist", href: "/wishlist" },
            { icon: MapPin, label: "Addresses", href: "/addresses" },
            { icon: Settings, label: "Settings", href: "/settings" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="bg-white rounded-xl border border-border p-3 flex items-center gap-2 hover:border-accent/30 transition-colors"
            >
              <link.icon className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-text">{link.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
