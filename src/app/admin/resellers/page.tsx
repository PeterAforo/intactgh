"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Search, Handshake, CheckCircle, XCircle, Clock, Eye, Edit, ExternalLink,
  ShoppingCart, Users, Wallet, KeyRound, Upload, Link2, Loader2, X,
  Ban, Trash2, UserCheck, RotateCcw, Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

type ResellerUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  emailVerified: boolean;
  loginAttempts: number;
  lockedUntil: string | null;
};

type Reseller = {
  id: string;
  storeName: string;
  storeSlug: string;
  bio: string | null;
  status: string;
  picture: string;
  phone: string;
  email: string;
  nationalIdType: string;
  nationalIdNumber: string;
  nationalIdImage: string;
  commissionBalance: number;
  createdAt: string;
  user: ResellerUser;
  _count: { orders: number; clients: number; invoices: number; payouts: number; promotions: number; referrals: number };
  activityCount: number;
};

type ResellerForm = {
  user: { name: string; email: string; phone: string };
  reseller: {
    storeName: string;
    storeSlug: string;
    bio: string;
    phone: string;
    email: string;
    picture: string;
    nationalIdType: string;
    nationalIdNumber: string;
    nationalIdImage: string;
  };
};

const ID_TYPES = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "voter_id", label: "Voter ID" },
  { value: "passport", label: "Passport" },
  { value: "nhis", label: "NHIS Card" },
  { value: "driver_license", label: "Driver's License" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-700",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  approved: <CheckCircle className="w-3.5 h-3.5" />,
  rejected: <XCircle className="w-3.5 h-3.5" />,
  suspended: <Ban className="w-3.5 h-3.5" />,
};

const emptyForm: ResellerForm = {
  user: { name: "", email: "", phone: "" },
  reseller: {
    storeName: "",
    storeSlug: "",
    bio: "",
    phone: "",
    email: "",
    picture: "",
    nationalIdType: "ghana_card",
    nationalIdNumber: "",
    nationalIdImage: "",
  },
};

function resellerToForm(reseller: Reseller): ResellerForm {
  return {
    user: {
      name: reseller.user.name || "",
      email: reseller.user.email,
      phone: reseller.user.phone || "",
    },
    reseller: {
      storeName: reseller.storeName,
      storeSlug: reseller.storeSlug,
      bio: reseller.bio || "",
      phone: reseller.phone,
      email: reseller.email,
      picture: reseller.picture,
      nationalIdType: reseller.nationalIdType,
      nationalIdNumber: reseller.nationalIdNumber,
      nationalIdImage: reseller.nationalIdImage,
    },
  };
}

function isLocked(user: ResellerUser) {
  return !!user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now();
}

function ResellerImageField({
  label,
  value,
  onChange,
  uploading,
  onFile,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  uploading: boolean;
  onFile: (file: File) => void | Promise<void>;
}) {
  const [useUrl, setUseUrl] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="md:col-span-2">
      <label className="text-sm font-medium text-text block mb-1.5">{label} <span className="text-red-500">*</span></label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-border bg-surface mb-2">
          <div className="relative w-full h-40">
            <Image src={value} alt={label} fill unoptimized className="object-contain" />
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-3 py-2 bg-surface text-xs text-text-muted truncate">{value}</div>
        </div>
      ) : null}

      {!value || useUrl ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." className="rounded-lg" />
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-accent/50 hover:bg-surface transition-colors"
        >
          {uploading ? <Loader2 className="w-7 h-7 text-accent animate-spin" /> : <Upload className="w-7 h-7 text-text-muted" />}
          <p className="text-sm text-text-muted">{uploading ? "Uploading..." : "Click to upload image"}</p>
          <p className="text-xs text-text-muted/60">PNG, JPG, WebP up to 10 MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
              e.target.value = "";
            }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setUseUrl(!useUrl)}
        className="text-xs text-accent hover:underline flex items-center gap-1 mt-2"
      >
        {useUrl ? <><Upload className="w-3 h-3" /> Upload image instead</> : <><Link2 className="w-3 h-3" /> Use image URL instead</>}
      </button>
    </div>
  );
}

