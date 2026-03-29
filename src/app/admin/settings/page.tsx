"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Globe, Mail, Phone, MapPin, Store, Palette, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [storeName, setStoreName] = useState("Intact Ghana");
  const [tagline, setTagline] = useState("Racing with Technology");
  const [email, setEmail] = useState("info@intactghana.com");
  const [phone, setPhone] = useState("+233 543 645 126");
  const [address, setAddress] = useState("East Legon, A&C Mall, Greater Accra, Ghana");
  const [currency, setCurrency] = useState("GHS");
  const [freeShippingMin, setFreeShippingMin] = useState("3000");

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      if (d.settings) {
        const s = d.settings;
        if (s.storeName) setStoreName(s.storeName);
        if (s.tagline) setTagline(s.tagline);
        if (s.email) setEmail(s.email);
        if (s.phone) setPhone(s.phone);
        if (s.address) setAddress(s.address);
        if (s.currency) setCurrency(s.currency);
        if (s.freeShippingMin) setFreeShippingMin(s.freeShippingMin);
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, tagline, email, phone, address, currency, freeShippingMin }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved successfully");
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Settings</h1>
          <p className="text-text-muted text-sm mt-1">Manage your store settings and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-lg">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* General */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-text">General Settings</h2>
            <p className="text-xs text-text-muted">Basic store information</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Store Name</label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="rounded-lg" />
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Tagline</label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="rounded-lg" />
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent"
            >
              <option value="GHS">Ghana Cedi (GH₵)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Free Shipping Minimum (GH₵)</label>
            <Input
              type="number"
              value={freeShippingMin}
              onChange={(e) => setFreeShippingMin(e.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-info" />
          </div>
          <div>
            <h2 className="font-bold text-text">Contact Information</h2>
            <p className="text-xs text-text-muted">How customers can reach you</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">
              <Mail className="w-3.5 h-3.5 inline mr-1" />Email
            </label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg" />
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1" />Phone
            </label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-text block mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />Address
            </label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-lg" />
          </div>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
            <Palette className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="font-bold text-text">Appearance</h2>
            <p className="text-xs text-text-muted">Customize the look and feel of your store</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Primary Color", value: "#0a0a0a" },
            { label: "Accent Color", value: "#0052cc" },
            { label: "Info/Highlight", value: "#0052cc" },
            { label: "Success Color", value: "#10b981" },
          ].map((color) => (
            <div key={color.label}>
              <label className="text-sm font-medium text-text block mb-1.5">{color.label}</label>
              <div className="flex items-center gap-2">
                <input type="color" defaultValue={color.value} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <Input defaultValue={color.value} className="rounded-lg font-mono text-xs" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="font-bold text-text">Notifications</h2>
            <p className="text-xs text-text-muted">Configure email and notification preferences</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: "New order notifications", desc: "Get notified when a new order is placed", checked: true },
            { label: "Low stock alerts", desc: "Alert when product stock falls below threshold", checked: true },
            { label: "Customer registration", desc: "Notify when a new customer registers", checked: false },
            { label: "Newsletter subscriptions", desc: "Notify when someone subscribes to newsletter", checked: false },
          ].map((item) => (
            <label key={item.label} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-surface transition-colors">
              <input type="checkbox" defaultChecked={item.checked} className="rounded border-border text-accent focus:ring-accent mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text">{item.label}</p>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
