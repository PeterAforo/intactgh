"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, Plus, Edit, Trash2, Shield, ShieldCheck, User,
  Mail, Phone, Loader2, ChevronLeft, ChevronRight, X, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const ROLES = [
  { value: "admin", label: "Admin", color: "text-red-700 bg-red-50 border-red-200", icon: ShieldCheck, desc: "Full access to everything" },
  { value: "staff", label: "Staff", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Shield, desc: "Manage products, orders, customers" },
  { value: "customer", label: "Customer", color: "text-gray-700 bg-gray-50 border-gray-200", icon: User, desc: "Storefront access only" },
];

function RoleBadge({ role }: { role: string }) {
  const r = ROLES.find((x) => x.value === role) || ROLES[2];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${r.color}`}>
      <r.icon className="w-3 h-3" />{r.label}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("customer");
  const [formPassword, setFormPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("q", search);
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const resetForm = () => {
    setEditId(null); setFormName(""); setFormEmail(""); setFormPhone("");
    setFormRole("customer"); setFormPassword(""); setShowForm(false); setShowPw(false);
  };

  const handleEdit = (u: Any) => {
    setEditId(u.id); setFormName(u.name || ""); setFormEmail(u.email);
    setFormPhone(u.phone || ""); setFormRole(u.role); setFormPassword("");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formName || !formEmail) { toast.error("Name and email are required"); return; }
    if (!editId && (!formPassword || formPassword.length < 8)) {
      toast.error("Password must be at least 8 characters"); return;
    }
    setSaving(true);
    try {
      const body: Any = { name: formName, email: formEmail, phone: formPhone, role: formRole };
      if (formPassword) body.password = formPassword;

      const res = editId
        ? await fetch(`/api/admin/users/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(editId ? "User updated" : "User created");
      resetForm(); fetchUsers();
    } catch (e: Any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("User deleted"); fetchUsers();
    } catch (e: Any) { toast.error(e.message || "Failed to delete"); }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`Role changed to ${newRole}`);
      fetchUsers();
    } catch (e: Any) { toast.error(e.message || "Failed to update role"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Users & Roles</h1>
          <p className="text-text-muted text-sm mt-1">{total} total users — manage roles and permissions</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3">
        {ROLES.map((r) => (
          <div key={r.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${r.color}`}>
            <r.icon className="w-3.5 h-3.5" />
            <span className="font-semibold">{r.label}</span>
            <span className="opacity-70">— {r.desc}</span>
          </div>
        ))}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text">{editId ? "Edit User" : "New User"}</h2>
            <button onClick={resetForm}><X className="w-5 h-5 text-text-muted" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" className="rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Email <span className="text-red-500">*</span></label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="user@example.com" className="rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Phone</label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+233..." className="rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Role <span className="text-red-500">*</span></label>
              <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-text block mb-1.5">
                Password {editId ? "(leave blank to keep current)" : <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editId ? "New password (optional)" : "Min 8 characters"} className="rounded-lg pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSubmit} disabled={saving} className="rounded-lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editId ? "Update User" : "Create User"}
            </Button>
            <Button variant="ghost" onClick={resetForm} className="rounded-lg">Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-lg bg-surface border-0" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-surface border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent">
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Orders</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u: Any) => (
                  <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          u.role === "admin" ? "bg-red-100 text-red-700" : u.role === "staff" ? "bg-blue-100 text-blue-700" : "bg-accent/10 text-accent"
                        }`}>
                          {(u.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-text">{u.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <p className="text-xs text-text-muted flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                        {u.phone && <p className="text-xs text-text-muted flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border cursor-pointer ${
                          u.role === "admin" ? "text-red-700 bg-red-50 border-red-200" :
                          u.role === "staff" ? "text-blue-700 bg-blue-50 border-blue-200" :
                          "text-gray-700 bg-gray-50 border-gray-200"
                        }`}
                      >
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="outline" className="text-xs">{u._count?.orders ?? 0}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(u)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u.id, u.name)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-text-muted text-sm">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-xs text-text-muted">Page {page} of {totalPages} ({total} users)</p>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded-lg hover:bg-surface disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1.5 rounded-lg hover:bg-surface disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
