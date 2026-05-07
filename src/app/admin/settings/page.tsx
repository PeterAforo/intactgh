"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Globe, Mail, Phone, MapPin, Store, Palette, Bell, Loader2, Plus, X } from "lucide-react";
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
  const [notificationEmails, setNotificationEmails] = useState<string[]>(["sales@intactghana.com"]);
  const [notificationSmsNumbers, setNotificationSmsNumbers] = useState<string[]>([]);
  const [mnotifySenderId, setMnotifySenderId] = useState("IntactGH");
  const [primaryColor, setPrimaryColor] = useState("#0a0a0a");
  const [accentColor, setAccentColor] = useState("#0052cc");
  const [infoColor, setInfoColor] = useState("#0052cc");
  const [successColor, setSuccessColor] = useState("#10b981");

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
        if (s.notification_emails) setNotificationEmails(s.notification_emails.split(",").map((e: string) => e.trim()).filter(Boolean));
        if (s.notification_sms_numbers) setNotificationSmsNumbers(s.notification_sms_numbers.split(",").map((n: string) => n.trim()).filter(Boolean));
        if (s.mnotify_sender_id) setMnotifySenderId(s.mnotify_sender_id);
        if (s.primaryColor) setPrimaryColor(s.primaryColor);
        if (s.accentColor) setAccentColor(s.accentColor);
        if (s.infoColor) setInfoColor(s.infoColor);
        if (s.successColor) setSuccessColor(s.successColor);
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, tagline, email, phone, address, currency, freeShippingMin, notification_emails: notificationEmails.filter(Boolean).join(","), notification_sms_numbers: notificationSmsNumbers.filter(Boolean).join(","), mnotify_sender_id: mnotifySenderId, primaryColor, accentColor, infoColor, successColor }),
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
            { label: "Primary Color", value: primaryColor, set: setPrimaryColor },
            { label: "Accent Color", value: accentColor, set: setAccentColor },
            { label: "Info/Highlight", value: infoColor, set: setInfoColor },
            { label: "Success Color", value: successColor, set: setSuccessColor },
          ].map((color) => (
            <div key={color.label}>
              <label className="text-sm font-medium text-text block mb-1.5">{color.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color.value}
                  onChange={(e) => color.set(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  value={color.value}
                  onChange={(e) => color.set(e.target.value)}
                  className="rounded-lg font-mono text-xs"
                />
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
            <h2 className="font-bold text-text">Order Notifications</h2>
            <p className="text-xs text-text-muted">Configure where new order alerts are sent (email + SMS)</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Multiple Notification Emails */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-text block mb-1.5">
              <Mail className="w-3.5 h-3.5 inline mr-1" />Order Notification Emails
            </label>
            <div className="space-y-2">
              {notificationEmails.map((emailVal, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={emailVal}
                    onChange={(e) => {
                      const updated = [...notificationEmails];
                      updated[idx] = e.target.value;
                      setNotificationEmails(updated);
                    }}
                    placeholder="sales@intactghana.com"
                    className="rounded-lg flex-1"
                  />
                  {notificationEmails.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setNotificationEmails(notificationEmails.filter((_, i) => i !== idx))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setNotificationEmails([...notificationEmails, ""])}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Email
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-2">All listed emails receive new order alerts.</p>
          </div>

          {/* Multiple SMS Numbers */}
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1" />Intact Ghana SMS Numbers
            </label>
            <div className="space-y-2">
              {notificationSmsNumbers.length === 0 && (
                <p className="text-xs text-text-muted italic">No SMS numbers configured</p>
              )}
              {notificationSmsNumbers.map((num, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={num}
                    onChange={(e) => {
                      const updated = [...notificationSmsNumbers];
                      updated[idx] = e.target.value;
                      setNotificationSmsNumbers(updated);
                    }}
                    placeholder="+233543645126"
                    className="rounded-lg flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setNotificationSmsNumbers(notificationSmsNumbers.filter((_, i) => i !== idx))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setNotificationSmsNumbers([...notificationSmsNumbers, ""])}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Number
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-2">All listed numbers receive SMS alerts via mNotify.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-text block mb-1.5">mNotify Sender ID</label>
            <Input
              value={mnotifySenderId}
              onChange={(e) => setMnotifySenderId(e.target.value)}
              placeholder="IntactGH"
              maxLength={11}
              className="rounded-lg"
            />
            <p className="text-xs text-text-muted mt-1">Max 11 characters. Must be registered with mNotify.</p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-text-muted">
            <strong>Note:</strong> Email notifications require <code className="bg-surface px-1 rounded">SMTP_HOST</code>, <code className="bg-surface px-1 rounded">SMTP_USER</code> and <code className="bg-surface px-1 rounded">SMTP_PASS</code> in your .env.
            SMS notifications require <code className="bg-surface px-1 rounded">MNOTIFY_API_KEY</code> in your .env.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
