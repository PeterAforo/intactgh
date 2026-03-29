"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  Phone,
  ChevronRight,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

type Section = "orders" | "addresses" | "settings";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  shipped:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered:  "bg-green-50 text-green-700 border-green-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
};

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
  const [activeSection, setActiveSection] = useState<Section>("orders");

  // Settings form state
  const [settingsName, setSettingsName] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setSettingsName(d.user.name || "");
          setSettingsPhone(d.user.phone || "");
          fetch("/api/orders")
            .then((r) => r.json())
            .then((od) => { if (od.orders) setOrders(od.orders); })
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
      const body = isLogin ? { email, password } : { email, password, name, phone };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setUser(data.user);
      setSettingsName(data.user.name || "");
      setSettingsPhone(data.user.phone || "");
      fetch("/api/orders").then((r) => r.json()).then((od) => { if (od.orders) setOrders(od.orders); }).catch(() => {});
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOrders([]);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { toast.error("Enter your current password."); return; }
    if (newPassword.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmNewPassword) { toast.error("Passwords do not match."); return; }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success("Password changed successfully!");
        setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
      } else {
        toast.error(d.error || "Failed to change password.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: settingsName, phone: settingsPhone }),
      });
      if (res.ok) {
        const d = await res.json();
        setUser((prev: Any) => ({ ...prev, ...d.user }));
        toast.success("Profile updated!");
      } else {
        toast.error("Failed to save. Please try again.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSavingSettings(false);
    }
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
    const quickLinks = [
      { icon: Package,  label: "My Orders",  section: "orders"    as Section, count: orders.length },
      { icon: Heart,    label: "Wishlist",    href: "/wishlist" },
      { icon: MapPin,   label: "Addresses",   section: "addresses" as Section },
      { icon: Settings, label: "Settings",    section: "settings"  as Section },
    ];

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
                  {user.role === "admin" && (
                    <Badge className="mt-1 text-[10px] bg-accent/10 text-accent border-accent/20">Admin</Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} className="rounded-lg">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {quickLinks.map((link) => {
                const isActive = "section" in link && activeSection === link.section;
                const inner = (
                  <>
                    <link.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-accent"}`} />
                    <span className={`text-sm font-medium ${isActive ? "text-white" : "text-text"}`}>{link.label}</span>
                    {"count" in link && (
                      <Badge variant="outline" className={`text-xs ${isActive ? "border-white/40 text-white" : ""}`}>{link.count}</Badge>
                    )}
                  </>
                );

                if ("href" in link) {
                  return (
                    <Link key={link.label} href={link.href!}
                      className="bg-white rounded-xl border border-border p-4 flex flex-col items-center gap-2 hover:border-accent/30 transition-colors">
                      {inner}
                    </Link>
                  );
                }
                return (
                  <button key={link.label}
                    onClick={() => setActiveSection(link.section!)}
                    className={`rounded-xl border p-4 flex flex-col items-center gap-2 transition-colors ${
                      isActive ? "bg-accent border-accent" : "bg-white border-border hover:border-accent/30"
                    }`}>
                    {inner}
                  </button>
                );
              })}
            </div>

            {/* ── ORDERS SECTION ── */}
            <AnimatePresence mode="wait">
              {activeSection === "orders" && (
                <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                      <h2 className="font-bold text-text">Recent Orders</h2>
                      <span className="text-xs text-text-muted">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
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
                          <div key={order.id} className="p-5 hover:bg-surface/40 transition-colors">
                            {/* Order header row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                              <div>
                                <p className="font-mono text-sm font-bold text-accent">{order.orderNumber}</p>
                                <p className="text-xs text-text-muted mt-0.5">
                                  {new Date(order.createdAt).toLocaleDateString("en-GH", {
                                    year: "numeric", month: "long", day: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[order.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                                  {order.status}
                                </span>
                                <span className="font-bold text-text text-sm">{formatPrice(order.total)}</span>
                              </div>
                            </div>

                            {/* Product images + items */}
                            {order.items && order.items.length > 0 && (
                              <div className="space-y-2">
                                {order.items.map((item: Any) => {
                                  const img = item.product?.images?.[0]?.url;
                                  return (
                                    <div key={item.id} className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-lg border border-border bg-surface flex-shrink-0 overflow-hidden">
                                        {img ? (
                                          <Image src={img} alt={item.product?.name || "Product"} width={48} height={48} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-5 h-5 text-border" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-text truncate">{item.product?.name || "Product"}</p>
                                        <p className="text-xs text-text-muted">Qty: {item.quantity} &middot; {formatPrice(item.price)}</p>
                                      </div>
                                      <p className="text-sm font-semibold text-text shrink-0">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Delivery info if available */}
                            {order.shippingName && (
                              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-xs text-text-muted">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span>{order.shippingName} &middot; {order.shippingCity || ""} {order.shippingRegion || ""}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── ADDRESSES SECTION ── */}
              {activeSection === "addresses" && (
                <motion.div key="addresses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                      <h2 className="font-bold text-text">Saved Addresses</h2>
                    </div>
                    <div className="p-8 text-center">
                      <MapPin className="w-12 h-12 text-border mx-auto mb-3" />
                      <p className="font-medium text-text mb-1">No saved addresses</p>
                      <p className="text-sm text-text-muted mb-4">
                        Your delivery addresses are saved automatically when you place an order at checkout.
                      </p>
                      {orders.length > 0 && (
                        <div className="mt-4 space-y-2 text-left max-w-sm mx-auto">
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Addresses from your orders</p>
                          {[...new Map(orders.filter(o => o.shippingName).map(o => [o.shippingName + o.shippingCity, o])).values()].map((order: Any) => (
                            <div key={order.id} className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border">
                              <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-text">{order.shippingName}</p>
                                <p className="text-xs text-text-muted">
                                  {[order.shippingAddress, order.shippingCity, order.shippingRegion].filter(Boolean).join(", ")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Link href="/checkout">
                        <Button className="mt-4 rounded-xl" variant="outline">
                          <ChevronRight className="w-4 h-4 mr-1" /> Place an order
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── SETTINGS SECTION ── */}
              {activeSection === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                      <h2 className="font-bold text-text">Account Settings</h2>
                    </div>
                    <div className="p-6 space-y-6 max-w-md">
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <Input value={settingsName} onChange={(e) => setSettingsName(e.target.value)}
                            placeholder="Your full name" className="pl-10 rounded-lg" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <Input value={user.email} disabled className="pl-10 rounded-lg bg-surface text-text-muted cursor-not-allowed" />
                        </div>
                        <p className="text-xs text-text-muted mt-1">Email cannot be changed.</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <Input value={settingsPhone} onChange={(e) => setSettingsPhone(e.target.value)}
                            placeholder="+233..." className="pl-10 rounded-lg" />
                        </div>
                      </div>
                      <Button onClick={handleSaveSettings} disabled={savingSettings} className="rounded-xl">
                        {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>

                      {/* ── Password Change ── */}
                      <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-accent" /> Change Password
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-text block mb-1.5">Current Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                              <Input
                                type={showCurrentPw ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Your current password"
                                className="pl-10 pr-10 rounded-lg"
                              />
                              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-text block mb-1.5">New Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                              <Input
                                type={showNewPw ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                className="pl-10 pr-10 rounded-lg"
                              />
                              <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-text block mb-1.5">Confirm New Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                              <Input
                                type={showNewPw ? "text" : "password"}
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="pl-10 rounded-lg"
                              />
                            </div>
                          </div>
                          <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline" className="rounded-xl w-full">
                            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                            Update Password
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
            {isLogin ? "Sign in to access your account" : "Join Intact Ghana for the best deals"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 md:p-8 shadow-sm">
          <div className="flex mb-6 bg-surface rounded-xl p-1">
            <button onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${isLogin ? "bg-accent text-white shadow-md" : "text-text-muted"}`}>
              Sign In
            </button>
            <button onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${!isLogin ? "bg-accent text-white shadow-md" : "text-text-muted"}`}>
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="pl-10 rounded-lg" required />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="pl-10 rounded-lg" required />
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Phone Number</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233..." className="rounded-lg" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password" className="pl-10 pr-10 rounded-lg" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
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
                <a href="/reset-password" className="text-sm text-accent hover:underline">Forgot password?</a>
              </div>
            )}
            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-text-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-accent font-medium ml-1 hover:underline">
                {isLogin ? "Register" : "Sign In"}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { icon: Package, label: "My Orders",  href: "/account" },
            { icon: Heart,   label: "Wishlist",   href: "/wishlist" },
            { icon: MapPin,  label: "Addresses",  href: "/account" },
            { icon: Settings,label: "Settings",   href: "/account" },
          ].map((link) => (
            <Link key={link.label} href={link.href}
              className="bg-white rounded-xl border border-border p-3 flex items-center gap-2 hover:border-accent/30 transition-colors">
              <link.icon className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-text">{link.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