export default function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ResellerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [resettingLogin, setResettingLogin] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<"picture" | "nationalIdImage" | "">("");

  const fetchResellers = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/admin/resellers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load resellers");
      setResellers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch resellers:", error);
      toast.error("Failed to load resellers");
      setResellers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResellers(); }, [fetchResellers]);

  const openView = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setEditing(false);
  };

  const openEdit = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setForm(resellerToForm(reseller));
    setEditing(true);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/resellers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setResellers((prev) => prev.map((r) => (r.id === id ? data : r)));
      setSelectedReseller((prev) => (prev?.id === id ? data : prev));
      toast.success(`Reseller ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const uploadImage = async (file: File, field: "picture" | "nationalIdImage") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }

    setUploadingImage(field);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "intactconnect/resellers");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((prev) => ({
        ...prev,
        reseller: { ...prev.reseller, [field]: data.url },
      }));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingImage("");
    }
  };

  const handleSave = async () => {
    if (!selectedReseller) return;
    if (!form.user.name.trim() || !form.user.email.trim()) {
      toast.error("Login name and email are required");
      return;
    }
    if (!form.reseller.storeName.trim() || !form.reseller.storeSlug.trim()) {
      toast.error("Store name and slug are required");
      return;
    }
    if (!form.reseller.email.trim() || !form.reseller.phone.trim()) {
      toast.error("Store contact email and phone are required");
      return;
    }
    if (!form.reseller.picture || !form.reseller.nationalIdNumber.trim() || !form.reseller.nationalIdImage) {
      toast.error("Profile photo, ID number, and ID image are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/resellers/${selectedReseller.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            name: form.user.name.trim(),
            email: form.user.email.trim().toLowerCase(),
            phone: form.user.phone.trim() || null,
          },
          reseller: {
            storeName: form.reseller.storeName.trim(),
            storeSlug: form.reseller.storeSlug.trim().toLowerCase(),
            bio: form.reseller.bio.trim() || null,
            phone: form.reseller.phone.trim(),
            email: form.reseller.email.trim().toLowerCase(),
            picture: form.reseller.picture.trim(),
            nationalIdType: form.reseller.nationalIdType,
            nationalIdNumber: form.reseller.nationalIdNumber.trim(),
            nationalIdImage: form.reseller.nationalIdImage.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update reseller");
      setResellers((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      setSelectedReseller(data);
      setEditing(false);
      toast.success("Reseller updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update reseller");
    } finally {
      setSaving(false);
    }
  };

  const handleResetLogin = async () => {
    if (!selectedReseller) return;
    const email = selectedReseller.user.email;
    if (!confirm(`Unlock ${selectedReseller.user.name || selectedReseller.storeName}'s login and email a password reset link to ${email}?`)) return;

    setResettingLogin(true);
    try {
      const res = await fetch(`/api/admin/resellers/${selectedReseller.id}/reset-login`, { method: "POST" });
      const data = await res.json();
      if (!res.ok && !data.unlocked) throw new Error(data.error || "Failed to reset login");

      setSelectedReseller((prev) => prev ? {
        ...prev,
        user: { ...prev.user, loginAttempts: 0, lockedUntil: null },
      } : prev);
      setResellers((prev) => prev.map((r) => r.id === selectedReseller.id ? {
        ...r,
        user: { ...r.user, loginAttempts: 0, lockedUntil: null },
      } : r));
      await fetchResellers(false);

      if (data.emailSent) {
        toast.success("Login unlocked — reset link sent");
      } else {
        toast.error("Login unlocked, but the reset email could not be sent");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset login");
    } finally {
      setResettingLogin(false);
    }
  };

  const activateReseller = async (id: string) => {
    setActivatingId(id);
    try {
      const res = await fetch(`/api/admin/resellers/${id}/activate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to activate reseller");
      setResellers((prev) => prev.map((r) => (r.id === id ? { ...data, activityCount: r.activityCount } : r)));
      setSelectedReseller((prev) => (prev?.id === id ? { ...data, activityCount: prev.activityCount } : prev));
      toast.success("Reseller fully activated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to activate reseller");
    } finally {
      setActivatingId(null);
    }
  };

  const handleSetPassword = async () => {
    if (!selectedReseller) return;
    const email = selectedReseller.user.email;
    if (!confirm(`Generate a new temporary password and email it to ${email}? Their current password will stop working immediately.`)) return;

    setSettingPassword(true);
    try {
      const res = await fetch(`/api/admin/resellers/${selectedReseller.id}/set-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok && !data.updated) throw new Error(data.error || "Failed to set password");
      if (data.emailSent) {
        toast.success("New password generated and emailed");
      } else {
        toast.error("Password updated, but the credentials email could not be sent");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set password");
    } finally {
      setSettingPassword(false);
    }
  };

  const formatActivity = (activity: Record<string, number>) =>
    Object.entries(activity)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${n} ${k}`)
      .join(", ");

  const handleDeleteReseller = async (target: Reseller) => {
    if ((target.activityCount ?? 0) > 0) {
      toast.error("This reseller has activity on the platform and cannot be deleted");
      return;
    }
    const label = target.user.name || target.storeName;
    if (!confirm(`Permanently delete ${label}'s account and store? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/resellers/${target.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.status === 409) {
        toast.error(`Cannot delete — has activity: ${formatActivity(data.activity || {})}`);
        await fetchResellers(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to delete reseller");
      setResellers((prev) => prev.filter((r) => r.id !== target.id));
      setSelectedReseller((prev) => (prev?.id === target.id ? null : prev));
      toast.success("Reseller account deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete reseller");
    } finally {
      setDeleting(false);
    }
  };

  const filteredResellers = resellers.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [
      r.storeName,
      r.storeSlug,
      r.email,
      r.phone,
      r.user.name,
      r.user.email,
      r.user.phone,
    ].some((value) => value?.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: resellers.length,
    pending: resellers.filter((r) => r.status === "pending").length,
    approved: resellers.filter((r) => r.status === "approved").length,
    rejected: resellers.filter((r) => r.status === "rejected").length,
    suspended: resellers.filter((r) => r.status === "suspended").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Resellers</h1>
        <p className="text-text-muted">Manage IntactConnect reseller accounts</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Resellers", value: stats.total, icon: Handshake, color: "bg-accent" },
          { label: "Pending Approval", value: stats.pending, icon: Clock, color: "bg-yellow-500" },
          { label: "Approved", value: stats.approved, icon: CheckCircle, color: "bg-green-600" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, color: "bg-red-600" },
          { label: "Suspended", value: stats.suspended, icon: Ban, color: "bg-orange-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                  <p className="text-3xl font-bold text-text mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-4 border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {(["all", "pending", "approved", "rejected", "suspended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${filter === s ? "bg-accent text-white" : "bg-surface text-text-muted hover:bg-border"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search store, login, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading resellers...</div>
        ) : filteredResellers.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No resellers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">Reseller</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">Store</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">Orders</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">Balance</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResellers.map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {r.picture ? (
                          <Image src={r.picture} alt="" width={40} height={40} unoptimized className="w-10 h-10 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface border border-border" />
                        )}
                        <div>
                          <p className="font-medium text-text">{r.user.name || "No name"}</p>
                          <p className="text-xs text-text-muted">{r.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-text">{r.storeName}</p>
                      <p className="text-xs text-text-muted">/{r.storeSlug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}`}>
                        {STATUS_ICONS[r.status]} {r.status}
                      </span>
                      {isLocked(r.user) && <span className="ml-2 text-xs text-red-600 font-medium">Locked</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-text">{r._count.orders}</td>
                    <td className="px-6 py-4 text-sm font-medium text-text">GH₵{r.commissionBalance.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openView(r)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent" title="Edit Reseller">
                          <Edit className="w-4 h-4" />
                        </button>
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => activateReseller(r.id)} disabled={activatingId === r.id} className="p-1.5 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Fully Activate">
                              {activatingId === r.id ? <Loader2 className="w-4 h-4 animate-spin text-green-600" /> : <UserCheck className="w-4 h-4 text-green-600" />}
                            </button>
                            <button onClick={() => updateStatus(r.id, "approved")} disabled={updatingId === r.id} className="p-1.5 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Approve">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                            <button onClick={() => updateStatus(r.id, "rejected")} disabled={updatingId === r.id} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Reject">
                              <XCircle className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                        {r.status === "rejected" && (
                          <>
                            <button onClick={() => activateReseller(r.id)} disabled={activatingId === r.id} className="p-1.5 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Fully Activate">
                              {activatingId === r.id ? <Loader2 className="w-4 h-4 animate-spin text-green-600" /> : <UserCheck className="w-4 h-4 text-green-600" />}
                            </button>
                            <button onClick={() => updateStatus(r.id, "approved")} disabled={updatingId === r.id} className="p-1.5 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Re-approve">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <button onClick={() => updateStatus(r.id, "suspended")} disabled={updatingId === r.id} className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50" title="Suspend">
                            <Ban className="w-4 h-4 text-orange-600" />
                          </button>
                        )}
                        {r.status === "suspended" && (
                          <button onClick={() => updateStatus(r.id, "approved")} disabled={updatingId === r.id} className="p-1.5 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Unsuspend">
                            <RotateCcw className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReseller(r)}
                          disabled={deleting || updatingId === r.id || activatingId === r.id || r.activityCount > 0}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${r.activityCount > 0 ? "text-text-muted/40 cursor-not-allowed" : "hover:bg-red-50 text-red-600"}`}
                          title={r.activityCount > 0 ? "Cannot delete — reseller has platform activity" : "Delete Account"}
                        >
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReseller && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => !saving && !resettingLogin && !settingPassword && !deleting && setSelectedReseller(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[720px] sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-text">{editing ? "Edit Reseller" : "Reseller Details"}</h2>
                  <p className="text-sm text-text-muted">{selectedReseller.storeName} · /{selectedReseller.storeSlug}</p>
                </div>
                <button onClick={() => setSelectedReseller(null)} disabled={saving || resettingLogin || settingPassword || deleting} className="text-text-muted hover:text-text text-xl disabled:opacity-50">&times;</button>
              </div>

              {editing ? (
                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Login Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Full Name <span className="text-red-500">*</span></label>
                        <Input value={form.user.name} onChange={(e) => setForm({ ...form, user: { ...form.user, name: e.target.value } })} className="rounded-lg" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Login Email <span className="text-red-500">*</span></label>
                        <Input type="email" value={form.user.email} onChange={(e) => setForm({ ...form, user: { ...form.user, email: e.target.value } })} className="rounded-lg" />
                        <p className="text-xs text-text-muted mt-1">Used to sign in on Intact Ghana and IntactConnect.</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Login Phone</label>
                        <Input value={form.user.phone} onChange={(e) => setForm({ ...form, user: { ...form.user, phone: e.target.value } })} placeholder="+233..." className="rounded-lg" />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Store Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Store Name <span className="text-red-500">*</span></label>
                        <Input value={form.reseller.storeName} onChange={(e) => setForm({ ...form, reseller: { ...form.reseller, storeName: e.target.value } })} className="rounded-lg" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Store Slug <span className="text-red-500">*</span></label>
                        <Input value={form.reseller.storeSlug} onChange={(e) => setForm({ ...form, reseller: { ...form.reseller, storeSlug: e.target.value } })} className="rounded-lg font-mono" />
                        <p className="text-xs text-text-muted mt-1">Changing this changes the public store URL.</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Store Contact Email <span className="text-red-500">*</span></label>
                        <Input type="email" value={form.reseller.email} onChange={(e) => setForm({ ...form, reseller: { ...form.reseller, email: e.target.value } })} className="rounded-lg" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Store Contact Phone <span className="text-red-500">*</span></label>
                        <Input value={form.reseller.phone} onChange={(e) => setForm({ ...form, reseller: { ...form.reseller, phone: e.target.value } })} className="rounded-lg" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-text block mb-1.5">Bio</label>
                        <textarea
                          value={form.reseller.bio}
                          onChange={(e) => setForm({ ...form, reseller: { ...form.reseller, bio: e.target.value } })}
                          rows={3}
                          className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent resize-none"
                        />
                      </div>
                      <ResellerImageField
                        label="Profile Photo"
                        value={form.reseller.picture}
                        onChange={(url) => setForm({ ...form, reseller: { ...form.reseller, picture: url } })}
                        uploading={uploadingImage === "picture"}
                        onFile={(file) => uploadImage(file, "picture")}
                      />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">ID Verification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">ID Type <span className="text-red-500">*</span></label>
                        <select
                          value={form.reseller.nationalIdType}
                          onChange={(e) => setForm({ ...form, reseller: { ...form.reseller, nationalIdType: e.target.value } })}
                          className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent"
                        >
                          {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">ID Number <span className="text-red-500">*</span></label>
                        <Input value={form.reseller.nationalIdNumber} onChange={(e) => setForm({ ...form, reseller: { ...form.reseller, nationalIdNumber: e.target.value } })} placeholder="GHA-XXXXXXXXX-X" className="rounded-lg" />
                      </div>
                      <ResellerImageField
                        label="National ID Image"
                        value={form.reseller.nationalIdImage}
                        onChange={(url) => setForm({ ...form, reseller: { ...form.reseller, nationalIdImage: url } })}
                        uploading={uploadingImage === "nationalIdImage"}
                        onFile={(file) => uploadImage(file, "nationalIdImage")}
                      />
                    </div>
                  </section>

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <button
                      onClick={handleSave}
                      disabled={saving || uploadingImage !== ""}
                      className="flex-1 bg-accent text-white py-2.5 rounded-lg font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                    <button
                      onClick={() => { setEditing(false); setForm(resellerToForm(selectedReseller)); }}
                      disabled={saving}
                      className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-surface transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    {selectedReseller.picture ? (
                      <Image src={selectedReseller.picture} alt="" width={64} height={64} unoptimized className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-surface border-2 border-border" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold">{selectedReseller.user.name || "No name"}</h3>
                      <p className="text-text-muted">{selectedReseller.storeName}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize mt-1 ${STATUS_COLORS[selectedReseller.status] || "bg-gray-100 text-gray-700"}`}>
                        {STATUS_ICONS[selectedReseller.status]} {selectedReseller.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface rounded-lg p-3">
                      <p className="text-xs text-text-muted mb-1">Login Email</p>
                      <p className="text-sm font-medium text-text break-all">{selectedReseller.user.email}</p>
                    </div>
                    <div className="bg-surface rounded-lg p-3">
                      <p className="text-xs text-text-muted mb-1">Login Phone</p>
                      <p className="text-sm font-medium text-text">{selectedReseller.user.phone || "—"}</p>
                    </div>
                    <div className="bg-surface rounded-lg p-3">
                      <p className="text-xs text-text-muted mb-1">Store Email</p>
                      <p className="text-sm font-medium text-text break-all">{selectedReseller.email}</p>
                    </div>
                    <div className="bg-surface rounded-lg p-3">
                      <p className="text-xs text-text-muted mb-1">Store Phone</p>
                      <p className="text-sm font-medium text-text">{selectedReseller.phone}</p>
                    </div>
                  </div>

                  <div className="bg-surface rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-text">Login Access</h3>
                      <div className="flex gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${selectedReseller.user.emailVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {selectedReseller.user.emailVerified ? "Email verified" : "Email unverified"}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${isLocked(selectedReseller.user) ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {isLocked(selectedReseller.user) ? "Locked" : "Not locked"}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-text-muted">Failed Attempts</p>
                        <p className="font-medium text-text">{selectedReseller.user.loginAttempts}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Locked Until</p>
                        <p className="font-medium text-text">{selectedReseller.user.lockedUntil ? new Date(selectedReseller.user.lockedUntil).toLocaleString() : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Joined</p>
                        <p className="font-medium text-text">{new Date(selectedReseller.user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-muted mb-1">ID Type</p>
                      <p className="text-sm font-medium text-text capitalize">{selectedReseller.nationalIdType.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">ID Number</p>
                      <p className="text-sm font-medium text-text">{selectedReseller.nationalIdNumber}</p>
                    </div>
                  </div>

                  {selectedReseller.bio && (
                    <div>
                      <p className="text-xs text-text-muted mb-1">Bio</p>
                      <p className="text-sm text-text whitespace-pre-wrap">{selectedReseller.bio}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-text-muted mb-2">National ID Image</p>
                    <div className="relative w-full h-56 rounded-lg border border-border bg-surface overflow-hidden">
                      {selectedReseller.nationalIdImage ? (
                        <Image src={selectedReseller.nationalIdImage} alt="National ID" fill unoptimized className="object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">No ID image</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <ShoppingCart className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-700">{selectedReseller._count.orders}</p>
                      <p className="text-xs text-blue-600">Orders</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-purple-700">{selectedReseller._count.clients}</p>
                      <p className="text-xs text-purple-600">Clients</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <Wallet className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-700">GH₵{selectedReseller.commissionBalance.toFixed(2)}</p>
                      <p className="text-xs text-green-600">Balance</p>
                    </div>
                  </div>

                  {(selectedReseller.activityCount ?? 0) > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                      This reseller has platform activity ({selectedReseller.activityCount} records) and cannot be deleted.
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    <button
                      onClick={() => openEdit(selectedReseller)}
                      className="flex-1 min-w-[140px] bg-accent text-white py-2.5 rounded-lg font-medium text-sm hover:bg-accent/90 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" /> Edit Profile
                    </button>
                    {selectedReseller.status === "pending" && (
                      <button
                        onClick={() => activateReseller(selectedReseller.id)}
                        disabled={activatingId === selectedReseller.id}
                        className="flex-1 min-w-[140px] bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      >
                        {activatingId === selectedReseller.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        Fully Activate
                      </button>
                    )}
                    {selectedReseller.status === "approved" && (
                      <button
                        onClick={() => updateStatus(selectedReseller.id, "suspended")}
                        disabled={updatingId === selectedReseller.id}
                        className="flex-1 min-w-[120px] bg-orange-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      >
                        {updatingId === selectedReseller.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                        Suspend
                      </button>
                    )}
                    {selectedReseller.status === "suspended" && (
                      <button
                        onClick={() => updateStatus(selectedReseller.id, "approved")}
                        disabled={updatingId === selectedReseller.id}
                        className="flex-1 min-w-[120px] bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      >
                        {updatingId === selectedReseller.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Unsuspend
                      </button>
                    )}
                    {selectedReseller.status === "rejected" && (
                      <button
                        onClick={() => activateReseller(selectedReseller.id)}
                        disabled={activatingId === selectedReseller.id}
                        className="flex-1 min-w-[140px] bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      >
                        {activatingId === selectedReseller.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        Fully Activate
                      </button>
                    )}
                    <button
                      onClick={handleSetPassword}
                      disabled={settingPassword}
                      className="flex-1 min-w-[180px] border border-border text-text py-2.5 rounded-lg font-medium text-sm hover:bg-surface transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      {settingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Email New Password
                    </button>
                    <button
                      onClick={handleResetLogin}
                      disabled={resettingLogin}
                      className="flex-1 min-w-[180px] border border-border text-text py-2.5 rounded-lg font-medium text-sm hover:bg-surface transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      {resettingLogin ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      Unlock & Send Reset
                    </button>
                    {selectedReseller.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(selectedReseller.id, "approved")}
                          disabled={updatingId === selectedReseller.id}
                          className="flex-1 min-w-[120px] bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(selectedReseller.id, "rejected")}
                          disabled={updatingId === selectedReseller.id}
                          className="flex-1 min-w-[120px] bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {selectedReseller.status === "rejected" && (
                      <button
                        onClick={() => updateStatus(selectedReseller.id, "approved")}
                        disabled={updatingId === selectedReseller.id}
                        className="flex-1 min-w-[120px] bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Re-approve
                      </button>
                    )}
                    {selectedReseller.status === "approved" && (
                      <a
                        href={`https://www.intactconnect.com.gh/store/${selectedReseller.storeSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[140px] border border-border text-text py-2.5 rounded-lg font-medium text-sm hover:bg-surface transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" /> View Store
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteReseller(selectedReseller)}
                      disabled={deleting || (selectedReseller.activityCount ?? 0) > 0}
                      className="flex-1 min-w-[120px] bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      title={(selectedReseller.activityCount ?? 0) > 0 ? "Cannot delete — reseller has platform activity" : "Delete Account"}
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
